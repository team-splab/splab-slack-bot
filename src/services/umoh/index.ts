import { app } from '../../app';
import { SLASH_COMMANDS } from '../../utils/consts';
import { SlashCommandService } from '../../interfaces/slash-command-service';
import { DailyReportService } from './daily-report/daily-report.service';

export default function initUmohServices(
  dailyReportService: DailyReportService,
  slashCommandServices: SlashCommandService[]
): void {
  app.command(SLASH_COMMANDS.DAILY_REPORT, dailyReportService.sendDailyReport);

  app.command(SLASH_COMMANDS.UMOH, async (args) => {
    const { logger, command, ack } = args;
    logger.info(`${new Date()} - ${command.command} ${command.text}`);

    for (const service of slashCommandServices.filter(
      (service) => service.slashCommandName === command.command
    )) {
      if (command.text.startsWith(service.slashCommandText)) {
        const params = command.text
          .split(service.slashCommandText)[1]
          .trim()
          .split(' ')
          .filter((param) => param);

        await service.onSlashCommand({ ...args, params });
        return;
      }
    }

    await ack({
      response_type: 'ephemeral',
      text: `\`${command.command} ${command.text}\` command is not supported.`,
    });
  });
}
