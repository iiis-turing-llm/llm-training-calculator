import fastapi
from app.config import settings
from app.core.calculate_repository import CalculateRepository
from app.models.calculator_input import GPU, Model, OtherConfig
from app.models.calculator_input import TotalTrainConfig
from app.models.calculator_result import Parameter, RecommendedConfig, MemoryUsage, \
    Computation, Communication, Timeline
from fastapi import Body, UploadFile, File
from fastapi.responses import FileResponse

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


@router.post("/recommended_tensor")
def recommended_tensor(gpu: GPU, model: Model):
    cr = CalculateRepository()
    recomended_tensor_parallel_degree = cr.recommended_tensor(gpu, model)
    return recomended_tensor_parallel_degree


@router.post("/recommended_pipeline")
def recommended_pipeline(gpu: GPU,
                         model: Model,
                         optimization_strategy: str = Body("Full recomputation"),
                         recomended_tensor_parallel_degree: int = Body(...)):
    cr = CalculateRepository()
    recomended_pipeline_parallel_degree = cr.recommended_pipeline(gpu, model, optimization_strategy,
                                                                  recomended_tensor_parallel_degree)
    return recomended_pipeline_parallel_degree


@router.post("/recommended_microbatch")
def recommended_microbatch(model: Model,
                           recomended_pipeline_parallel_degree: int = Body(...)):
    cr = CalculateRepository()
    recommended_config = cr.recommended_microbatch(model, recomended_pipeline_parallel_degree)
    return recommended_config


@router.post("/")
def create_calculator(gpu: GPU,
                      model: Model,
                      other_config: OtherConfig,
                      total_train_config: TotalTrainConfig):
    cr = CalculateRepository()
    return cr.calculate(gpu, model, other_config, total_train_config)


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
def download_template():
    return FileResponse(settings.CALCULATOR_RESULT_TEMPLATE, filename="template.xlsx")
