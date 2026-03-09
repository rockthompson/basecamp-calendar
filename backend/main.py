"""
Basecamp Calendar Aggregator — FastAPI backend.
Handles OAuth, per-user token storage, and Basecamp API proxying.
"""

import os
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request, Response, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import RedirectResponse

from auth import (
    get_authorization_url,
    exchange_code,
    refresh_access_token,
    SESSION_COOKIE,
)
from database import init_db, get_db, DB
from basecamp import BasecampClient


@asynccontextmanager
async def lifespan(app: FastAPI):
    init_db()
    yield


app = FastAPI(title="Basecamp Calendar", lifespan=lifespan)

FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:5173")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[FRONTEND_URL],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# --------------- helpers ---------------

def current_user(request: Request, db: DB = Depends(get_db)) -> dict:
    """Return the current user row or raise 401."""
    session_id = request.cookies.get(SESSION_COOKIE)
    if not session_id:
        raise HTTPException(401, "Not authenticated")
    user = db.get_user_by_session(session_id)
    if not user:
        raise HTTPException(401, "Session expired")
    return user


async def bc_client(request: Request, db: DB = Depends(get_db)) -> BasecampClient:
    """Return an authenticated BasecampClient, refreshing tokens if needed."""
    user = current_user(request, db)
    client = BasecampClient(user["access_token"], user["account_id"])
    if client.token_needs_refresh(user["expires_at"]):
        new_tokens = refresh_access_token(user["refresh_token"])
        db.update_tokens(user["id"], new_tokens)
        client.access_token = new_tokens["access_token"]
    return client


# --------------- auth routes ---------------

@app.get("/auth/login")
def login():
    return RedirectResponse(get_authorization_url())


@app.get("/auth/callback")
def callback(code: str, response: Response, db: DB = Depends(get_db)):
    token_data = exchange_code(code)
    # Get user identity and account
    client = BasecampClient(token_data["access_token"])
    identity = client.get_identity()
    account = client.pick_account(identity)
    client.account_id = account["id"]

    session_id = db.upsert_user(
        basecamp_id=identity["id"],
        name=identity.get("name", ""),
        email=identity.get("email_address", ""),
        account_id=account["id"],
        account_href=account["href"],
        access_token=token_data["access_token"],
        refresh_token=token_data["refresh_token"],
        expires_in=token_data.get("expires_in", 1209600),
    )

    resp = RedirectResponse(f"{FRONTEND_URL}/")
    resp.set_cookie(
        SESSION_COOKIE,
        session_id,
        httponly=True,
        secure=os.getenv("RENDER", False),
        samesite="lax",
        max_age=60 * 60 * 24 * 30,  # 30 days
    )
    return resp


@app.get("/auth/me")
def me(user: dict = Depends(current_user)):
    return {"id": user["id"], "name": user["name"], "email": user["email"]}


@app.post("/auth/logout")
def logout(response: Response):
    resp = Response(status_code=204)
    resp.delete_cookie(SESSION_COOKIE)
    return resp


# --------------- basecamp data routes ---------------

@app.get("/api/projects")
async def list_projects(client: BasecampClient = Depends(bc_client)):
    return client.get_projects()


@app.get("/api/projects/{project_id}/todolists")
async def list_todolists(
    project_id: int, client: BasecampClient = Depends(bc_client)
):
    return client.get_todolists(project_id)


@app.get("/api/projects/{project_id}/todolists/{todolist_id}/todos")
async def list_todos(
    project_id: int,
    todolist_id: int,
    client: BasecampClient = Depends(bc_client),
):
    return client.get_todos(project_id, todolist_id)


@app.get("/api/calendar")
async def calendar_todos(
    request: Request,
    db: DB = Depends(get_db),
    client: BasecampClient = Depends(bc_client),
):
    """Return all todos from the user's selected todolists, with due dates."""
    user = current_user(request, db)
    selections = db.get_selections(user["id"])
    if not selections:
        return []

    all_todos = []
    for sel in selections:
        todos = client.get_todos(sel["project_id"], sel["todolist_id"])
        for t in todos:
            if t.get("due_on"):
                all_todos.append({
                    "id": t["id"],
                    "title": t["title"],
                    "due_on": t["due_on"],
                    "completed": t["completed"],
                    "project_id": sel["project_id"],
                    "project_name": sel["project_name"],
                    "todolist_name": sel["todolist_name"],
                    "assignees": [a["name"] for a in t.get("assignees", [])],
                    "url": t.get("app_url", ""),
                })
    return all_todos


@app.post("/api/selections")
async def save_selections(
    request: Request,
    db: DB = Depends(get_db),
):
    """Save user's selected todolists. Body: list of {project_id, project_name, todolist_id, todolist_name}."""
    user = current_user(request, db)
    body = await request.json()
    db.save_selections(user["id"], body)
    return {"ok": True}


@app.get("/api/selections")
async def get_selections(
    request: Request,
    db: DB = Depends(get_db),
):
    user = current_user(request, db)
    return db.get_selections(user["id"])
