"""OAuth helpers for Basecamp 3/4."""

import os
from urllib.parse import urlencode

import requests

CLIENT_ID = os.environ["BASECAMP_CLIENT_ID"]
CLIENT_SECRET = os.environ["BASECAMP_CLIENT_SECRET"]
REDIRECT_URI = os.getenv("BASECAMP_REDIRECT_URI", "http://localhost:3000/auth/callback")

SESSION_COOKIE = "bc_session"

AUTHORIZE_URL = "https://launchpad.37signals.com/authorization/new"
TOKEN_URL = "https://launchpad.37signals.com/authorization/token"


def get_authorization_url() -> str:
    params = {
        "type": "web_server",
        "client_id": CLIENT_ID,
        "redirect_uri": REDIRECT_URI,
    }
    return f"{AUTHORIZE_URL}?{urlencode(params)}"


def exchange_code(code: str) -> dict:
    resp = requests.post(TOKEN_URL, params={
        "type": "web_server",
        "client_id": CLIENT_ID,
        "redirect_uri": REDIRECT_URI,
        "client_secret": CLIENT_SECRET,
        "code": code,
    })
    resp.raise_for_status()
    return resp.json()


def refresh_access_token(refresh_token: str) -> dict:
    resp = requests.post(TOKEN_URL, params={
        "type": "refresh",
        "client_id": CLIENT_ID,
        "redirect_uri": REDIRECT_URI,
        "client_secret": CLIENT_SECRET,
        "refresh_token": refresh_token,
    })
    resp.raise_for_status()
    return resp.json()
