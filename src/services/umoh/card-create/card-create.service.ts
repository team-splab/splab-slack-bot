import { GoogleSpreadsheet } from 'google-spreadsheet';
import { SpaceApi } from '../../../apis/space';
import { Space } from '../../../apis/space/types';
import { app } from '../../../app';
import {
  SlashCommandArgs,
  SlashCommandService,
} from '../../../interfaces/slash-command-service';
import { SLASH_COMMANDS } from '../../../utils/consts';
import {
  CardCreateView,
  CardCreateViewPrivateMetadata,
} from './card-create.view';
import { CardSpreadsheetProvider } from './card-spreadsheet-provider';
import {
  AllMiddlewareArgs,
  BlockButtonAction,
  SlackActionMiddlewareArgs,
} from '@slack/bolt';
import { getValuesFromState } from '../../../utils/slack';
import { getPrivateMetadata, savePrivateMetadata } from '../../../utils/redis';
import { SignUpAndCreateSpaceProfileRequest } from '../../../apis/space/profile-create.ts/types';

export class CardCreateService implements SlashCommandService {
  readonly slashCommandName = SLASH_COMMANDS.UMOH;
  readonly slashCommandText = 'card create';

  private readonly cardCreateView = new CardCreateView();

  constructor() {
    app.action(
      this.cardCreateView.actionIds.loadSpreadsheet,
      this.onLoadSpreadsheetAction.bind(this)
    );
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
      view: this.cardCreateView.build({}),
    });

    const viewId = viewRes.view?.id;
    if (!viewId) {
      logger.error(`${new Date()} - viewId is not provided`);
      return;
    }

    const privateMetadata: CardCreateViewPrivateMetadata = {
      spaceId: space.id,
      channel: command.channel_id,
      userId: command.user_id,
      createCardRequestDtos: [],
    };
    await savePrivateMetadata({ viewId, privateMetadata });
  }

  private async onLoadSpreadsheetAction({
    logger,
    client,
    body,
    ack,
  }: SlackActionMiddlewareArgs<BlockButtonAction> & AllMiddlewareArgs) {
    logger.info(`${new Date()} - onLoadSpreadsheetAction`);

    const view = body.view;
    if (!view) {
      logger.error(`${new Date()} - view is not provided`);
      await ack();
      return;
    }

    let metadata: CardCreateViewPrivateMetadata = await getPrivateMetadata({
      viewId: view.id,
    });

    const { inputSpreadsheetUrl } = getValuesFromState({
      state: view.state,
      blockIds: this.cardCreateView.blockIds,
    });

    let cards: SignUpAndCreateSpaceProfileRequest[] = [];
    try {
      const provider = new CardSpreadsheetProvider(
        inputSpreadsheetUrl || '',
        metadata.spaceId
      );
      await provider.initialize();
      cards = await provider.getCardData();
    } catch (error: any) {
      logger.error(`${new Date()} - error: ${error}`);
      await ack();

      await client.views.update({
        view_id: view.id,
        view: this.cardCreateView.build({
          error: error.toString(),
          spreadsheetUrl: inputSpreadsheetUrl,
        }),
      });
      return;
    } finally {
      metadata = {
        ...metadata,
        createCardRequestDtos: cards,
      };
      await savePrivateMetadata({
        viewId: view.id,
        privateMetadata: metadata,
      });
    }

    await ack();

    await client.views.update({
      view_id: view.id,
      view: this.cardCreateView.build({
        spreadsheetUrl: inputSpreadsheetUrl,
        cards,
      }),
    });
  }
}
