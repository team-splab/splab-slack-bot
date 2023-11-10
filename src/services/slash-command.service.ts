import { AllMiddlewareArgs, SlackCommandMiddlewareArgs } from '@slack/bolt';

export interface SlashCommandParams {
  params: string[];
}

export interface SlashCommandService {
  readonly slashCommandName: string;
  readonly slashCommandText: string;

  onSlashCommand(
    args: SlackCommandMiddlewareArgs & AllMiddlewareArgs & SlashCommandParams
  ): Promise<void>;
}
