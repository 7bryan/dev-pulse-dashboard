from typing import Any, Dict, Optional

import httpx

HEADERS = {"User-Agent": "Awecome-Octocat-App"}


async def fetch_github_data(username: str) -> Optional[Dict[str, Any]]:
    url = f"https://api.github.com/users/{username}"

    try:
        # using httpx.AsyncClient for non blocking networks calls (asynchronous)
        async with httpx.AsyncClient() as client:
            response = await client.get(url, headers=HEADERS)

            if response.status_code == 200:
                # return the parsed json as Dictionary
                return response.json()
            elif response.status_code == 429:
                # instead of using print, raise an exception or handle it via a status indicator
                raise httpx.HTTPStatusError(
                    "Too many requests to Github API",
                    request=response.request,
                    response=response,
                )
            else:
                return None
    except httpx.RequestError as e:
        # catching connection errors, timeout, etc. safely
        print(f"Network error occur {e}")
        return None


async def fetch_user_repos(username: str) -> Optional[Dict[str, Any]]:
    # getting all repo of <username>
    url = f"https://api.github.com/users/{username}/repos"

    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(url, headers=HEADERS)

            if response.status_code == 200:
                return response.json()
            elif response.status_code == 429:
                raise httpx.HTTPStatusError(
                    "Too many requests to github API",
                    request=response.request,
                    response=response,
                )
            else:
                return None
    except httpx.RequestError as e:
        print(f"network error occur {e}")
        return None


async def fetch_user_repo_data(username: str, repo: str) -> Optional[Dict[str, Any]]:
    url = f"https://api.github.com/repos/{username}/{repo}"

    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(url, headers=HEADERS)

            if response.status_code == 200:
                return response.json()
            elif response.status_code == 429:
                raise httpx.HTTPStatusError(
                    "Too many requests to Github API",
                    request=response.request,
                    response=response,
                )
            else:
                return None
    except httpx.RequestError as e:
        print(f"network error occur {e}")
        return None


# for getting data of repo issues
async def fetch_user_repo_issues(username: str, repo: str) -> Optional[Dict[str, Any]]:
    # base url for getting a repo issues of target username
    url = f"https://api.github.com/repos/{username}/{repo}/issues"

    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(url, headers=HEADERS)

            if response.status_code == 200:
                return response.json()
            elif response.status_code == 429:
                raise httpx.HTTPStatusError(
                    "Too many requests to github API",
                    request=response.request,
                    response=response,
                )
            else:
                return None
    except httpx.RequestError as e:
        print(f"network error occur {e}")
        return None


# retrun commits of the user repo
async def fetch_user_repo_commits(username: str, repo: str) -> Optional[Dict[str, Any]]:
    url = f"https://api.github.com/repos/{username}/{repo}/commits"

    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(url, headers=HEADERS)

            if response.status_code == 200:
                return response.json()
            elif response.status_code == 429:
                raise httpx.HTTPStatusError(
                    "Too many requests to Github API",
                    request=response.request,
                    response=response,
                )
            else:
                return None
    except httpx.RequestError as e:
        print(f"network error occur {e}")
        return None
