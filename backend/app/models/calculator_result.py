from pydantic import BaseModel


class Parameter(BaseModel):
    word_embedding: int = 0
    self_attention: int = 0
    feed_forward: int = 0
    position_embedding: int = 0
    total_parameters: int = 0


class RecommendedConfig(BaseModel):
    recomended_tensor_parallel_degree: int = 0
    recomended_pipeline_parallel_degree: int = 0
    recommended_microbatch: int = 0


class MemoryUsage(BaseModel):
    optimizer_states: float = 0
    weights: float = 0
    gradients: float = 0
    activation: float = 0
    overall_usage: float = 0


class Computation(BaseModel):
    per_device_layers: float = 0
    num_microbatches: float = 0
    total_forward_computation_time: float = 0
    per_loop_forward_computation_time: float = 0
    total_backward_computation_time: float = 0
    per_loop_backward_computation_time: float = 0


class Communication(BaseModel):
    total_forward_allgather_time: float = 0
    per_loop_forward_allgather_time: float = 0
    total_backward_allgather_time: float = 0
    per_loop_backward_allgather_time: float = 0
    total_backward_reduce_scatter_time: float = 0
    per_loop_backward_reduce_scatter_time: float = 0
    total_p2p_time: float = 0
    per_loop_p2p_time: float = 0
    word_embedding_allreduce_time: float = 0
    gradient_allreduce_time: float = 0


class Timeline(BaseModel):
    per_device_layers: int = 0
    num_microbatches: int = 0
    per_loop_forward_computation_time: float = 0
    per_loop_backward_computation_time: float = 0
    per_loop_forward_allgather_time: float = 0
    per_loop_backward_allgather_time: float = 0
    per_loop_backward_reduce_scatter_time: float = 0
    forward_time: float = 0
    forward_gpu_usage: float = 0
    backward_time: float = 0
    backward_gpu_usage: float = 0
    warmup_time: float = 0
    cooldown_time: float = 0
    stable_time: float = 0
    allreduce_time: float = 0
    per_iter_training_time: float = 0



class TotalTime(BaseModel):
    global_minibatch_size: float = 0
    global_number_of_samples: float = 0
    total_training_time: float = 0
    total_number_of_iters: float = 0
    totoal_number_of_gpus: int = 0

class CalculatorResult(BaseModel):
    parameter: Parameter
    recommended_config: RecommendedConfig
    memory_usage: MemoryUsage
    computation: Computation
    communication: Communication
    timeline: Timeline
    total_time: TotalTime
