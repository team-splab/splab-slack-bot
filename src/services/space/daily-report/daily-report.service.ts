import axios from 'axios';
import { SlackCommandMiddlewareArgs } from '@slack/bolt';

export class DailyReportService {
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

    const [handle, email] = command.text.split(' ');

    axios.get(`https://api.sendtime.app/v2/admin/space/${handle}/daily`, {
      params: {
        email: email,
      },
    });

    await say(
      `Daily Report sent to <@${command.user_id}>'s email <@${
        command.text.split(' ')[1]
      }>! ${new Date().toLocaleString()}`
    );
  }
}
