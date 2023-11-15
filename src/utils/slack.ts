import { ViewOutput } from '@slack/bolt';

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
