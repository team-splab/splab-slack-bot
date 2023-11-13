import { AllMiddlewareArgs, SlackCommandMiddlewareArgs } from '@slack/bolt';

export type SlashCommandArgs = SlackCommandMiddlewareArgs &
  AllMiddlewareArgs &
  SlashCommandParams;

export interface SlashCommandParams {
  params: string[];
}

export interface SlashCommandService {
  readonly slashCommandName: string;
  readonly slashCommandText: string;

  onSlashCommand(args: SlashCommandArgs): Promise<void>;
}
