import { sendtimeApi } from '../../../utils/api';
import { SendtimeApiResponse } from '../../types';
import { SignUpAndCreateSpaceProfileRequest } from './types';

export const SpaceProfileCreateApi = {
  signUpAndCreateProfile: (params: SignUpAndCreateSpaceProfileRequest) => {
    return sendtimeApi.post<SendtimeApiResponse<void>>(
      '/v2/space/profile/signup',
      params
    );
  },
};
