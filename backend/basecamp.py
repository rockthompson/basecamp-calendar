"""Basecamp 3/4 API client."""

import time
import requests

USER_AGENT = "BasecampCalendar (rock@example.com)"  # Basecamp requires a User-Agent


class BasecampClient:
    def __init__(self, access_token: str, account_id: int | None = None):
        self.access_token = access_token
        self.account_id = account_id
        self.session = requests.Session()
        self.session.headers.update({
            "Authorization": f"Bearer {access_token}",
            "User-Agent": USER_AGENT,
            "Content-Type": "application/json",
        })

    @property
    def base_url(self) -> str:
        return f"https://3.basecampapi.com/{self.account_id}"

    def token_needs_refresh(self, expires_at: int) -> bool:
        return time.time() > expires_at - 300  # refresh 5 min early

    def _get(self, url: str) -> dict | list:
        resp = self.session.get(url)
        resp.raise_for_status()
        return resp.json()

    def _get_paginated(self, url: str) -> list:
        results = []
        while url:
            resp = self.session.get(url)
            resp.raise_for_status()
            results.extend(resp.json())
            # Basecamp uses Link header for pagination
            link = resp.headers.get("Link", "")
            url = None
            if 'rel="next"' in link:
                url = link.split("<")[1].split(">")[0]
        return results

    def get_identity(self) -> dict:
        data = self._get("https://launchpad.37signals.com/authorization.json")
        return data["identity"]

    def pick_account(self, identity_response: dict | None = None) -> dict:
        if identity_response is None:
            data = self._get("https://launchpad.37signals.com/authorization.json")
        else:
            data = self._get("https://launchpad.37signals.com/authorization.json")
        # Pick the first Basecamp 3 or 4 account (product = "bc3" or "bc4")
        for acct in data.get("accounts", []):
            if acct.get("product") in ("bc3", "bc4"):
                return acct
        # Fallback to first account
        return data["accounts"][0]

    def get_projects(self) -> list:
        return self._get_paginated(f"{self.base_url}/projects.json")

    def get_todolists(self, project_id: int) -> list:
        # First get the project to find the todoset
        project = self._get(f"{self.base_url}/projects/{project_id}.json")
        todoset = None
        for tool in project.get("dock", []):
            if tool.get("name") == "todoset":
                todoset = tool
                break
        if not todoset:
            return []
        todoset_url = todoset["url"]
        todoset_data = self._get(todoset_url)
        todolists_url = todoset_data.get("todolists_url")
        if not todolists_url:
            return []
        return self._get_paginated(todolists_url)

    def get_todos(self, project_id: int, todolist_id: int) -> list:
        url = f"{self.base_url}/buckets/{project_id}/todolists/{todolist_id}/todos.json"
        return self._get_paginated(url)
