import math

from backend.app.config import settings
from backend.app.models.calculator_input import GPU, Model, OtherConfig
from backend.app.models.calculator_result import MemoryUsage, Computation, Communication, Timeline, CalculatorResult, \
    Parameter, RecommendedConfig
import openpyxl


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

    def recommended_config(self, gpu: GPU, model: Model, optimization_strategy):
        params = self.parameter_metrics(model)
        recommended_config = RecommendedConfig()
        recommended_config.recomended_tensor_parallel_degree = min(8, max(1, math.floor(
            3 * model.hidden_layer_size / gpu.sparse_tensor_fp16_processing_power * gpu.bus_bandwidth / 2 / 1000)))

        recommended_config.recomended_pipeline_parallel_degree = math.ceil((
                                                                                   model.token_length * model.minibatch_size * model.hidden_layer_size * (
                                                                                   34 + 5 * model.num_attention_heads * model.token_length / model.hidden_layer_size) / recommended_config.recomended_tensor_parallel_degree + 16 * params.total_parameters / recommended_config.recomended_tensor_parallel_degree) / gpu.memory / 1e9)
        if optimization_strategy == "Full recomputation":
            recommended_config.recomended_pipeline_parallel_degree = math.ceil((
                                                                                       model.token_length * model.minibatch_size * model.hidden_layer_size * (
                                                                                       34 + 5 * model.num_attention_heads * model.token_length / model.hidden_layer_size) / recommended_config.recomended_tensor_parallel_degree + 16 * params.total_parameters / recommended_config.recomended_tensor_parallel_degree) / gpu.memory / 1e9)
        elif optimization_strategy == "No recomputation":
            recommended_config.recomended_pipeline_parallel_degree = math.ceil((
                                                                                       model.num_layers * model.token_length * model.minibatch_size * model.hidden_layer_size * (
                                                                                       10 + 24 / recommended_config.recomended_tensor_parallel_degree + 5 * model.num_attention_heads * model.token_length / model.hidden_layer_size) / recommended_config.recomended_tensor_parallel_degree + 16 * params.total_parameters / recommended_config.recomended_tensor_parallel_degree) / gpu.memory / 1e9)
        elif optimization_strategy == "Selective recomputation":
            recommended_config.recomended_pipeline_parallel_degree = math.ceil(((model.num_layers * model.token_length
                                                                                 * model.minibatch_size * model.hidden_layer_size * 34) / recommended_config.recomended_tensor_parallel_degree
                                                                                + 16 *
                                                                                params.total_parameters / recommended_config.recomended_tensor_parallel_degree) /
                                                                               gpu.memory / 1e9)

        return recommended_config

    def calculate(self, gpu: GPU, model: Model, other_config: OtherConfig):

        params = self.parameter_metrics(model)

        memory = MemoryUsage()
        memory.optimizer_states = 12 * params.total_parameters / other_config.tensor_parallel_degree / other_config.pipeline_parallel_degree
        memory.weights = 2 * params.total_parameters / other_config.tensor_parallel_degree / other_config.pipeline_parallel_degree
        memory.gradients = 2 * params.total_parameters / other_config.tensor_parallel_degree / other_config.pipeline_parallel_degree
        if other_config.optimization_strategy == "Full recomputation":
            memory.activation = model.token_length * model.minibatch_size * model.hidden_layer_size * (
                    34 + 5 * model.num_attention_heads * model.token_length / model.hidden_layer_size) / other_config.tensor_parallel_degree
        elif other_config.optimization_strategy == "No recomputation":
            memory.activation = model.num_layers * model.token_length * model.minibatch_size * model.hidden_layer_size * (
                    10 + 24 / other_config.tensor_parallel_degree + 5 * model.num_attention_heads * model.token_length / model.hidden_layer_size / other_config.tensor_parallel_degree)
        elif other_config.optimization_strategy == "Selective recomputation":
            memory.activation = model.num_layers * model.token_length * model.minibatch_size * model.hidden_layer_size * 34 / other_config.tensor_parallel_degree
        memory.overall_usage = memory.optimizer_states + memory.weights + memory.activation + memory.gradients

        comp = Computation()
        comp.per_device_layers = model.num_layers / other_config.pipeline_parallel_degree
        comp.num_microbatches = model.minibatch_size / other_config.microbatch_size
        comp.total_forward_computation_time = 2 * model.token_length * model.minibatch_size * params.total_parameters / other_config.tensor_parallel_degree / other_config.pipeline_parallel_degree / gpu.sparse_tensor_fp16_processing_power / 1e12
        comp.per_loop_forward_computation_time = comp.total_forward_computation_time / comp.per_device_layers / comp.num_microbatches
        comp.total_backward_computation_time = 4 * model.token_length * model.minibatch_size * params.total_parameters / other_config.tensor_parallel_degree / other_config.pipeline_parallel_degree / gpu.sparse_tensor_fp16_processing_power / 1e12
        comp.per_loop_backward_computation_time = comp.total_backward_computation_time / comp.per_device_layers / comp.num_microbatches

        comm = Communication()
        comm.total_forward_allgather_time = 2 * 2 * model.hidden_layer_size * model.hidden_layer_size * model.minibatch_size * model.num_layers / other_config.pipeline_parallel_degree / gpu.bus_bandwidth / 1e9
        comm.per_loop_forward_allgather_time = comm.total_forward_allgather_time / comp.per_device_layers / comp.num_microbatches
        comm.total_backward_allgather_time = 2 * 2 * model.hidden_layer_size * model.hidden_layer_size * model.minibatch_size * model.num_layers / other_config.pipeline_parallel_degree / gpu.bus_bandwidth / 1e9
        comm.per_loop_backward_allgather_time = comm.total_backward_allgather_time / comp.per_device_layers / comp.num_microbatches
        comm.total_backward_reduce_scatter_time = comm.total_backward_allgather_time / other_config.tensor_parallel_degree * 2
        comm.per_loop_backward_reduce_scatter_time = comm.total_backward_reduce_scatter_time / comp.per_device_layers / comp.num_microbatches
        comm.total_p2p_time = 2 * model.hidden_layer_size * model.hidden_layer_size * model.minibatch_size / other_config.tensor_parallel_degree / other_config.network_bandwidth * 8 * 8 / 1e9
        comm.per_loop_p2p_time = comm.total_p2p_time / comp.num_microbatches
        comm.word_embedding_allreduce_time = 2 * params.word_embedding * 2 * 8 / 1e9 / other_config.tensor_parallel_degree / other_config.network_bandwidth
        comm.gradient_allreduce_time = 2 * 8 * 2 * 8 / 1e9 * params.total_parameters / other_config.tensor_parallel_degree / other_config.pipeline_parallel_degree / other_config.network_bandwidth

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
        tl.per_iter_training_time = tl.warmup_time + (
                tl.forward_time + tl.backward_time) * comp.num_microbatches + tl.cooldown_time + tl.allreduce_time

        self.write_timeline_to_file(tl)
        calculator_result = CalculatorResult(memory_usage=memory, computation=comp, communication=comm, timeline=tl)

        return calculator_result

    def read_file_to_timeline(self):
        # 打开Excel文件
        workbook = openpyxl.load_workbook(settings.CALCULATOR_RESULT_FILE)
        # 选择要操作的工作表
        worksheet = workbook['Sheet1']

        tl = Timeline()
        tl.per_device_layers = worksheet['B1'].value
        tl.num_microbatches = worksheet['D1'].value
        tl.per_loop_forward_computation_time = worksheet['H3'].value
        tl.per_loop_backward_computation_time = worksheet['J4'].value
        tl.per_loop_forward_allgather_time = worksheet['H2'].value
        tl.per_loop_backward_allgather_time = worksheet['J2'].value
        tl.per_loop_backward_reduce_scatter_time = worksheet['J3'].value
        tl.forward_time = worksheet['H1'].value
        tl.forward_gpu_usage = worksheet['H4'].value
        tl.backward_time = worksheet['J1'].value
        tl.backward_gpu_usage = worksheet['J5'].value
        tl.warmup_time = worksheet['F1'].value
        tl.cooldown_time = worksheet['L1'].value
        tl.allreduce_time = worksheet['N1'].value
        tl.per_iter_training_time = worksheet['P1'].value
        return tl

    def write_timeline_to_file(self, tl: Timeline):
        # 打开Excel文件
        workbook = openpyxl.load_workbook(settings.CALCULATOR_RESULT_FILE, data_only=True)
        # 选择要操作的工作表
        worksheet = workbook['Sheet1']
        worksheet['B1'] = tl.per_device_layers
        worksheet['D1'] = tl.num_microbatches
        worksheet['H3'] = tl.per_loop_forward_computation_time
        worksheet['J4'] = tl.per_loop_backward_computation_time
        worksheet['H2'] = tl.per_loop_forward_allgather_time
        worksheet['J2'] = tl.per_loop_backward_allgather_time
        worksheet['J3'] = tl.per_loop_backward_reduce_scatter_time
        worksheet['H1'] = tl.forward_time
        worksheet['H4'] = tl.forward_gpu_usage
        worksheet['J1'] = tl.backward_time
        worksheet['J5'] = tl.backward_gpu_usage
        worksheet['F1'] = tl.warmup_time
        worksheet['L1'] = tl.cooldown_time
        worksheet['N1'] = tl.allreduce_time
        worksheet['P1'] = tl.per_iter_training_time
        # 保存修改后的Excel文件
        workbook.save(settings.CALCULATOR_RESULT_FILE)
