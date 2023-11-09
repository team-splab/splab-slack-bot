import {
  SlackCommandMiddlewareArgs,
  AllMiddlewareArgs,
  SlackViewMiddlewareArgs,
} from '@slack/bolt';
import { SlashCommandService } from '../../slash-command.service';
import { SLASH_COMMANDS } from '../../../utils/consts';
import { app } from '../../../app';

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
    ack,
  }: SlackCommandMiddlewareArgs & AllMiddlewareArgs): Promise<void> {
    const [spaceHandle] = command.text
      .split(this.slashCommandText)[1]
      .trim()
      .split(' ');
    const spaceHandleWithoutAt = spaceHandle.replace('@', '');

    if (!spaceHandle) {
      logger.info(`${new Date()} - space handle is not provided`);
      await ack({
        response_type: 'ephemeral',
        text: `Please enter the space handle. ex) \`${this.slashCommandName} ${this.slashCommandText} handle\``,
        mrkdwn: true,
      });
      return;
    }

    await ack({ response_type: 'in_channel' });

    logger.info(`${new Date()} - space handle: ${spaceHandleWithoutAt}`);
    client.views.open({
      trigger_id: command.trigger_id,
      view: {
        type: 'modal',
        callback_id: this.callbackId,
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
                text: `*Space* <https://umoh.io/@${spaceHandleWithoutAt}|@${spaceHandleWithoutAt}>`,
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
  }: SlackViewMiddlewareArgs & AllMiddlewareArgs) {
    logger.info(`${new Date()} - ${view.callback_id} modal submitted`);

    const adminsInput =
      Object.values(view.state.values[this.blockIds.inputAdmins])[0].value ||
      '';
    const viewersInput =
      Object.values(view.state.values[this.blockIds.inputViewers])[0].value ||
      '';
    const admins = adminsInput.split(/[\s,]+/);
    const viewers = viewersInput.split(/[\s,]+/);

    logger.info(`${new Date()} - admins: ${admins} / viewers: ${viewers}`);

    await ack();
  }
}
