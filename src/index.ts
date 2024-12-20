import dotenv from 'dotenv';
import { app } from './app';
import { MENU_CHANNEL_ID, SLASH_COMMANDS } from './utils/consts';
import initUmohServices from './services/umoh';
import { DailyReportService } from './services/umoh/daily-report/daily-report.service';
import { HostManagementService } from './services/umoh/host/host-management.service';
import { SpaceEditService } from './services/umoh/edit/space-edit.service';
import { SlashCommandService } from './interfaces/slash-command-service';
import { SpaceCategoryEditService } from './services/umoh/edit/space-category-edit.service';
import { SpaceEditView } from './services/umoh/edit/space-edit.view';
import { SpaceCategoryEditView } from './services/umoh/edit/space-category-edit.view';
import { redisClient } from './redis';
import { SpaceNotiReactionService } from './services/umoh/noti/space-noti-reaction.service';
import { SpaceNotiScrapService } from './services/umoh/noti/space-noti-scrap.service';
import { CardCreateService } from './services/umoh/card-create/card-create.service';

dotenv.config();

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
const spaceCardCreateService = new CardCreateService();

const slashCommandServices: SlashCommandService[] = [
  new HostManagementService(),
  new SpaceEditService(
    spaceCategoryEditService,
    spaceCategoryCreateService,
    spaceEditView
  ),
  spaceNotiReactionService,
  spaceNotiScrapService,
  spaceCardCreateService,
  dailyReportService,
];

app.event('app_mention', async ({ event, say }) => {
  console.log(`${new Date()} - App mentioned`);
  await say(`Hey there <@${event.user}>! ${new Date().toLocaleString()}`);
});

initUmohServices(
  slashCommandServices.filter(
    (service) => service.slashCommandName === SLASH_COMMANDS.UMOH
  )
);

(async () => {
  await redisClient.connect();
  await app.start();
  console.log('⚡️ Bolt app started');
})();
