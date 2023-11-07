import fastapi
from fastapi import UploadFile, File

from app.core.benchmark_repository import BenchmarkRepository

router = fastapi.APIRouter()


@router.post("/upload")
async def upload_benchmark_file(file: UploadFile = File(...)):
    contents = await file.read()
    decoded_content = contents.decode('utf-8').splitlines()
    br = BenchmarkRepository()
    return br.read_benchmark_file(decoded_content)
