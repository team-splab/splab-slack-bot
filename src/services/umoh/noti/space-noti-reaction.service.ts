import { AllMiddlewareArgs, SlackViewMiddlewareArgs, View } from '@slack/bolt';
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

interface PrivateMetadata {
  spaceHandle: string;
  channel: string;
  userId: string;
}

export class SpaceNotiReactionService implements SlashCommandService {
  readonly slashCommandName = SLASH_COMMANDS.UMOH;
  readonly slashCommandText = 'space noti reaction';
  private readonly callbackId = 'space-noti-reaction';
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
      } = await SpaceEngagingApi.getEngagingByReaction(spaceHandle);
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
            text: 'Send Engaging by 👍',
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
        text: `Failed to get space engaging data by reaction. Please check the space handle.`,
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

    try {
      await SpaceEngagingApi.sendEngagingByReaction(spaceHandle);
      logger.info(`${new Date()} - engaging(Reaction) Email, SMS sent`);
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
      text: `*Space engaging by reaction Email & SMS(Kakako) sent to guests from * <${getSpaceUrl(
        spaceHandle
      )}|@${spaceHandle}> by <@${userId}>\n`,
    });

    await deletePrivateMetadata({ viewId: view.id });
  }
}
