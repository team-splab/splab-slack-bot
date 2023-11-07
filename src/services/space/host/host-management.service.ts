import { SlackCommandMiddlewareArgs, AllMiddlewareArgs } from '@slack/bolt';
import { StringIndexed } from '@slack/bolt/dist/types/helpers';
import { SlashCommandService } from '../../slash-command.service';
import { SLASH_COMMANDS } from '../../../utils/consts';

export class HostManagementService implements SlashCommandService {
  readonly slashCommandName = SLASH_COMMANDS.UMOH;
  readonly slashCommandText = '스페이스 호스트';

  async onSlashCommand({
    logger,
  }: SlackCommandMiddlewareArgs &
    AllMiddlewareArgs<StringIndexed>): Promise<void> {
    logger.info('test');
  }
}
