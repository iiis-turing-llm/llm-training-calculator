import argparse

import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.v1.api import api_router
from app.config import settings


def get_application():
    app = FastAPI(title=settings.PROJECT_NAME, openapi_url=f"{settings.API_V1_STR}/openapi.json")

    app.add_middleware(
        CORSMiddleware,
        allow_origins=[str(origin) for origin in settings.BACKEND_CORS_ORIGINS],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    app.include_router(api_router, prefix="/llm_training_calculator")

    @app.on_event("startup")
    def welcome_message():
        print("llm training calculator started")
        print("To stop the server, press Ctrl+C")

    return app


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--port", help="The port to run the llm training calculator", default=8000)
    args = parser.parse_args()
    port = int(args.port)

    app = get_application()
    uvicorn.run(app, host="0.0.0.0", port=port)
