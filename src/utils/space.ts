export const getSpaceUrl = (spaceHandle: string) => {
  return process.env.IS_PRODUCTION === 'true'
    ? `https://umoh.io/@${spaceHandle}`
    : `https://dev.umoh.io/@${spaceHandle}`;
};
