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
