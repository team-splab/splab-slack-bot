import { sendtimeApi } from '../../utils/api';
import { SendtimeApiResponse } from '../types';
import {
  SpaceHostsResponse,
  SpaceHostsUpdateParams,
  SpaceResponse,
  SpaceUpdateParams,
} from './types';

export const SpaceApi = {
  getHosts: (spaceHandle: string) => {
    return sendtimeApi.get<SendtimeApiResponse<SpaceHostsResponse>>(
      `/v2/space/${spaceHandle}/host`
    );
  },
  updateHosts: (spaceHandle: string, params: SpaceHostsUpdateParams) => {
    return sendtimeApi.patch<SendtimeApiResponse<SpaceResponse>>(
      `/v2/space/${spaceHandle}/host`,
      params
    );
  },
  getSpace: (spaceHandle: string) => {
    return sendtimeApi.get<SendtimeApiResponse<SpaceResponse>>(
      `/v2/space/${spaceHandle}`
    );
  },
  updateSpace: (spaceHandle: string, params: SpaceUpdateParams) => {
    return sendtimeApi.put<SendtimeApiResponse<SpaceResponse>>(
      `/v2/space/${spaceHandle}`,
      params
    );
  },
};
