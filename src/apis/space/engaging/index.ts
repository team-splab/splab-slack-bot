import { sendtimeApi } from '../../../utils/api';
import { SendtimeApiResponse } from '../../types';
import { SpaceEngagingEvent } from './types';

export const SpaceEngagingApi = {
  getEngagingByReaction: (spaceHandle: string) => {
    return sendtimeApi.get<SendtimeApiResponse<SpaceEngagingEvent>>(
      `/v2/admin/space/${spaceHandle}/popular/reaction`
    );
  },
  getEngagingByScrap: (spaceHandle: string) => {
    return sendtimeApi.get<SendtimeApiResponse<SpaceEngagingEvent>>(
      `/v2/admin/space/${spaceHandle}/popular/scrap`
    );
  },
  sendEngagingByReaction: (spaceHandle: string) => {
    return sendtimeApi.post<SendtimeApiResponse<Boolean>>(
      `/v2/admin/space/${spaceHandle}/popular/reaction`
    );
  },
  sendEngagingByScrap: (spaceHandle: string) => {
    return sendtimeApi.post<SendtimeApiResponse<Boolean>>(
      `/v2/admin/space/${spaceHandle}/popular/scrap`
    );
  },
};
