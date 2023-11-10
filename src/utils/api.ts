import axios, { AxiosError } from 'axios';
import { SendtimeApiResponse } from '../apis/types';
import { AuthApi } from '../apis/auth';

export const sendtimeApi = axios.create({
  baseURL: process.env.SENDTIME_API_URL,
  withCredentials: true,
});

sendtimeApi.interceptors.request.use((config) => {
  const { method, url } = config;
  console.log(`🚀 [API] ${method?.toUpperCase()} ${url} | Request`);
  return config;
});

sendtimeApi.interceptors.response.use(
  (response) => {
    const { status, config } = response;
    const { method, url } = config;
    console.log(
      `🚀 [API] ${method?.toUpperCase()} ${url} | Response ${status}`
    );
    return response;
  },
  async ({ response, config }: AxiosError<SendtimeApiResponse<void>>) => {
    if (!config) {
      return Promise.reject(response?.data);
    }

    const { method, url } = config;
    const {
      status,
      statusText,
      data: {
        status: { code, message },
      },
    } = response!;

    console.log(
      `🚀 [API] ${method?.toUpperCase()} ${url} | Error ${status} ${statusText} | ${code} ${message}`
    );

    if (code === 4010 || code === 4013) {
      delete sendtimeApi.defaults.headers['Authorization'];
      delete config.headers['Authorization'];
      const {
        data: {
          results: [{ accessToken }],
        },
      } = await AuthApi.login({
        email: process.env.SENDTIME_USER_ID || '',
        password: process.env.SENDTIME_USER_PW || '',
      });

      sendtimeApi.defaults.headers['Authorization'] = `Bearer ${accessToken}`;
      config.headers['Authorization'] = `Bearer ${accessToken}`;

      if (config) {
        return sendtimeApi.request(config);
      }
    }

    return Promise.reject(response?.data);
  }
);
