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
import { SpaceApi } from '../../../apis/space';
import { SpaceHost } from '../../../apis/space/types';
import { getSpaceUrl } from '../../../utils/space';
import { getValuesFromState } from '../../../utils/slack';

interface PrivateMetadata {
  spaceHandle: string;
  channel: string;
  userId: string;
}

export class HostManagementService implements SlashCommandService {
  readonly slashCommandName = SLASH_COMMANDS.UMOH;
  readonly slashCommandText = 'space host';
  private readonly callbackId = 'space-host';
  private readonly blockIds = {
    inputAdmins: 'input-admins',
    inputViewers: 'input-viewers',
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

    let hosts: SpaceHost[] = [];
    try {
      const {
        data: {
          results: [response],
        },
      } = await SpaceApi.getHosts(spaceHandle);
      hosts = response.hosts;
      logger.info(`${new Date()} - hosts: ${hosts}`);
    } catch (error) {
      logger.error(`${new Date()} - error: ${error}`);
      await ack({
        response_type: 'ephemeral',
        text: `Failed to get space hosts. Please check the space handle.`,
      });
      return;
    }

    const admins = hosts
      .filter((host) => host.accessType === 'ADMIN')
      .map((host) => host.email)
      .join(', ');
    const viewers = hosts
      .filter((host) => host.accessType === 'VIEWER')
      .map((host) => host.email)
      .join(', ');

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
          text: 'Update Space Hosts',
        },
        submit: {
          type: 'plain_text',
          text: 'Update',
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
            type: 'input',
            optional: true,
            block_id: this.blockIds.inputAdmins,
            label: {
              type: 'plain_text',
              text: 'Admins',
            },
            hint: {
              type: 'plain_text',
              text: 'Enter emails separated by commas, whitespaces, or new lines',
            },
            element: {
              type: 'plain_text_input',
              initial_value: admins,
              multiline: true,
              focus_on_load: true,
              placeholder: {
                type: 'plain_text',
                text: 'ex) leo@splab.dev, kang@splab.dev, ...',
              },
            },
          },
          {
            type: 'input',
            optional: true,
            block_id: this.blockIds.inputViewers,
            label: {
              type: 'plain_text',
              text: 'Viewers',
            },
            hint: {
              type: 'plain_text',
              text: 'Enter emails separated by commas, whitespaces, or new lines',
            },
            element: {
              type: 'plain_text_input',
              initial_value: viewers,
              multiline: true,
              focus_on_load: false,
              placeholder: {
                type: 'plain_text',
                text: 'ex) leo@splab.dev, kang@splab.dev, ...',
              },
            },
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

    const { spaceHandle, channel, userId } = JSON.parse(
      view.private_metadata
    ) as PrivateMetadata;
    logger.info(
      `${new Date()} - space handle: ${spaceHandle}, channel: ${channel}, userId: ${userId}`
    );

    const { inputAdmins = '', inputViewers = '' } = getValuesFromState({
      state: view.state,
      blockIds: this.blockIds,
    });
    const admins = [...new Set(inputAdmins.split(/[\s,]+/))];
    const viewers = [...new Set(inputViewers.split(/[\s,]+/))];

    logger.info(`${new Date()} - admins: ${admins} / viewers: ${viewers}`);

    const hosts: SpaceHost[] = [];
    admins.forEach((admin) => {
      hosts.push({ email: admin, accessType: 'ADMIN' });
    });
    viewers.forEach((viewer) => {
      hosts.push({ email: viewer, accessType: 'VIEWER' });
    });

    try {
      await SpaceApi.updateHosts(spaceHandle, { hosts });
      logger.info(`${new Date()} - hosts updated`);
    } catch (error) {
      logger.error(`${new Date()} - error: ${error}`);
      await ack({
        response_action: 'errors',
        errors: {
          [this.blockIds.inputAdmins]: 'Failed to update space hosts.',
          [this.blockIds.inputViewers]: 'Failed to update space hosts.',
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
      text:
        `*Space hosts updated* for <${getSpaceUrl(
          spaceHandle
        )}|@${spaceHandle}> by <@${userId}>\n` +
        `*Admins*: ${admins.join(', ')}\n*Viewers*: ${viewers.join(', ')}`,
    });
  }
}
