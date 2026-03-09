"""SQLite storage for users, tokens, and todolist selections."""

import sqlite3
import uuid
import time
import os

DB_PATH = os.getenv("DB_PATH", os.path.join(os.path.dirname(__file__), "app.db"))


class DB:
    def __init__(self, path: str = DB_PATH):
        self.conn = sqlite3.connect(path, check_same_thread=False)
        self.conn.row_factory = sqlite3.Row

    def close(self):
        self.conn.close()

    def get_user_by_session(self, session_id: str) -> dict | None:
        row = self.conn.execute(
            "SELECT * FROM users WHERE session_id = ?", (session_id,)
        ).fetchone()
        return dict(row) if row else None

    def upsert_user(
        self,
        basecamp_id: int,
        name: str,
        email: str,
        account_id: int,
        account_href: str,
        access_token: str,
        refresh_token: str,
        expires_in: int,
    ) -> str:
        session_id = uuid.uuid4().hex
        expires_at = int(time.time()) + expires_in
        existing = self.conn.execute(
            "SELECT id FROM users WHERE basecamp_id = ?", (basecamp_id,)
        ).fetchone()
        if existing:
            self.conn.execute(
                """UPDATE users SET name=?, email=?, account_id=?, account_href=?,
                   access_token=?, refresh_token=?, expires_at=?, session_id=?
                   WHERE basecamp_id=?""",
                (name, email, account_id, account_href, access_token,
                 refresh_token, expires_at, session_id, basecamp_id),
            )
        else:
            self.conn.execute(
                """INSERT INTO users
                   (basecamp_id, name, email, account_id, account_href,
                    access_token, refresh_token, expires_at, session_id)
                   VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)""",
                (basecamp_id, name, email, account_id, account_href,
                 access_token, refresh_token, expires_at, session_id),
            )
        self.conn.commit()
        return session_id

    def update_tokens(self, user_id: int, token_data: dict):
        expires_at = int(time.time()) + token_data.get("expires_in", 1209600)
        self.conn.execute(
            "UPDATE users SET access_token=?, refresh_token=?, expires_at=? WHERE id=?",
            (token_data["access_token"], token_data.get("refresh_token", ""),
             expires_at, user_id),
        )
        self.conn.commit()

    def save_selections(self, user_id: int, selections: list[dict]):
        self.conn.execute(
            "DELETE FROM selections WHERE user_id = ?", (user_id,)
        )
        for s in selections:
            self.conn.execute(
                """INSERT INTO selections (user_id, project_id, project_name, todolist_id, todolist_name)
                   VALUES (?, ?, ?, ?, ?)""",
                (user_id, s["project_id"], s["project_name"],
                 s["todolist_id"], s["todolist_name"]),
            )
        self.conn.commit()

    def get_selections(self, user_id: int) -> list[dict]:
        rows = self.conn.execute(
            "SELECT * FROM selections WHERE user_id = ?", (user_id,)
        ).fetchall()
        return [dict(r) for r in rows]


def init_db():
    db = DB()
    db.conn.executescript("""
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            basecamp_id INTEGER UNIQUE NOT NULL,
            name TEXT,
            email TEXT,
            account_id INTEGER,
            account_href TEXT,
            access_token TEXT NOT NULL,
            refresh_token TEXT NOT NULL,
            expires_at INTEGER NOT NULL,
            session_id TEXT UNIQUE
        );
        CREATE TABLE IF NOT EXISTS selections (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            project_id INTEGER NOT NULL,
            project_name TEXT,
            todolist_id INTEGER NOT NULL,
            todolist_name TEXT,
            FOREIGN KEY (user_id) REFERENCES users(id)
        );
    """)
    db.close()


def get_db():
    db = DB()
    try:
        yield db
    finally:
        db.close()
