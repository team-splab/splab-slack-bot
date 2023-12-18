import { View } from '@slack/bolt';
import { ViewBuilder } from '../../../interfaces/view-builder';
import { Element } from '../../../components/elements';
import { Block } from '../../../components/blocks';

export interface CardCreateViewPrivateMetadata {
  spaceId: string;
  channel: string;
  userId: string;
}

export class CardCreateView implements ViewBuilder {
  readonly callbackId = 'card-create';

  readonly blockIds = {
    inputSpreadsheetUrl: 'input-spreadsheet-url',
  };

  readonly actionIds = {
    loadSpreadsheet: 'load-spreadsheet',
  };

  build(): View {
    return {
      type: 'modal',
      callback_id: this.callbackId,
      notify_on_close: true,
      title: Element.PlainText('Create Card'),
      submit: Element.PlainText('Create'),
      close: Element.PlainText('Cancel'),
      blocks: [
        Block.TextInput({
          label: 'Google spreadsheet URL',
          blockId: this.blockIds.inputSpreadsheetUrl,
        }),
        Block.Buttons([
          {
            text: 'test',
            actionId: this.actionIds.loadSpreadsheet,
          },
        ]),
      ],
    };
  }
}
