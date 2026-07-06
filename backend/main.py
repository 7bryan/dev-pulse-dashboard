from fastapi import FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from services import fetch_github_data

app = FastAPI(title="Github User Proxy Services")

# condigure CORS so the frontend can talk to the backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["http://localhost:3000"],
    allow_headers=["http://localhost:3000"],
)


# defining the endpoint of the application instance
@app.get("/github/{username}")
async def get_github_user(username: str):
    # endpoint that accept a username, triggers the services layer
    # and handles the parsed json results
    try:
        # await asycn function from services.py
        data = await fetch_github_data(username)

        # if Github returned a 404 or something went wrong , data will be None
        if data is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Github user '{username}' not found or service unavailable",
            )

        # return the parsed dictionary. FastAPI convert it to JSON automatically
        return data
    except Exception as e:
        # catch rate limit or deeper errors raised by the service layer
        if "Too many requests" in str(e):
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail="Rate limit exceeded. Please try again later",
            )
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An unexpected error occured",
        )


# a separate base point to test if the server is working
@app.get("/")
def read_root():
    return {"status": "success", "message": "FastAPI application is running"}


@app.get("/health")
def health_check():
    return {"status": "ok"}
