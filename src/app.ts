import dotenv from 'dotenv';
import { App } from '@slack/bolt';

dotenv.config();

export const app = new App({
  token: process.env.SLACK_BOT_TOKEN,
  appToken: process.env.SLACK_APP_TOKEN,
  socketMode: true,
});
