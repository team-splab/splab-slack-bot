import axios from "axios";
import { SlackCommandMiddlewareArgs } from "@slack/bolt";

export class DailyReportService {
  private API_ADMIN_SPACE = "https://api.sendtime.app/v2/admin/space/";
  private URL_DAILY_REPORT = "/daily";

  public async sendDailyReport({
    command,
    ack,
    say,
  }: SlackCommandMiddlewareArgs) {
    console.log(`${new Date()} - Space Daily Report: ${command.text}}`);
    await ack();

    if (!command.text) {
      await say(
        `Please enter Space's handle and your email address. ex) /daily_report handle example@splab.dev`
      );
    }

    axios.post(
      `${this.API_ADMIN_SPACE}
      ${command.text.split(" ")[0]}
      ${this.URL_DAILY_REPORT}
      ?email=${command.text.split(" ")[1]}`
    );

    await say(
      `Daily Report sent to <@${command.user_id}>'s email <@${
        command.text.split(" ")[1]
      }>! ${new Date().toLocaleString()}`
    );
  }
}
