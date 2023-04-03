import dotenv from 'dotenv';
import { app } from './app';
import { MenuNotificationService } from './services/menu-notification/menu-notification.service';
import * as cron from 'node-cron';
import { MENU_CHANNEL_ID } from './utils/consts';

dotenv.config();

const menuNotificationService = new MenuNotificationService(MENU_CHANNEL_ID);

app.event('app_mention', async ({ event, say }) => {
  await say(`Hey there <@${event.user}>!`);
  await menuNotificationService.sendMenuNotification();
});

cron.schedule('30-30 11-13 * * MON-FRI', async () => {
  await menuNotificationService.sendMenuNotification();
});

(async () => {
  await app.start();
  console.log('⚡️ Bolt app started');
})();
