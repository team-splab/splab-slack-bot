export interface SendtimeApiResponse<T> {
  status: {
    code: number;
    message: string;
  };
  results: T[];
}

export interface Timezone {
  id: string;
  name: string;
  timezone: string;
  offset: string;
}
