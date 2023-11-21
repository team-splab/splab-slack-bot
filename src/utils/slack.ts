import { AllMiddlewareArgs, Block, KnownBlock, ViewOutput } from '@slack/bolt';

/**
 * Get value from state
 * @example const value = getValueFromState({ state, blockId: 'input-title' })
 */
export const getValueFromState = ({
  state,
  blockId,
}: {
  state: ViewOutput['state'];
  blockId: string;
}): string | undefined => {
  const stateObject = Object.values(state.values[blockId])[0];
  if (stateObject.type === 'static_select') {
    return stateObject.selected_option?.value;
  } else if (stateObject.type === 'multi_static_select') {
    return stateObject.selected_options
      ?.map((option) => option.value)
      .join(',');
  }
  return stateObject.value ?? undefined;
};

/**
 * Get values from state
 * @example const { inputTitle } = getValuesFromState({ state, blockIds: { inputTitle: 'input-title' } })
 */
export const getValuesFromState = <T extends { [key: string]: string }>({
  state,
  blockIds,
}: {
  state: ViewOutput['state'];
  blockIds: T;
}): { [key in keyof T]: string | undefined } => {
  const values = {} as { [key in keyof T]: string | undefined };
  for (const [key, blockId] of Object.entries(blockIds)) {
    values[key as keyof T] = getValueFromState({ state, blockId });
  }
  return values;
};

export const postBlocksInThread = async ({
  client,
  channel,
  messageText,
  messageBlocks,
  threadBlocks,
}: {
  client: AllMiddlewareArgs['client'];
  channel: string;
  messageText: string;
  messageBlocks?: (KnownBlock | Block)[];
  threadBlocks: (KnownBlock | Block)[];
}) => {
  const messageResponse = await client.chat.postMessage({
    channel: channel,
    mrkdwn: true,
    messageText,
    blocks: messageBlocks,
  });
  const blockSplits = threadBlocks.reduce(
    (acc, block) => {
      if (acc[acc.length - 1].length >= 50) {
        acc.push([]);
      }
      acc[acc.length - 1].push(block);
      return acc;
    },
    [[]] as (KnownBlock | Block)[][]
  );

  for (const blocks of blockSplits) {
    await client.chat.postMessage({
      channel: channel,
      mrkdwn: true,
      thread_ts: messageResponse.ts,
      blocks,
    });
  }
};
