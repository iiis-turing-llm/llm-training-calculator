import math
from enum import Enum
from io import BytesIO
from tempfile import NamedTemporaryFile

import openpyxl
from app.config import settings
from app.models.calculator_input import Cluster, Model, OtherConfig
from app.models.calculator_input import InputConfig
from app.models.calculator_result import MemoryUsage, Computation, Communication, Timeline, TotalTime, CalculatorResult, \
    Parameter, RecommendedConfig


class OptimizationStrategyType(Enum):
    FULL_RECOMPUTATION = "Full recomputation"
    NO_RECOMPUTATION = "No recomputation"
    SELECTIVE_RECOMPUTATION = "Selective recomputation"


class CalculateRepository:

    def parameter_metrics(self, model: Model):
        params = Parameter()
        params.word_embedding = model.hidden_layer_size * model.vocab_size
        params.self_attention = 4 * model.hidden_layer_size * model.hidden_layer_size
        params.feed_forward = 8 * model.hidden_layer_size * model.hidden_layer_size + 5 * model.hidden_layer_size
        params.position_embedding = model.hidden_layer_size * model.token_length
        params.total_parameters = params.word_embedding + params.position_embedding + (
                params.self_attention + params.feed_forward) * model.num_layers
        return params

    def recommended_tensor(self, cluster: Cluster, model: Model):
        return min(8, max(1, math.floor(
            3 * model.hidden_layer_size / cluster.fp32_processing_power * cluster.bus_bandwidth / 2 / 1000)))

    def recommended_pipeline(self, cluster: Cluster, model: Model, optimization_strategy, tensor_parallel_degree):
        params = self.parameter_metrics(model)
        if optimization_strategy == OptimizationStrategyType.FULL_RECOMPUTATION.value:
            return math.ceil((16 * params.total_parameters / tensor_parallel_degree) / (
                    cluster.memory * 1e9 - model.num_layers * model.token_length * model.minibatch_size * model.hidden_layer_size * 2 / tensor_parallel_degree))
        elif optimization_strategy == OptimizationStrategyType.NO_RECOMPUTATION.value:
            return math.ceil((16 * params.total_parameters / tensor_parallel_degree) / (
                    cluster.memory * 1e9 - model.num_layers * model.token_length * model.minibatch_size * model.hidden_layer_size * (
                    10 + 24 / tensor_parallel_degree + 5 * model.num_attention_heads * model.token_length / model.hidden_layer_size) / tensor_parallel_degree))
        elif optimization_strategy == OptimizationStrategyType.SELECTIVE_RECOMPUTATION.value:
            return math.ceil((16 * params.total_parameters / tensor_parallel_degree) / (
                    cluster.memory * 1e9 - model.num_layers * model.token_length * model.minibatch_size * model.hidden_layer_size * 34 / tensor_parallel_degree))

    def recommended_microbatch(self, model: Model, pipeline_parallel_degree):
        return max(1, math.floor(model.minibatch_size / 4 / pipeline_parallel_degree))

    def calculate(self, cluster: Cluster, model: Model, other_config: OtherConfig, input_config: InputConfig):
        params = self.parameter_metrics(model)
        recomended_tensor_parallel_degree = self.recommended_tensor(cluster, model)
        recomended_pipeline_parallel_degree = self.recommended_pipeline(cluster, model,
                                                                        other_config.optimization_strategy,
                                                                        other_config.tensor_parallel_degree)
        recommended_microbatch = self.recommended_microbatch(model, other_config.pipeline_parallel_degree)

        memory = MemoryUsage()
        memory.optimizer_states = 12 * params.total_parameters / other_config.tensor_parallel_degree / other_config.pipeline_parallel_degree
        memory.weights = 2 * params.total_parameters / other_config.tensor_parallel_degree / other_config.pipeline_parallel_degree
        memory.gradients = 2 * params.total_parameters / other_config.tensor_parallel_degree / other_config.pipeline_parallel_degree
        if other_config.optimization_strategy == OptimizationStrategyType.FULL_RECOMPUTATION.value:
            memory.activation = model.num_layers * model.token_length * model.minibatch_size * model.hidden_layer_size * 2 / other_config.tensor_parallel_degree
        elif other_config.optimization_strategy == OptimizationStrategyType.NO_RECOMPUTATION.value:
            memory.activation = model.num_layers * model.token_length * model.minibatch_size * model.hidden_layer_size * (
                    10 + 24 / other_config.tensor_parallel_degree + 5 * model.num_attention_heads * model.token_length / model.hidden_layer_size / other_config.tensor_parallel_degree)
        elif other_config.optimization_strategy == OptimizationStrategyType.SELECTIVE_RECOMPUTATION.value:
            memory.activation = model.num_layers * model.token_length * model.minibatch_size * model.hidden_layer_size * 34 / other_config.tensor_parallel_degree
        memory.overall_usage = memory.optimizer_states + memory.weights + memory.activation + memory.gradients

        comp = Computation()
        comp.per_device_layers = model.num_layers / other_config.pipeline_parallel_degree
        comp.num_microbatches = model.minibatch_size / other_config.microbatch_size
        comp.total_forward_computation_time = 2 * model.token_length * model.minibatch_size * params.total_parameters / other_config.tensor_parallel_degree / other_config.pipeline_parallel_degree / cluster.fp32_processing_power / 1e12
        comp.per_loop_forward_computation_time = comp.total_forward_computation_time / comp.per_device_layers / comp.num_microbatches
        comp.total_backward_computation_time = 4 * model.token_length * model.minibatch_size * params.total_parameters / other_config.tensor_parallel_degree / other_config.pipeline_parallel_degree / cluster.fp32_processing_power / 1e12
        comp.per_loop_backward_computation_time = comp.total_backward_computation_time / comp.per_device_layers / comp.num_microbatches

        comm = Communication()
        comm.total_forward_allgather_time = 4 * 2 * 2 * 2 * model.hidden_layer_size * model.hidden_layer_size * model.minibatch_size * model.num_layers / other_config.pipeline_parallel_degree / cluster.bus_bandwidth / 1e9
        comm.per_loop_forward_allgather_time = comm.total_forward_allgather_time / comp.per_device_layers / comp.num_microbatches
        comm.total_backward_allgather_time = 4 * 2 * 2 * 2 * model.hidden_layer_size * model.hidden_layer_size * model.minibatch_size * model.num_layers / other_config.pipeline_parallel_degree / cluster.bus_bandwidth / 1e9
        comm.per_loop_backward_allgather_time = comm.total_backward_allgather_time / comp.per_device_layers / comp.num_microbatches
        comm.total_backward_reduce_scatter_time = comm.total_backward_allgather_time
        comm.per_loop_backward_reduce_scatter_time = comm.total_backward_reduce_scatter_time / comp.per_device_layers / comp.num_microbatches
        comm.total_p2p_time = 2 * model.hidden_layer_size * model.hidden_layer_size * model.minibatch_size / other_config.tensor_parallel_degree / cluster.network_bandwidth * 8 * 8 / 1e9
        comm.per_loop_p2p_time = comm.total_p2p_time / comp.num_microbatches
        if other_config.tensor_parallel_degree == 1:
            comm.total_forward_allgather_time = 0
            comm.per_loop_forward_allgather_time = 0
            comm.total_backward_allgather_time = 0
            comm.per_loop_backward_allgather_time = 0
            comm.total_backward_reduce_scatter_time = 0
            comm.per_loop_backward_reduce_scatter_time = 0
        if other_config.pipeline_parallel_degree == 1:
            comm.total_p2p_time = 0
            comm.per_loop_p2p_time = 0
        comm.word_embedding_allreduce_time = params.word_embedding * 2 * 8 / 1e9 / other_config.tensor_parallel_degree / cluster.network_bandwidth
        comm.gradient_allreduce_time = 8 * 2 * 8 / 1e9 * params.total_parameters / other_config.tensor_parallel_degree / other_config.pipeline_parallel_degree / cluster.network_bandwidth

        tl = Timeline()
        tl.per_device_layers = comp.per_device_layers
        tl.num_microbatches = comp.num_microbatches
        tl.per_loop_forward_computation_time = comp.per_loop_forward_computation_time
        tl.per_loop_backward_computation_time = comp.per_loop_backward_computation_time
        tl.per_loop_forward_allgather_time = comm.per_loop_forward_allgather_time
        tl.per_loop_backward_allgather_time = comm.per_loop_backward_allgather_time
        tl.per_loop_backward_reduce_scatter_time = comm.per_loop_backward_reduce_scatter_time
        tl.forward_time = (
                                  comp.total_forward_computation_time + comm.total_forward_allgather_time) / comp.num_microbatches
        tl.forward_gpu_usage = comp.total_forward_computation_time / (
                comp.total_forward_computation_time + comm.total_forward_allgather_time)
        tl.backward_time = (max(comm.total_backward_reduce_scatter_time + comm.total_backward_allgather_time,
                                comp.total_backward_computation_time)) / comp.num_microbatches
        tl.backward_gpu_usage = comp.total_backward_computation_time / (
            max(comm.total_backward_reduce_scatter_time + comm.total_backward_allgather_time,
                comp.total_backward_computation_time))
        tl.warmup_time = (other_config.pipeline_parallel_degree - 1) * tl.forward_time
        tl.cooldown_time = (other_config.pipeline_parallel_degree - 1) * tl.backward_time
        tl.allreduce_time = comm.gradient_allreduce_time + comm.word_embedding_allreduce_time
        tl.stable_time = (tl.forward_time + tl.backward_time) * comp.num_microbatches
        tl.per_iter_training_time = tl.warmup_time + (
                tl.forward_time + tl.backward_time) * comp.num_microbatches + tl.cooldown_time + tl.allreduce_time

        tt = self.calculate_total_time(model=model, time_line=tl, input_config=input_config, other_config=other_config)
        calculator_result = CalculatorResult(parameter=params,
                                             recommended_config=RecommendedConfig(
                                                 recomended_tensor_parallel_degree=recomended_tensor_parallel_degree,
                                                 recomended_pipeline_parallel_degree=recomended_pipeline_parallel_degree,
                                                 recommended_microbatch=recommended_microbatch),
                                             memory_usage=memory,
                                             computation=comp,
                                             communication=comm,
                                             timeline=tl,
                                             total_time=tt)

        return calculator_result

    def read_file_to_timeline(self, content):
        # 打开Excel文件
        workbook = openpyxl.load_workbook(filename=BytesIO(content), read_only=True, data_only=True)
        # 选择要操作的工作表
        worksheet = workbook["Output"]

        tl = Timeline()
        tl.per_device_layers = worksheet["C1"].value
        tl.num_microbatches = worksheet["E1"].value
        tl.per_loop_forward_computation_time = worksheet["I3"].value
        tl.per_loop_backward_computation_time = worksheet["K4"].value
        tl.per_loop_forward_allgather_time = worksheet["I2"].value
        tl.per_loop_backward_allgather_time = worksheet["K2"].value
        tl.per_loop_backward_reduce_scatter_time = worksheet["K3"].value
        tl.forward_time = worksheet["I1"].value
        tl.forward_gpu_usage = worksheet["I4"].value
        tl.backward_time = worksheet["K1"].value
        tl.backward_gpu_usage = worksheet["K5"].value
        tl.warmup_time = worksheet["G1"].value
        tl.cooldown_time = worksheet["O1"].value
        tl.allreduce_time = worksheet["Q1"].value
        tl.per_iter_training_time = worksheet["S1"].value
        tl.stable_time = worksheet["M1"].value
        tt = TotalTime()
        tt.total_number_of_iters = worksheet["W1"].value
        tt.totoal_number_of_gpus = worksheet["U1"].value
        tt.total_training_time = worksheet["Y1"].value

        worksheet1 = workbook["Input"]
        other_config = OtherConfig()
        other_config.tensor_parallel_degree = worksheet1["C13"].value
        other_config.pipeline_parallel_degree = worksheet1["C14"].value
        other_config.optimization_strategy = worksheet1["E9"].value
        other_config.microbatch_size = worksheet1["C15"].value
        return tl, tt, other_config

    def write_result_to_file(self, cluster: Cluster,
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
        # 打开Excel文件
        workbook = openpyxl.load_workbook(settings.CALCULATOR_RESULT_TEMPLATE)
        # 选择要操作的工作表
        worksheet = workbook["Output"]
        worksheet["C1"] = timeline.per_device_layers
        worksheet["E1"] = timeline.num_microbatches
        worksheet["G1"] = timeline.warmup_time
        worksheet["I1"] = timeline.forward_time
        worksheet["K1"] = timeline.backward_time
        worksheet["M1"] = timeline.stable_time
        worksheet["O1"] = timeline.cooldown_time
        worksheet["Q1"] = timeline.allreduce_time
        worksheet["S1"] = timeline.per_iter_training_time
        worksheet["U1"] = total_time.totoal_number_of_gpus
        worksheet["W1"] = total_time.total_number_of_iters
        worksheet["Y1"] = total_time.total_training_time
        worksheet["I2"] = timeline.per_loop_forward_allgather_time
        worksheet["K2"] = timeline.per_loop_backward_allgather_time
        worksheet["I3"] = timeline.per_loop_forward_computation_time
        worksheet["K3"] = timeline.per_loop_backward_reduce_scatter_time
        worksheet["I4"] = timeline.forward_gpu_usage
        worksheet["K4"] = timeline.per_loop_backward_computation_time
        worksheet["K5"] = timeline.backward_gpu_usage

        worksheet1 = workbook["Input"]
        worksheet1["B2"] = cluster.name
        worksheet1["C2"] = cluster.sparse_tensor_fp16_processing_power
        worksheet1["D2"] = cluster.fp32_processing_power
        worksheet1["E2"] = cluster.memory
        worksheet1["F2"] = cluster.memory_bandwidth
        worksheet1["G2"] = cluster.bus_bandwidth
        worksheet1["H2"] = cluster.delay

        worksheet1["B6"] = model.name
        worksheet1["C6"] = model.token_length
        worksheet1["D6"] = model.num_attention_heads
        worksheet1["E6"] = model.hidden_layer_size
        worksheet1["F6"] = model.num_layers
        worksheet1["G6"] = model.vocab_size

        worksheet1["C9"] = cluster.network_bandwidth
        worksheet1["E9"] = other_config.optimization_strategy

        worksheet1["C12"] = model.minibatch_size
        worksheet1["E12"] = 32
        worksheet1["C13"] = other_config.tensor_parallel_degree
        worksheet1["E13"] = recommended_config.recomended_tensor_parallel_degree
        worksheet1["C14"] = other_config.pipeline_parallel_degree
        worksheet1["E14"] = recommended_config.recomended_pipeline_parallel_degree
        worksheet1["C15"] = other_config.microbatch_size
        worksheet1["E15"] = recommended_config.recommended_microbatch
        worksheet1["C18"] = input_config.number_of_input_tokens
        worksheet1["E18"] = input_config.data_parallel_degree
        worksheet1["G18"] = input_config.epochs

        worksheet2 = workbook["Computation"]
        worksheet2["C1"] = parameter.total_parameters
        worksheet2["E1"] = parameter.word_embedding
        worksheet2["G1"] = parameter.self_attention
        worksheet2["I1"] = parameter.feed_forward
        worksheet2["K1"] = parameter.position_embedding

        worksheet2["C4"] = memory_usage.optimizer_states
        worksheet2["E4"] = memory_usage.weights
        worksheet2["G4"] = memory_usage.gradients
        worksheet2["I4"] = memory_usage.activation
        worksheet2["K4"] = memory_usage.overall_usage

        worksheet2["C6"] = computation.per_device_layers
        worksheet2["E6"] = computation.num_microbatches
        worksheet2["G6"] = computation.total_forward_computation_time
        worksheet2["I6"] = computation.total_backward_computation_time
        worksheet2["K6"] = computation.per_loop_forward_computation_time
        worksheet2["M6"] = computation.per_loop_backward_computation_time

        worksheet2["C8"] = computation.per_device_layers
        worksheet2["E8"] = computation.num_microbatches
        worksheet2["C9"] = communication.total_forward_allgather_time
        worksheet2["E9"] = communication.per_loop_forward_allgather_time
        worksheet2["C10"] = communication.total_backward_allgather_time
        worksheet2["E10"] = communication.per_loop_backward_allgather_time
        worksheet2["C11"] = communication.total_backward_reduce_scatter_time
        worksheet2["E11"] = communication.per_loop_backward_reduce_scatter_time
        worksheet2["C12"] = communication.total_p2p_time
        worksheet2["E12"] = communication.per_loop_p2p_time
        worksheet2["C13"] = communication.word_embedding_allreduce_time
        worksheet2["E13"] = communication.gradient_allreduce_time
        # 将修改后的文件保存到临时文件中
        with NamedTemporaryFile(suffix=".xlsx", delete=False) as tmp:
            workbook.save(tmp.name)
        return tmp.name

    def calculate_total_time(self, model: Model, time_line: Timeline, input_config: InputConfig,
                             other_config: OtherConfig):
        tt = TotalTime()
        tt.global_minibatch_size = input_config.data_parallel_degree * model.minibatch_size
        tt.total_number_of_iters = input_config.number_of_input_tokens * 1e6 * input_config.epochs / model.token_length / tt.global_minibatch_size
        tt.total_training_time = tt.total_number_of_iters * time_line.per_iter_training_time
        tt.totoal_number_of_gpus = input_config.data_parallel_degree * other_config.pipeline_parallel_degree * other_config.tensor_parallel_degree
        return tt
