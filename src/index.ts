import dotenv from 'dotenv';
import { app } from './app';
import { MenuNotificationService } from './services/menu-notification/menu-notification.service';

dotenv.config();

app.event('app_mention', async ({ event, say }) => {
  new MenuNotificationService().sendMenuNotification();
  await say(`Hey there <@${event.user}>!`);
});

(async () => {
  await app.start();
  console.log('⚡️ Bolt app started');
})();
