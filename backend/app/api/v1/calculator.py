import fastapi
from fastapi import Body, UploadFile, File
from fastapi.responses import FileResponse
from app.config import settings
from app.core.calculate_repository import CalculateRepository
from app.models.calculator_input import GPU, Model, OtherConfig

from app.models.calculator_result import CalculatorResult, Parameter, RecommendedConfig, MemoryUsage, \
    Computation, Communication, Timeline

router = fastapi.APIRouter()


@router.get("/gpu")
def gpu_list():
    return settings.GPU_LIST


@router.get("/model")
def model_list():
    return settings.MODEL_LIST


@router.get("/read_file")
def read_file():
    cr = CalculateRepository()
    tl = cr.read_file_to_timeline()
    return tl


@router.post("/parameter_metrics")
def calculate_params(model: Model):
    cr = CalculateRepository()
    params = cr.parameter_metrics(model)
    return params


@router.post("/recommended_config")
def recommended_config(gpu: GPU,
                       model: Model,
                       optimization_strategy: str = Body("Full recomputation")):
    cr = CalculateRepository()
    recommended_config = cr.recommended_config(gpu, model, optimization_strategy)
    return recommended_config


@router.post("/")
def create_calculator(gpu: GPU,
                      model: Model,
                      other_config: OtherConfig):
    cr = CalculateRepository()
    return cr.calculate(gpu, model, other_config)


@router.post("/download")
def create_calculator(gpu: GPU,
                      model: Model,
                      other_config: OtherConfig,
                      parameter: Parameter,
                      recommended_config: RecommendedConfig,
                      memory_usage: MemoryUsage,
                      computation: Computation,
                      communication: Communication,
                      timeline: Timeline, ):
    cr = CalculateRepository()
    file = cr.write_result_to_file(gpu, model, other_config, parameter, recommended_config, memory_usage, computation,
                                   communication, timeline)
    return FileResponse(file, filename="calculator.xlsx")


@router.post("/upload")
async def upload_file(file: UploadFile = File(...)):
    content = await file.read()  # 读取文件内容
    cr = CalculateRepository()
    tl = cr.read_file_to_timeline(content)
    return tl

@router.post("/download_result_model")
def create_calculator():
    return FileResponse(settings.CALCULATOR_RESULT_FILE_MODEL, filename="calculator.xlsx")
