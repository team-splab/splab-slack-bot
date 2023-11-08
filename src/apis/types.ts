export interface SendtimeApiResponse<T> {
  status: {
    code: number;
    message: string;
  };
  results: T[];
}
