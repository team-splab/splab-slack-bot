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
  SlackViewMiddlewareArgs,
} from '@slack/bolt';
import { getValuesFromState } from '../../../utils/slack';
import {
  deletePrivateMetadata,
  getPrivateMetadata,
  savePrivateMetadata,
} from '../../../utils/redis';
import { SignUpAndCreateSpaceProfileRequest } from '../../../apis/space/profile-create/types';
import { Block } from '../../../components/blocks';
import { getSpaceUrl } from '../../../utils/space';
import { SpaceProfileCreateApi } from '../../../apis/space/profile-create';

export class CardCreateService implements SlashCommandService {
  readonly slashCommandName = SLASH_COMMANDS.UMOH;
  readonly slashCommandText = 'card create';

  private readonly cardCreateView = new CardCreateView();

  constructor() {
    app.view(this.cardCreateView.callbackId, this.onModalSubmit.bind(this));
    app.view(
      {
        type: 'view_closed',
        callback_id: this.cardCreateView.callbackId,
      },
      async ({ ack, view, logger }) => {
        logger.info(`${new Date()} - ${view.callback_id} modal closed`);
        await ack();
        await deletePrivateMetadata({ viewId: view.id });
      }
    );

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
      spaceHandle: space.handle,
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

  private async onModalSubmit({
    view,
    ack,
    logger,
    client,
  }: SlackViewMiddlewareArgs & AllMiddlewareArgs) {
    logger.info(`${new Date()} - ${view.callback_id} modal submitted`);

    const {
      spaceId,
      spaceHandle,
      channel,
      userId,
      createCardRequestDtos,
    }: CardCreateViewPrivateMetadata = await getPrivateMetadata({
      viewId: view.id,
    });
    logger.info(
      `${new Date()} - spaceId: ${spaceId}, channel: ${channel}, userId: ${userId}, length of createCardRequestDtos: ${
        createCardRequestDtos.length
      }`
    );

    if (createCardRequestDtos.length === 0) {
      logger.error(`${new Date()} - createCardRequestDtos is empty`);
      await ack({
        response_action: 'errors',
        errors: {
          [this.cardCreateView.blockIds.inputSpreadsheetUrl]: 'Load Data first',
        },
      });
      return;
    }

    await ack({
      response_action: 'clear',
    });

    const userProfileResponse = await client.users.profile.get({
      user: userId,
    });
    logger.info(
      `${new Date()} - user profile: ${JSON.stringify(userProfileResponse)}`
    );
    const userDisplayName =
      userProfileResponse.profile?.display_name ||
      userProfileResponse.profile?.real_name;

    const { inputSpreadsheetUrl } = getValuesFromState({
      state: view.state,
      blockIds: this.cardCreateView.blockIds,
    });

    const messageResponse = await client.chat.postMessage({
      channel: channel,
      mrkdwn: true,
      text: `${userDisplayName} started creating cards`,
      blocks: [
        Block.Text(`*${userDisplayName}* started creating cards >`),
        Block.Fields({
          fields: [
            `*Space*\n<${getSpaceUrl(spaceHandle)}|@${spaceHandle}>`,
            `*Cards*\n${createCardRequestDtos.length}`,
            `*Spreadsheet*\n${inputSpreadsheetUrl}`,
          ],
        }),
      ],
    });

    let successCount = 0;
    let failCount = 0;
    for (const [index, card] of createCardRequestDtos.entries()) {
      try {
        await SpaceProfileCreateApi.signUpAndCreateProfile(card);
        logger.info(`${new Date()} - card created: ${JSON.stringify(card)}`);
        successCount++;

        await client.chat.postMessage({
          channel: channel,
          mrkdwn: true,
          thread_ts: messageResponse.ts,
          blocks: [
            Block.Text(
              `:white_check_mark: *${index + 1}. ${
                card.signUpInfo.email
              }* success`
            ),
          ],
        });
      } catch (e: any) {
        logger.error(`${new Date()} - error: ${JSON.stringify(e)}`);
        failCount++;

        await client.chat.postMessage({
          channel: channel,
          mrkdwn: true,
          thread_ts: messageResponse.ts,
          blocks: [
            Block.Text(`:x: *${index + 1}. ${card.signUpInfo.email}* failed`),
            Block.Context([JSON.stringify(e)]),
          ],
        });
      }
    }

    await client.chat.postMessage({
      channel: channel,
      mrkdwn: true,
      thread_ts: messageResponse.ts,
      reply_broadcast: true,
      blocks: [
        Block.Text(
          `Finished creating cards.\n*Success: ${successCount}*\n*Fail: ${failCount}*`
        ),
      ],
    });
  }
}
