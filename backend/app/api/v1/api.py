from fastapi import APIRouter
from . import calculator

api_router = APIRouter()
api_router.include_router(calculator.router, prefix="/calculator", tags=["calculator"])
