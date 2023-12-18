import { KnownBlock, View } from '@slack/bolt';
import { ViewBuilder } from '../../../interfaces/view-builder';
import { Element } from '../../../components/elements';
import { Block } from '../../../components/blocks';
import { SignUpAndCreateSpaceProfileRequest } from '../../../apis/space/profile-create/types';
import { SpaceSocialUtil } from '../../../utils/space';

export interface CardCreateViewPrivateMetadata {
  spaceId: string;
  spaceHandle: string;
  channel: string;
  userId: string;
  createCardRequestDtos: SignUpAndCreateSpaceProfileRequest[];
}

export class CardCreateView implements ViewBuilder {
  readonly callbackId = 'card-create';

  readonly blockIds = {
    inputSpreadsheetUrl: 'input-spreadsheet-url',
  };

  readonly actionIds = {
    loadSpreadsheet: 'load-spreadsheet',
  };

  build({
    error,
    spreadsheetUrl,
    cards = [],
  }: {
    error?: string;
    spreadsheetUrl?: string;
    cards?: SignUpAndCreateSpaceProfileRequest[];
  }): View {
    let blocks: KnownBlock[] = [
      Block.TextInput({
        label: 'Google spreadsheet URL',
        placeholder: 'https://docs.google.com/spreadsheets/d/...',
        initialValue: spreadsheetUrl,
        blockId: this.blockIds.inputSpreadsheetUrl,
      }),
      Block.Buttons([
        {
          text: 'Load Data',
          actionId: this.actionIds.loadSpreadsheet,
        },
      ]),
    ];

    if (error) {
      blocks.push(Block.Text(error));
    }

    if (cards.length > 0) {
      cards.forEach((card, index) => {
        const socials = card.spaceProfileInfo.links?.map((link) => {
          const social = SpaceSocialUtil.getSocialFromIconId(link.iconId)!;
          const name = SpaceSocialUtil.getSocialLabel(social);
          return `<${link.url}|${name}>`;
        });
        blocks.push(
          Block.Fields({
            text: `⎯⎯⎯⎯⎯  ${index + 1}  ⎯⎯⎯⎯⎯`,
            fields: [
              `*Name*\n${card.signUpInfo.name}`,
              `*Email*\n${card.signUpInfo.email}`,
              `*Phone*\n${card.signUpInfo.phone}`,
              `*Category IDs*\n${card.spaceProfileInfo.categoryIds.join(', ')}`,
              `*Subtitle*\n${card.spaceProfileInfo.subtitle}`,
              `*Description*\n${card.spaceProfileInfo.description}`,
              `*Hashtags*\n${card.spaceProfileInfo.tags.join(', ')}`,
              `*Image URL*\n${card.spaceProfileInfo.imageUrl}`,
              `*Socials*\n${socials?.join(', ')}`,
            ],
          })
        );
      });
    }

    if (blocks.length > 100) {
      const length = blocks.length;
      blocks.splice(99);
      blocks.push(Block.Header(`${length - 99} more cards...`));
    }

    return {
      type: 'modal',
      callback_id: this.callbackId,
      notify_on_close: true,
      title: Element.PlainText('Create Card'),
      submit: Element.PlainText('Start'),
      close: Element.PlainText('Cancel'),
      blocks,
    };
  }
}
