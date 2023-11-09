import { sendtimeApi } from '../../utils/api';
import { SendtimeApiResponse } from '../types';
import { SpaceHost, SpaceHostsResponse, SpaceHostsUpdateParams } from './types';

export const SpaceApi = {
  getHosts: (spaceHandle: string) => {
    return sendtimeApi.get<SendtimeApiResponse<SpaceHostsResponse>>(
      `/v2/space/${spaceHandle}/host`
    );
  },
  updateHosts: (spaceHandle: string, params: SpaceHostsUpdateParams) => {
    return sendtimeApi.patch<SendtimeApiResponse<SpaceHostsResponse>>(
      `/v2/space/${spaceHandle}/host`,
      params
    );
  },
};
