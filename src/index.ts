import dotenv from "dotenv";
import { app } from "./app";
import { MenuNotificationService } from "./services/menu-notification/menu-notification.service";
import * as cron from "node-cron";
import { ACTIONS, MENU_CHANNEL_ID } from "./utils/consts";
import { SPACE } from "./utils/consts";
import { MenuSelectService } from "./services/menu-notification/menu-select.service";
import { DailyReportService } from "./services/space/daily-report/daily-report.service";

dotenv.config();

export const menuNotificationService = new MenuNotificationService(
  MENU_CHANNEL_ID
);
const menuSelectService = new MenuSelectService();
const dailyReportService = new DailyReportService();

app.event("app_mention", async ({ event, say }) => {
  console.log(`${new Date()} - App mentioned`);
  await say(`Hey there <@${event.user}>! ${new Date().toLocaleString()}`);
});

app.action(ACTIONS.MENU_SELECT, menuSelectService.onMenuSelectAction);

app.command(SPACE.DAILY_REPORT, dailyReportService.sendDailyReport);

["*/5 9-12 * * MON-FRI", "0-30/5 13 * * MON-FRI"].forEach((cronTime) => {
  cron.schedule(
    cronTime,
    async () => {
      await menuNotificationService.sendMenuNotification();
    },
    { timezone: "Asia/Seoul" }
  );
});

(async () => {
  await app.start();
  console.log("⚡️ Bolt app started");
})();
