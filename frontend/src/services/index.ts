import request, { Response } from '@/utils/request';

export async function readFile() {
  return request('/llm_training/calculator/read_file', {
    method: 'GET',
  });
}
export async function getGpuList() {
  return request('/llm_training/calculator/gpu', {
    method: 'GET',
  });
}
export async function getModelList() {
  return request('/llm_training/calculator/model', {
    method: 'GET',
  });
}

export async function getParameterMetrics(params: any) {
  return request('/llm_training/calculator/parameter_metrics', {
    data: {
      ...params
    },
    method: 'POST',
  });
}

export async function getRecommendedConfig(params: any) {
  return request('/llm_training/calculator/recommended_config', {
    data: {
      ...params
    },
    method: 'POST',
  });
}

export async function calculate(params: any) {
  return request('/llm_training/calculator/', {
    data: {
      ...params
    },
    method: 'POST',
  });
}