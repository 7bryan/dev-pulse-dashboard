from typing import Any, Dict, Optional

import httpx

HEADERS = {"User-Agent": "Awecome-Octocat-App"}


async def request_github(url):
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


async def fetch_github_data(username: str) -> Optional[Dict[str, Any]]:
    url = f"https://api.github.com/users/{username}"

    return await request_github(url)


async def fetch_user_repos(username: str) -> Optional[Dict[str, Any]]:
    # getting all repo of <username>
    url = f"https://api.github.com/users/{username}/repos"

    return await request_github(url)


async def fetch_user_repo_data(username: str, repo: str) -> Optional[Dict[str, Any]]:
    url = f"https://api.github.com/repos/{username}/{repo}"

    return await request_github(url)


# for getting data of repo issues
async def fetch_user_repo_issues(username: str, repo: str) -> Optional[Dict[str, Any]]:
    # base url for getting a repo issues of target username
    url = f"https://api.github.com/repos/{username}/{repo}/issues"

    return await request_github(url)


# retrun commits of the user repo
async def fetch_user_repo_commits(username: str, repo: str) -> Optional[Dict[str, Any]]:
    url = f"https://api.github.com/repos/{username}/{repo}/commits"

    return await request_github(url)
