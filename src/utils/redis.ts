import { redisClient } from '../redis';

export const savePrivateMetadata = async ({
  viewId,
  privateMetadata,
}: {
  viewId: string;
  privateMetadata: any;
}): Promise<void> => {
  await redisClient.json.set(
    `private_metadata:${viewId}`,
    '$',
    privateMetadata
  );
  await redisClient.expire(`private_metadata:${viewId}`, 60 * 60 * 24 * 7);
};

export const getPrivateMetadata = async <T>({
  viewId,
}: {
  viewId: string;
}): Promise<T> => {
  const privateMetadata = await redisClient.json.get(
    `private_metadata:${viewId}`
  );
  return privateMetadata as T;
};

export const deletePrivateMetadata = async ({
  viewId,
}: {
  viewId: string;
}): Promise<void> => {
  await redisClient.del(`private_metadata:${viewId}`);
};
