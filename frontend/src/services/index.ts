import request from '@/utils/request';
const service_base_url = 'http://192.168.211.106:12340'
// const service_base_url = 'http://localhost:8000'
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

export async function getRecommendedConfig(params: any) {
  return request(`${service_base_url}/llm_training_calculator/calculator/recommended_config`, {
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

