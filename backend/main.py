import httpx
from fastapi import FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from services import (
    GithubRateLimitError,
    fetch_github_data,
    fetch_user_repo_commits,
    fetch_user_repo_data,
    fetch_user_repo_issues,
    fetch_user_repos,
)

app = FastAPI(title="Github User Proxy Services")

# defining allowed origins
origins = [
    "http://localhost:3000",
]

# condigure CORS so the frontend can talk to the backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,  # allowed domains
    allow_credentials=True,
    allow_methods=["*"],  # allow all standard http method (GET, POST, etc)
    allow_headers=["*"],  # allow all custom or standard request headers
)


# helper error handling function
# async def error_handling():
# not builded yet
# ...


# refactor (fixing future bug)
# defining the endpoint of the application instance
@app.get("/github/{username}")
async def get_github_user(username: str):
    # endpoint that accept a username, triggers the services layer
    # and handles the parsed json results
    try:
        # await asycn function from services.py
        data = await fetch_github_data(username)

    # if someone intentionally raised an HTTPException, pass it along
    except HTTPException:
        raise

    # catch rate limit or deeper errors raised by the service layer
    except GithubRateLimitError:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Rate limit exceeded. Please try again later",
        )
    # except httpx.HTTPStatusError:
    #     raise HTTPException(
    #         status_code=status.HTTP_429_TOO_MANY_REQUESTS,
    #         detail="Rate limit exceeded. Please try again later",
    #     )

    except Exception:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An unexpected error occurred",
        )

    # if Github returned a 404 or something went wrong , data will be None
    if data is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Github user '{username}' not found or service unavailable",
        )

    # return the parsed dictionary. FastAPI convert it to JSON automatically
    return data


@app.get("/github/{username}/repos")
async def get_user_github_repos(username: str):
    try:
        data = await fetch_user_repos(username)

    except HTTPException:
        raise

    # catch rate limit or deeper errors raised by the service layer
    except GithubRateLimitError:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Rate limit exceeded. Please try again later",
        )

    except Exception:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An unexpected error occurred",
        )

    if data is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Github user '{username}' not found or don't have any repo",
        )

    return data


@app.get("/github/{username}/repos/{repo}")
async def get_user_github_repo_data(username: str, repo: str):
    try:
        data = await fetch_user_repo_data(username, repo)

    except HTTPException:
        raise

    # catch rate limit or deeper errors raised by the service layer
    except GithubRateLimitError:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Rate limit exceeded. Please try again later",
        )

    except Exception:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An unexpected error occurred",
        )

    if data is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Repository '{repo}' not found",
        )

    return data


@app.get("/github/{username}/repos/{repo}/issues")
async def get_user_github_repo_issues(username: str, repo: str):
    try:
        # repo_data = await fetch_user_repo_data(username, repo)

        # if not repo_data["has_issues"]:
        #     return {"status": "This repo don't have issues"}

        data = await fetch_user_repo_issues(username, repo)

    except HTTPException:
        raise

    # catch rate limit or deeper errors raised by the service layer
    except GithubRateLimitError:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Rate limit exceeded. Please try again later",
        )

    except Exception:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An unexpected error occurred",
        )

    if data is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"No Issues found or repository not found",
        )

    return data


@app.get("/github/{username}/repos/{repo}/commits")
async def get_user_github_repo_commits(username: str, repo: str):
    try:
        data = await fetch_user_repo_commits(username, repo)

    except HTTPException:
        raise

    # catch rate limit or deeper errors raised by the service layer
    except GithubRateLimitError:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Rate limit exceeded. Please try again later",
        )

    except Exception:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An unexpected error occurred",
        )

    if data is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail=f"something wrong {data}"
        )

    return data


# a separate base point to test if the server is working
@app.get("/")
def read_root():
    return {"status": "success", "message": "FastAPI application is running"}


@app.get("/health")
def health_check():
    return {"status": "ok"}
