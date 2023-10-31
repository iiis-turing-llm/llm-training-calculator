import fastapi
from fastapi import Body

from app.config import settings
from app.core.calculate_repository import CalculateRepository
from app.models.calculator_input import GPU, Model, OtherConfig

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
