import dotenv from 'dotenv';
import { app } from './app';
import { MenuNotificationService } from './services/menu-notification/menu-notification.service';
import * as cron from 'node-cron';
import { ACTIONS, MENU_CHANNEL_ID } from './utils/consts';
import { SLASH_COMMANDS } from './utils/consts';
import { MenuSelectService } from './services/menu-notification/menu-select.service';
import { DailyReportService } from './services/space/daily-report/daily-report.service';
import { HostManagementService } from './services/space/host/host-management.service';
import { SlashCommandService } from './services/slash-command.service';
import { SpaceEditService } from './services/space/edit/space-edit.service';

dotenv.config();

export const menuNotificationService = new MenuNotificationService(
  MENU_CHANNEL_ID
);
const menuSelectService = new MenuSelectService();
const dailyReportService = new DailyReportService();
const slashCommandServices: SlashCommandService[] = [
  new HostManagementService(),
  new SpaceEditService(),
];

app.event('app_mention', async ({ event, say }) => {
  console.log(`${new Date()} - App mentioned`);
  await say(`Hey there <@${event.user}>! ${new Date().toLocaleString()}`);
});

app.action(ACTIONS.MENU_SELECT, menuSelectService.onMenuSelectAction);

app.command(SLASH_COMMANDS.DAILY_REPORT, dailyReportService.sendDailyReport);

app.command(SLASH_COMMANDS.UMOH, async (args) => {
  const { logger, command, ack } = args;
  logger.info(`${new Date()} - ${command.command} ${command.text}`);

  for (const service of slashCommandServices.filter(
    (service) => service.slashCommandName === command.command
  )) {
    if (command.text.startsWith(service.slashCommandText)) {
      await service.onSlashCommand(args);
      return;
    }
  }

  await ack({
    response_type: 'ephemeral',
    text: `\`${command.command} ${command.text}\` command is not supported.`,
  });
});

if (process.env.IS_PRODUCTION === 'true') {
  ['*/5 9-12 * * MON-FRI', '0-30/5 13 * * MON-FRI'].forEach((cronTime) => {
    cron.schedule(
      cronTime,
      async () => {
        await menuNotificationService.sendMenuNotification();
      },
      { timezone: 'Asia/Seoul' }
    );
  });
}

(async () => {
  await app.start();
  console.log('⚡️ Bolt app started');
})();
