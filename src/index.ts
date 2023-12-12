import dotenv from 'dotenv';
import { app } from './app';
import { MenuNotificationService } from './services/menu-notification/menu-notification.service';
import { MENU_CHANNEL_ID, SLASH_COMMANDS } from './utils/consts';
import { MenuSelectService } from './services/menu-notification/menu-select.service';
import initUmohServices from './services/umoh';
import { DailyReportService } from './services/umoh/daily-report/daily-report.service';
import { HostManagementService } from './services/umoh/host/host-management.service';
import { SpaceEditService } from './services/umoh/edit/space-edit.service';
import { SlashCommandService } from './interfaces/slash-command-service';
import initMenuNotificationService from './services/menu-notification';
import { SpaceCategoryEditService } from './services/umoh/edit/space-category-edit.service';
import { SpaceEditView } from './services/umoh/edit/space-edit.view';
import { SpaceCategoryEditView } from './services/umoh/edit/space-category-edit.view';
import { redisClient } from './redis';
import { SpaceNotiReactionService } from './services/umoh/noti/space-noti-reaction.service';
import { SpaceNotiScrapService } from './services/umoh/noti/space-noti-scrap.service';

dotenv.config();

export const menuNotificationService = new MenuNotificationService(
  MENU_CHANNEL_ID
);
const menuSelectService = new MenuSelectService();
const dailyReportService = new DailyReportService();
const spaceEditView = new SpaceEditView();
const spaceCategoryEditView = new SpaceCategoryEditView();
const spaceCategoryEditService = new SpaceCategoryEditService(
  spaceCategoryEditView,
  spaceEditView
);
const spaceCategoryCreateView = new SpaceCategoryEditView(true);
const spaceCategoryCreateService = new SpaceCategoryEditService(
  spaceCategoryCreateView,
  spaceEditView,
  true
);
const spaceNotiReactionService = new SpaceNotiReactionService();
const spaceNotiScrapService = new SpaceNotiScrapService();
const slashCommandServices: SlashCommandService[] = [
  new HostManagementService(),
  new SpaceEditService(
    spaceCategoryEditService,
    spaceCategoryCreateService,
    spaceEditView
  ),
  spaceNotiReactionService,
  spaceNotiScrapService,
];

app.event('app_mention', async ({ event, say }) => {
  console.log(`${new Date()} - App mentioned`);
  await say(`Hey there <@${event.user}>! ${new Date().toLocaleString()}`);
});

initUmohServices(
  dailyReportService,
  slashCommandServices.filter(
    (service) => service.slashCommandName === SLASH_COMMANDS.UMOH
  )
);
initMenuNotificationService(menuNotificationService, menuSelectService);

(async () => {
  await redisClient.connect();
  await app.start();
  console.log('⚡️ Bolt app started');
})();
