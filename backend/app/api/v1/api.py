from fastapi import APIRouter
from . import calculator, benchmark

api_router = APIRouter()
api_router.include_router(calculator.router, prefix="/calculator", tags=["calculator"])
api_router.include_router(benchmark.router, prefix="/benchmark", tags=["benchmark"])
