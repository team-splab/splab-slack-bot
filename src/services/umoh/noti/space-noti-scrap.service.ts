import {
  AllMiddlewareArgs,
  SlackViewMiddlewareArgs,
  View,
  ViewOutput,
} from '@slack/bolt';
import {
  SlashCommandArgs,
  SlashCommandService,
} from '../../../interfaces/slash-command-service';
import { SLASH_COMMANDS } from '../../../utils/consts';
import { app } from '../../../app';
import { SpaceApi } from '../../../apis/space';
import { getSpaceUrl } from '../../../utils/space';
import {
  deletePrivateMetadata,
  getPrivateMetadata,
  savePrivateMetadata,
} from '../../../utils/redis';
import { SpaceEngagingApi } from '../../../apis/space/engaging';
import { getValuesFromState } from '../../../utils/slack';

interface PrivateMetadata {
  spaceHandle: string;
  channel: string;
  userId: string;
}

export class SpaceNotiScrapService implements SlashCommandService {
  readonly slashCommandName = SLASH_COMMANDS.UMOH;
  readonly slashCommandText = 'space noti scrap';
  private readonly callbackId = 'space-noti-scrap';
  constructor() {
    app.view(this.callbackId, this.onModalSubmit.bind(this));
    app.view(
      {
        type: 'view_closed',
        callback_id: this.callbackId,
      },
      async ({ ack, view, logger }) => {
        logger.info(`${new Date()} - ${view.callback_id} modal closed`);
        await ack();
        await deletePrivateMetadata({ viewId: view.id });
      }
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

    try {
      const {
        data: {
          results: [response],
        },
      } = await SpaceEngagingApi.getEngagingByScrap(spaceHandle);
      logger.info(
        `${new Date()} - noti: ${response.type} / ${response.spaceHandle}`
      );

      const viewRes = await client.views.open({
        trigger_id: command.trigger_id,
        view: {
          type: 'modal',
          callback_id: this.callbackId,
          notify_on_close: true,
          title: {
            type: 'plain_text',
            text: 'Send Engaging by scrap 🔖',
          },
          submit: {
            type: 'plain_text',
            text: 'Submit',
          },
          close: {
            type: 'plain_text',
            text: 'Cancel',
          },
          blocks: [
            {
              type: 'section',
              text: {
                type: 'mrkdwn',
                text: `Engaging email, sms will send to guests from: *<${getSpaceUrl(
                  spaceHandle
                )}|@${spaceHandle}>*`,
              },
            },
            {
              type: 'divider',
            },
            {
              type: 'section',
              text: {
                type: 'mrkdwn',
                text: `*Title:* ${response.popularProfile.title}\n*Category:* ${response.popularProfile.category}\n*Introduce:* ${response.popularProfile.introduce}\n`,
              },
              accessory: {
                type: 'image',
                image_url: `${
                  response.popularProfile.imageUrl == ''
                    ? 'https://storage.umoh.io/official/umoh_icon_gray.png'
                    : response.popularProfile.imageUrl
                }`,
                alt_text: 'computer thumbnail',
              },
            },
            {
              type: 'divider',
            },
            {
              type: 'context',
              elements: [
                {
                  type: 'image',
                  image_url:
                    'https://api.slack.com/img/blocks/bkb_template_images/notificationsWarningIcon.png',
                  alt_text: 'notifications warning icon',
                },
                {
                  type: 'mrkdwn',
                  text: ` *Above profile will send to ${response.profiles.length.toString()} people.*`,
                },
              ],
            },
            {
              type: 'input',
              block_id: 'dday-select',
              element: {
                type: 'static_select',
                placeholder: {
                  type: 'plain_text',
                  text: 'Select an item',
                  emoji: true,
                },
                options: [
                  {
                    text: {
                      type: 'plain_text',
                      text: '0',
                      emoji: true,
                    },
                    value: 'day',
                  },
                  {
                    text: {
                      type: 'plain_text',
                      text: '1',
                      emoji: true,
                    },
                    value: '1',
                  },
                  {
                    text: {
                      type: 'plain_text',
                      text: '2',
                      emoji: true,
                    },
                    value: '2',
                  },
                  {
                    text: {
                      type: 'plain_text',
                      text: '3',
                      emoji: true,
                    },
                    value: '3',
                  },
                  {
                    text: {
                      type: 'plain_text',
                      text: '4',
                      emoji: true,
                    },
                    value: '4',
                  },
                  {
                    text: {
                      type: 'plain_text',
                      text: '5',
                      emoji: true,
                    },
                    value: '5',
                  },
                  {
                    text: {
                      type: 'plain_text',
                      text: '6',
                      emoji: true,
                    },
                    value: '6',
                  },
                  {
                    text: {
                      type: 'plain_text',
                      text: '7',
                      emoji: true,
                    },
                    value: '7',
                  },
                  {
                    text: {
                      type: 'plain_text',
                      text: '8',
                      emoji: true,
                    },
                    value: '8',
                  },
                  {
                    text: {
                      type: 'plain_text',
                      text: '9',
                      emoji: true,
                    },
                    value: '9',
                  },
                  {
                    text: {
                      type: 'plain_text',
                      text: '10',
                      emoji: true,
                    },
                    value: '10',
                  },
                ],
                action_id: 'dday-select-action',
              },
              label: {
                type: 'plain_text',
                text: 'Day minus',
                emoji: true,
              },
            },
          ],
        },
      });

      const viewId = viewRes.view?.id;
      if (!viewId) {
        logger.error(`${new Date()} - viewId is not provided`);
        return;
      }

      const privateMetadata: PrivateMetadata = {
        spaceHandle,
        channel: command.channel_id,
        userId: command.user_id,
      };
      await savePrivateMetadata({ viewId, privateMetadata });
    } catch (error) {
      logger.error(`${new Date()} - error: ${error}`);
      await ack({
        response_type: 'ephemeral',
        text: `Failed to get space engaging data by scrap. Please check the space handle.`,
      });
      return;
    }

    await ack({ response_type: 'in_channel' });
  }

  async onModalSubmit({
    view,
    ack,
    logger,
    client,
  }: SlackViewMiddlewareArgs & AllMiddlewareArgs) {
    logger.info(`${new Date()} - ${view.callback_id} modal submitted`);
    const { spaceHandle, channel, userId }: PrivateMetadata =
      await getPrivateMetadata({
        viewId: view.id,
      });
    logger.info(
      `${new Date()} - space handle: ${spaceHandle}, channel: ${channel}, userId: ${userId}`
    );

    const day = this.getDayFromState(view.state);

    try {
      await SpaceEngagingApi.sendEngagingByScrap(spaceHandle, day);
      logger.info(`${new Date()} - engaging(Scrap) Email, SMS sent`);
    } catch (error) {
      logger.error(`${new Date()} - error: ${error}`);
      await ack({
        response_action: 'errors',
        errors: {
          'Failed to send engaging Email, SMS': 'Data not enough.',
        },
      });
      return;
    }
    await ack({
      response_action: 'clear',
    });
    await client.chat.postMessage({
      channel: channel,
      mrkdwn: true,
      text: `*Space engaging by scrap Email & SMS(Kakako) sent to guests from * <${getSpaceUrl(
        spaceHandle
      )}|@${spaceHandle}> by <@${userId}>\n`,
    });

    await deletePrivateMetadata({ viewId: view.id });
  }

  private getDayFromState(state: ViewOutput['state']): string {
    let values = getValuesFromState({
      state: state,
      blockIds: { ddaySelect: 'dday-select' },
    });
    values = {
      ddaySelect: values.ddaySelect?.trim(),
    };

    return values.ddaySelect ?? '1';
  }
}
