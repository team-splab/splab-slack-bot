import dotenv from 'dotenv';
import { app } from './app';
import { MenuNotificationService } from './services/menu-notification/menu-notification.service';

dotenv.config();

const menuNotificationService = new MenuNotificationService();
app.event('app_mention', async ({ event, say }) => {
  menuNotificationService.sendMenuNotification();
  await say(`Hey there <@${event.user}>!`);
});

(async () => {
  await app.start();
  console.log('⚡️ Bolt app started');
})();
