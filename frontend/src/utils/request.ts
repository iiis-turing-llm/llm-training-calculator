import { request } from 'umi';
import { message } from 'antd';

async function MyRequest<T>(url: string, options: any): Promise<T> {
  const res: any = await request(url, {
    ...options,
    skipErrorHandler: true,
    getResponse: false,
  });
  const { code, result } = res;
  if (!code) {
    return res;
  }
  if (code === 200) {
    return result;
  } else {
    // 错误处理
    message.error(res.message);
    return result;
  }
}

export default MyRequest;

export interface Response<T> {
  code: number;
  message: string;
  result: T;
  success: boolean;
  timestamp: number;
}
