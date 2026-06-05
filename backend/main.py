from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from routes.auth import router as auth_router
from routes.projects import router as projects_router
from routes.bug import router as bugs_router


app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "https://bug-tracker-nljuzyvm9-areeb-s-projects4.vercel.app",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router, prefix="/api/auth", tags=["Auth"])
app.include_router(bugs_router, prefix="/api/bugs", tags=["Bugs"])
app.include_router(projects_router, prefix="/api/projects", tags=["Projects"])


@app.get("/")
def home():
    return {"message": "Bug Tracker API"}
