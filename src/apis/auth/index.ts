import { sendtimeApi } from '../../utils/api';
import { SendtimeApiResponse } from '../types';
import { LoginParams, LoginResponse } from './types';

export const AuthApi = {
  login: (params: LoginParams) => {
    return sendtimeApi.post<SendtimeApiResponse<LoginResponse>>(
      '/v2/auth/login',
      params
    );
  },
};
