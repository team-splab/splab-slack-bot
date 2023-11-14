import { View } from '@slack/bolt';

export interface ViewBuilder {
  build(args: object): View;
}
