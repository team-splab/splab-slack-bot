import { AllMiddlewareArgs, SlackCommandMiddlewareArgs } from '@slack/bolt';

export interface SlashCommandService {
  readonly slashCommandName: string;
  readonly slashCommandText: string;

  onSlashCommand(
    args: SlackCommandMiddlewareArgs & AllMiddlewareArgs
  ): Promise<void>;
}
