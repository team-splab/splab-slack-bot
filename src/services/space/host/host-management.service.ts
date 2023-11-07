import { SlackCommandMiddlewareArgs, AllMiddlewareArgs } from '@slack/bolt';
import { StringIndexed } from '@slack/bolt/dist/types/helpers';
import { SlashCommandService } from '../../slash-command.service';
import { SLASH_COMMANDS } from '../../../utils/consts';

export class HostManagementService implements SlashCommandService {
  readonly slashCommandName = SLASH_COMMANDS.UMOH;
  readonly slashCommandText = 'space host';

  async onSlashCommand({
    logger,
    client,
    command,
  }: SlackCommandMiddlewareArgs &
    AllMiddlewareArgs<StringIndexed>): Promise<void> {
    client.views.open({
      trigger_id: command.trigger_id,
      view: {
        type: 'modal',
        title: {
          type: 'plain_text',
          text: 'Host Management',
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
            type: 'input',
            optional: true,
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
                text: 'ex) leo@splab.dev, kang@splab.dev, ⋯',
              },
            },
          },
          {
            type: 'input',
            optional: true,
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
                text: 'ex) leo@splab.dev, kang@splab.dev, ⋯',
              },
            },
          },
        ],
      },
    });
  }
}
