import {
  SlackCommandMiddlewareArgs,
  AllMiddlewareArgs,
  SlackViewMiddlewareArgs,
} from '@slack/bolt';
import {
  SlashCommandParams,
  SlashCommandService,
} from '../../slash-command.service';
import { SLASH_COMMANDS } from '../../../utils/consts';
import { app } from '../../../app';

interface PrivateMetadata {
  spaceHandle: string;
  channel: string;
  userId: string;
}

export class SpaceEditService implements SlashCommandService {
  readonly slashCommandName = SLASH_COMMANDS.UMOH;
  readonly slashCommandText = 'space edit';
  private readonly callbackId = 'space-edit';
  private readonly blockIds = {};

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

    await ack({ response_type: 'in_channel' });

    await client.views.open({
      trigger_id: command.trigger_id,
      view: {
        type: 'modal',
        callback_id: this.callbackId,
        private_metadata: JSON.stringify({
          spaceHandle,
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
        blocks: [],
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

    const { spaceHandle, channel, userId } = JSON.parse(
      view.private_metadata
    ) as PrivateMetadata;
    logger.info(
      `${new Date()} - space handle: ${spaceHandle}, channel: ${channel}, userId: ${userId}`
    );

    try {
      // await SpaceApi.updateHosts(spaceHandle, { hosts });
      logger.info(`${new Date()} - hosts updated`);
    } catch (error) {
      logger.error(`${new Date()} - error: ${error}`);
      // await ack({
      //   response_action: 'errors',
      //   errors: {
      //     [this.blockIds.inputAdmins]: 'Failed to update space hosts.',
      //     [this.blockIds.inputViewers]: 'Failed to update space hosts.',
      //   },
      // });
      return;
    }

    await ack({
      response_action: 'clear',
    });

    // await client.chat.postMessage({
    //   channel: channel,
    //   mrkdwn: true,
    //   text:
    //     `*Space hosts updated* for <https://umoh.io/@${spaceHandle}|@${spaceHandle}> by <@${userId}>\n` +
    //     `*Admins*: ${admins.join(', ')}\n*Viewers*: ${viewers.join(', ')}`,
    // });
  }
}
