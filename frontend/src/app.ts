import { RequestConfig } from 'umi';
import '@/i8n/config';

export const request: RequestConfig = {
  errorConfig: {
    adaptor: (resData) => {
      return {
        success: resData.code === 0,
        errorMessage: resData.message,
      };
    },
  },
  requestInterceptors: [
    (url: string, options: Record<string, any>) => {
      return {
        url,
        options,
      };
    },
  ],
  responseInterceptors: [
    (response, options) => {
      return response;
    },
  ],
};
