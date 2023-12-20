import { SlackCommandMiddlewareArgs } from '@slack/bolt';
import { SLASH_COMMANDS } from '../../../utils/consts';
import {
  SlashCommandArgs,
  SlashCommandService,
} from '../../../interfaces/slash-command-service';
import { sendtimeApi } from '../../../utils/api';

export class DailyReportService implements SlashCommandService {
  readonly slashCommandName = SLASH_COMMANDS.UMOH;
  readonly slashCommandText = 'daily report';

  async onSlashCommand({
    logger,
    command,
    ack,
    say,
    params: [spaceHandle, email],
  }: SlashCommandArgs & SlackCommandMiddlewareArgs): Promise<void> {
    console.log(`${new Date()} - Space Daily Report: ${command.text}}`);
    await ack();

    spaceHandle = spaceHandle.replace('@', '');

    if (!command.text) {
      logger.info(`${new Date()} - command wrong`);
      await ack({
        response_type: 'ephemeral',
        text: `Please enter Space's handle and your email address. ex) /daily_report handle example@splab.dev\``,
      });
      return;
    }

    logger.info(` ====> ${spaceHandle}, ${email}`);

    try {
      sendtimeApi.get(
        `${process.env.SENDTIME_API_URL}/v2/admin/space/${spaceHandle}/daily`,
        {
          params: {
            email: email,
          },
        }
      );
    } catch (err) {
      logger.error(err);
    }

    await say(
      `Daily Report sent to <@${
        command.user_id
      }>'s email <${email}>! ${new Date().toLocaleString()}`
    );

    await ack({ response_type: 'in_channel' });
  }
}
