import * as cron from 'node-cron';
import { app } from '../../app';
import { ACTIONS } from '../../utils/consts';
import { MenuNotificationService } from './menu-notification.service';
import { MenuSelectService } from './menu-select.service';

export default function initMenuNotificationService(
  menuNotificationService: MenuNotificationService,
  menuSelectService: MenuSelectService
): void {
  app.action(ACTIONS.MENU_SELECT, menuSelectService.onMenuSelectAction);

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
}
