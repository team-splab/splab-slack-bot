import {
  SlackCommandMiddlewareArgs,
  AllMiddlewareArgs,
  SlackViewMiddlewareArgs,
  Block,
  KnownBlock,
} from '@slack/bolt';
import {
  SlashCommandParams,
  SlashCommandService,
} from '../../slash-command.service';
import { SLASH_COMMANDS } from '../../../utils/consts';
import { app } from '../../../app';
import { Space, SpaceUpdateParams } from '../../../apis/space/types';
import { SpaceApi } from '../../../apis/space';
import { getSpaceUrl } from '../../../utils/space';
import { getValuesFromState } from '../../../utils/slack';

interface PrivateMetadata {
  space: Space;
  channel: string;
  userId: string;
}

export class SpaceEditService implements SlashCommandService {
  readonly slashCommandName = SLASH_COMMANDS.UMOH;
  readonly slashCommandText = 'space edit';
  private readonly callbackId = 'space-edit';
  private readonly blockIds = {
    inputTitle: 'input-title',
    inputDescription: 'input-description',
  };
  private readonly actionIds = {
    editCategory: 'edit-category',
    addCategory: 'add-category',
  };

  constructor() {
    app.view(this.callbackId, this.onModalSubmit.bind(this));
  }

  async onSlashCommand({
    logger,
    client,
    command,
    params: [spaceHandle],
    ack,
  }: SlackCommandMiddlewareArgs &
    AllMiddlewareArgs &
    SlashCommandParams): Promise<void> {
    spaceHandle = spaceHandle.replace('@', '');

    if (!spaceHandle) {
      logger.info(`${new Date()} - space handle is not provided`);
      await ack({
        response_type: 'ephemeral',
        text: `Please enter the space handle. ex) \`${this.slashCommandName} ${this.slashCommandText} handle\``,
      });
      return;
    }

    logger.info(`${new Date()} - space handle: ${spaceHandle}`);

    let space: Space;
    try {
      const {
        data: {
          results: [response],
        },
      } = await SpaceApi.getSpace(spaceHandle);
      space = response;
      logger.info(`${new Date()} - space: ${JSON.stringify(space)}`);
    } catch (error) {
      logger.error(`${new Date()} - error: ${error}`);
      await ack({
        response_type: 'ephemeral',
        text: `Failed to fetch space. Please check the space handle.`,
      });
      return;
    }

    await ack({ response_type: 'in_channel' });

    await client.views.open({
      trigger_id: command.trigger_id,
      view: {
        type: 'modal',
        callback_id: this.callbackId,
        private_metadata: JSON.stringify({
          space,
          channel: command.channel_id,
          userId: command.user_id,
        } as PrivateMetadata),
        title: {
          type: 'plain_text',
          text: 'Edit Space',
        },
        submit: {
          type: 'plain_text',
          text: 'Edit',
        },
        close: {
          type: 'plain_text',
          text: 'Cancel',
        },
        blocks: [
          {
            type: 'section',
            fields: [
              {
                type: 'mrkdwn',
                text: `*Space* <${getSpaceUrl(spaceHandle)}|@${spaceHandle}>`,
              },
            ],
          },
          {
            type: 'divider',
          },
          {
            type: 'header',
            text: {
              type: 'plain_text',
              text: 'Basic Information',
            },
          },
          {
            type: 'input',
            optional: false,
            block_id: this.blockIds.inputTitle,
            label: {
              type: 'plain_text',
              text: 'Title',
            },
            element: {
              type: 'plain_text_input',
              initial_value: space.title,
              focus_on_load: true,
              placeholder: {
                type: 'plain_text',
                text: 'Space title',
              },
            },
          },
          {
            type: 'input',
            optional: true,
            block_id: this.blockIds.inputDescription,
            label: {
              type: 'plain_text',
              text: 'Description',
            },
            element: {
              type: 'plain_text_input',
              initial_value: space.description,
              multiline: true,
              placeholder: {
                type: 'plain_text',
                text: 'Space description',
              },
            },
          },
          {
            type: 'divider',
          },
          {
            type: 'header',
            text: {
              type: 'plain_text',

              text: 'Categories',
            },
          },
          ...this.buildCategoryBlocks(space),
          {
            type: 'actions',
            elements: [
              {
                type: 'button',
                style: 'primary',
                action_id: this.actionIds.addCategory,
                text: {
                  type: 'plain_text',
                  text: 'Add Category',
                },
              },
            ],
          },
        ],
      },
    });
  }

  async onModalSubmit({
    view,
    ack,
    logger,
    client,
  }: SlackViewMiddlewareArgs & AllMiddlewareArgs) {
    logger.info(`${new Date()} - ${view.callback_id} modal submitted`);

    const { space, channel, userId } = JSON.parse(
      view.private_metadata
    ) as PrivateMetadata;
    logger.info(
      `${new Date()} - space handle: ${
        space.handle
      }, channel: ${channel}, userId: ${userId}`
    );

    const { inputTitle, inputDescription } = getValuesFromState({
      state: view.state,
      blockIds: this.blockIds,
    });
    const spaceUpdateParams: SpaceUpdateParams = {
      ...space,
      title: inputTitle || space.title,
      description: inputDescription,
      id: undefined,
      hostId: undefined,
      hosts: undefined,
      todayViews: undefined,
    };
    logger.info(
      `${new Date()} - space update params: ${JSON.stringify(
        spaceUpdateParams
      )}`
    );

    let spaceUpdated: Space;
    try {
      const {
        data: {
          results: [response],
        },
      } = await SpaceApi.updateSpace(space.handle, spaceUpdateParams);
      spaceUpdated = response;
      logger.info(`${new Date()} - space updated`);
    } catch (error) {
      logger.error(`${new Date()} - error: ${error}`);
      await ack({
        response_action: 'errors',
        errors: {
          [this.blockIds.inputTitle]: 'Failed to edit space',
        },
      });
      return;
    }

    await ack({
      response_action: 'clear',
    });

    await client.chat.postMessage({
      channel: channel,
      mrkdwn: true,
      text: `*<${getSpaceUrl(spaceUpdated.handle)}|@${
        spaceUpdated.handle
      }>* has been edited by <@${userId}>`,
      blocks: [
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `*<${getSpaceUrl(spaceUpdated.handle)}|@${
              space.handle
            }>* has been edited by <@${userId}>`,
          },
        },
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text:
              `*Title*\n${spaceUpdated.title}\n` +
              `*Description*\n${spaceUpdated.description || ''}`,
          },
        },
      ],
    });
  }

  private buildCategoryBlocks(space: Space): (Block | KnownBlock)[] {
    const blocks: (Block | KnownBlock)[] = [];

    space.profileCategoryConfig?.categoryItems.forEach((categoryItem) => {
      blocks.push({
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: categoryItem.localizedNames[0].text,
        },
        accessory: {
          type: 'button',
          value: categoryItem.id,
          action_id: this.actionIds.editCategory,
          text: {
            type: 'plain_text',
            text: 'Edit',
            emoji: true,
          },
        },
      });
      blocks.push({
        type: 'context',
        elements: [
          {
            type: 'mrkdwn',
            text: categoryItem.id,
          },
          {
            type: 'mrkdwn',
            text: categoryItem.color || ' ',
          },
        ],
      });
      blocks.push({
        type: 'divider',
      });
    });

    return blocks;
  }
}
