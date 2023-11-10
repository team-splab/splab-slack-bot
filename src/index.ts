import dotenv from 'dotenv';
import { app } from './app';
import { MenuNotificationService } from './services/menu-notification/menu-notification.service';
import { MENU_CHANNEL_ID, SLASH_COMMANDS } from './utils/consts';
import { MenuSelectService } from './services/menu-notification/menu-select.service';
import initSpaceServices from './services/space';
import { DailyReportService } from './services/space/daily-report/daily-report.service';
import { HostManagementService } from './services/space/host/host-management.service';
import { SpaceEditService } from './services/space/edit/space-edit.service';
import { SlashCommandService } from './services/slash-command.service';
import initMenuNotificationService from './services/menu-notification';

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

initSpaceServices(
  dailyReportService,
  slashCommandServices.filter(
    (service) => service.slashCommandName === SLASH_COMMANDS.UMOH
  )
);
initMenuNotificationService(menuNotificationService, menuSelectService);

(async () => {
  await app.start();
  console.log('⚡️ Bolt app started');
})();
