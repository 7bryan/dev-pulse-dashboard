## Project structure

```
github-api/
├── backend/
│   ├── main.py                 # The heart of the backend (FastAPI application & endpoints)
│   ├── services.py             # The logic that talks to GitHub API and parses the JSON data
│   └── requirements.txt        # List of Python dependencies (fastapi, requests, etc.)
│
└── frontend/
    ├── index.html              # The structural webpage layout (Input field, button, dashboard area)
    ├── style.css               # The styling and skinning (Sleek layout, cards, fonts, and grid system)
    └── app.js                  # The frontend brain (Captures inputs, sends fetches, updates index.html)
```
