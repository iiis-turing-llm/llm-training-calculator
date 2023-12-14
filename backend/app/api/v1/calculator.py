import json

import fastapi
from app.config import settings
from app.core.calculate_repository import CalculateRepository, OptimizationStrategyType
from app.models.calculator_input import Cluster, Model, OtherConfig
from app.models.calculator_input import InputConfig
from app.models.calculator_result import Parameter, RecommendedConfig, MemoryUsage, \
    Computation, Communication, Timeline, TotalTime
from fastapi import Body, UploadFile, File
from fastapi.responses import FileResponse

router = fastapi.APIRouter()


@router.get("/gpu")
def gpu_list():
    return settings.GPU_LIST


@router.get("/model")
def model_list():
    return settings.MODEL_LIST


@router.post("/parameter_metrics")
def calculate_params(model: Model):
    cr = CalculateRepository()
    params = cr.parameter_metrics(model)
    return params


@router.post("/recommended_tensor")
def recommended_tensor(cluster: Cluster, model: Model):
    cr = CalculateRepository()
    recomended_tensor_parallel_degree = cr.recommended_tensor(cluster, model)
    return recomended_tensor_parallel_degree


@router.post("/recommended_pipeline")
def recommended_pipeline(cluster: Cluster,
                         model: Model,
                         optimization_strategy: str = Body("Full recomputation"),
                         tensor_parallel_degree: int = Body(...)):
    cr = CalculateRepository()
    recomended_pipeline_parallel_degree = cr.recommended_pipeline(cluster, model, optimization_strategy,
                                                                  tensor_parallel_degree)
    return recomended_pipeline_parallel_degree


@router.post("/recommended_microbatch")
def recommended_microbatch(model: Model,
                           pipeline_parallel_degree: int = Body(...)):
    cr = CalculateRepository()
    recommended_config = cr.recommended_microbatch(model, pipeline_parallel_degree)
    return recommended_config


@router.post("/")
def create_calculator(cluster: Cluster,
                      model: Model,
                      other_config: OtherConfig,
                      input_config: InputConfig):
    cr = CalculateRepository()
    return cr.calculate(cluster, model, other_config, input_config)


@router.post("/download")
def create_calculator(cluster: Cluster,
                      model: Model,
                      other_config: OtherConfig,
                      input_config: InputConfig,
                      parameter: Parameter,
                      recommended_config: RecommendedConfig,
                      memory_usage: MemoryUsage,
                      computation: Computation,
                      communication: Communication,
                      timeline: Timeline,
                      total_time: TotalTime):
    cr = CalculateRepository()
    file = cr.write_result_to_file(cluster, model, other_config, input_config, parameter, recommended_config,
                                   memory_usage,
                                   computation,
                                   communication, timeline, total_time)
    return FileResponse(file, filename="calculator.xlsx")


@router.post("/upload")
async def upload_file(file: UploadFile = File(...)):
    content = await file.read()  # 读取文件内容
    cr = CalculateRepository()
    tl, tt, other_config = cr.read_file_to_timeline(content)
    # 将tl和tt合并为一个字典
    result_dict = {"timeline": tl.dict(), "total_time": tt.dict(), "other_config": other_config.dict()}
    # 返回JSON格式的结果
    return result_dict


@router.post("/download_result_model")
def download_template():
    return FileResponse(settings.CALCULATOR_RESULT_TEMPLATE, filename="template.xlsx")


@router.get("/optimization_strategies")
def get_optimization_strategies():
    return [strategy.value for strategy in OptimizationStrategyType]
