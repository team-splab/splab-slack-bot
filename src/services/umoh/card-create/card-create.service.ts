import { SpaceApi } from '../../../apis/space';
import { Space } from '../../../apis/space/types';
import { app } from '../../../app';
import {
  SlashCommandArgs,
  SlashCommandService,
} from '../../../interfaces/slash-command-service';
import { SLASH_COMMANDS } from '../../../utils/consts';
import { CardCreateView } from './card-create.view';

export class CardCreateService implements SlashCommandService {
  readonly slashCommandName = SLASH_COMMANDS.UMOH;
  readonly slashCommandText = 'card create';

  private readonly cardCreateView = new CardCreateView();

  constructor() {
    app.action(this.cardCreateView.actionIds.loadSpreadsheet, async () => {
      console.log('test');
    });
  }

  async onSlashCommand({
    logger,
    client,
    command,
    params: [spaceHandle],
    ack,
  }: SlashCommandArgs): Promise<void> {
    spaceHandle = spaceHandle.replace('@', '');

    if (!spaceHandle) {
      logger.info(`${new Date()} - space handle is not provided`);
      await ack({
        response_type: 'ephemeral',
        text: `Please enter the space handle. ex) \`${this.slashCommandName} ${this.slashCommandText} handle\``,
      });
      return;
    }

    logger.info(`${new Date()} - space handle: ${spaceHandle}`);

    let space: Space;
    try {
      const {
        data: {
          results: [response],
        },
      } = await SpaceApi.getSpace(spaceHandle);
      space = response;
      logger.info(`${new Date()} - space: ${JSON.stringify(space)}`);
    } catch (error) {
      logger.error(`${new Date()} - error: ${error}`);
      await ack({
        response_type: 'ephemeral',
        text: `Failed to fetch space. Please check the space handle.`,
      });
      return;
    }

    await ack({ response_type: 'in_channel' });

    const viewRes = await client.views.open({
      trigger_id: command.trigger_id,
      view: this.cardCreateView.build(),
    });

    // const viewId = viewRes.view?.id;
    // if (!viewId) {
    //   logger.error(`${new Date()} - viewId is not provided`);
    //   return;
    // }

    // const privateMetadata: SpaceEditViewPrivateMetadata = {
    //   spaceHandle,
    //   channel: command.channel_id,
    //   userId: command.user_id,
    //   categoryItems: space.profileCategoryConfig?.categoryItems || [],
    // };
    // await savePrivateMetadata({ viewId, privateMetadata });
  }
}
