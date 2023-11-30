import request from '@/utils/request';
import { service_base_url } from '@/utils/constant'
export async function readFile() {
  return request(`${service_base_url}/llm_training_calculator/calculator/read_file`, {
    method: 'GET',
  });
}
export async function getGpuList() {
  return request(`${service_base_url}/llm_training_calculator/calculator/gpu`, {
    method: 'GET',
  });
}
export async function getModelList() {
  return request(`${service_base_url}/llm_training_calculator/calculator/model`, {
    method: 'GET',
  });
}

export async function getParameterMetrics(params: any) {
  return request(`${service_base_url}/llm_training_calculator/calculator/parameter_metrics`, {
    data: {
      ...params
    },
    method: 'POST',
  });
}

export async function getStrategies() {
  return request(`${service_base_url}/llm_training_calculator/calculator/optimization_strategies`, {
    method: 'GET',
  });
}

export async function getRecommendedTenser(params: any) {
  return request(`${service_base_url}/llm_training_calculator/calculator/recommended_tensor`, {
    data: {
      ...params
    },
    method: 'POST',
  });
}
export async function getRecommendedPipeline(params: any) {
  return request(`${service_base_url}/llm_training_calculator/calculator/recommended_pipeline`, {
    data: {
      ...params
    },
    method: 'POST',
  });
}
export async function getRecommendedMicrobatch(params: any) {
  return request(`${service_base_url}/llm_training_calculator/calculator/recommended_microbatch`, {
    data: {
      ...params
    },
    method: 'POST',
  });
}

export async function calculate(params: any) {
  return request(`${service_base_url}/llm_training_calculator/calculator/`, {
    data: {
      ...params
    },
    method: 'POST',
  });
}
export async function exportResult(params: any) {
  return request(`${service_base_url}/llm_training_calculator/calculator/download`, {
    data: {
      ...params
    },
    responseType: 'blob',
    method: 'POST',
  });
}

export async function downloadTemplate(params: any) {
  return request(`${service_base_url}/llm_training_calculator/calculator/download_result_model`, {
    data: {
      ...params
    },
    responseType: 'blob',
    method: 'POST',
  });
}

