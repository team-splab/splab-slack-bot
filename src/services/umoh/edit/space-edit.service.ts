import {
  AllMiddlewareArgs,
  KnownBlock,
  SlackViewMiddlewareArgs,
} from '@slack/bolt';
import {
  SlashCommandArgs,
  SlashCommandService,
} from '../../../interfaces/slash-command-service';
import { SLASH_COMMANDS } from '../../../utils/consts';
import { app } from '../../../app';
import {
  Space,
  SpaceProfileCategoryItem,
  SpaceSupportedSocial,
  SpaceSupportedSocials,
  SpaceUpdateParams,
} from '../../../apis/space/types';
import { SpaceApi } from '../../../apis/space';
import { getSpaceUrl } from '../../../utils/space';
import { getValuesFromState } from '../../../utils/slack';
import { SpaceCategoryEditService } from './space-category-edit.service';
import { SpaceEditView, SpaceEditViewPrivateMetadata } from './space-edit.view';

export class SpaceEditService implements SlashCommandService {
  readonly slashCommandName = SLASH_COMMANDS.UMOH;
  readonly slashCommandText = 'space edit';

  private readonly categoryEditService: SpaceCategoryEditService;
  private readonly categoryCreateService: SpaceCategoryEditService;
  private readonly spaceEditView: SpaceEditView;

  constructor(
    categoryEditService: SpaceCategoryEditService,
    categoryCreateService: SpaceCategoryEditService,
    spaceEditView: SpaceEditView
  ) {
    this.categoryEditService = categoryEditService;
    this.categoryCreateService = categoryCreateService;
    this.spaceEditView = spaceEditView;

    app.view(this.spaceEditView.callbackId, this.onModalSubmit.bind(this));
    app.action(
      this.spaceEditView.actionIds.categoryActionsOverflow,
      this.categoryEditService.onCategoryEditOrDelete.bind(
        this.categoryEditService
      )
    );
    app.action(
      this.spaceEditView.actionIds.addCategory,
      this.categoryCreateService.onCategoryCreate.bind(
        this.categoryCreateService
      )
    );
    app.action(
      this.spaceEditView.actionIds.selectDefaultLanguage,
      async ({ ack }) => await ack()
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

    await client.views.open({
      trigger_id: command.trigger_id,
      view: this.spaceEditView.build({
        privateMetadata: {
          spaceHandle,
          channel: command.channel_id,
          userId: command.user_id,
          categoryItems: space.profileCategoryConfig?.categoryItems || [],
        },
        initialValues: {
          handle: space.handle,
          title: space.title,
          description: space.description,
          categoryItems: space.profileCategoryConfig?.categoryItems || [],
          categorySelectPlaceholder:
            space.profileCategoryConfig?.localizedCategoryLabels.find(
              ({ language }) => language === space.defaultLanguage
            )?.text,
          maxCategorySelections: space.profileCategoryConfig?.maxItemNumber,
          defaultLanguage: space.defaultLanguage,
          socialLinks: space.profileCreateConfig?.supportedSocials,
        },
      }),
    });
  }

  async onModalSubmit({
    view,
    ack,
    logger,
    client,
  }: SlackViewMiddlewareArgs & AllMiddlewareArgs) {
    logger.info(`${new Date()} - ${view.callback_id} modal submitted`);

    const { spaceHandle, channel, userId, categoryItems } = JSON.parse(
      view.private_metadata
    ) as SpaceEditViewPrivateMetadata;
    logger.info(
      `${new Date()} - space handle: ${spaceHandle}, channel: ${channel}, userId: ${userId}`
    );

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
        response_action: 'errors',
        errors: {
          [Object.values(this.spaceEditView.blockIds)[0]]:
            'Failed to fetch space',
        },
      });
      return;
    }

    const {
      inputTitle,
      inputDescription,
      inputHandle,
      inputDefaultLanguage,
      inputCategorySelectPlaceholder,
      inputMaxCategorySelections,
      inputSocialLinks,
    } = getValuesFromState({
      state: view.state,
      blockIds: this.spaceEditView.blockIds,
    });

    const defaultLanguage = inputDefaultLanguage || space.defaultLanguage;
    const localizedCategoryLabels =
      space.profileCategoryConfig?.localizedCategoryLabels || [];
    const label = localizedCategoryLabels.find(
      ({ language }) => language === defaultLanguage
    );
    if (label) {
      label.text = inputCategorySelectPlaceholder || '';
    } else {
      localizedCategoryLabels.push({
        language: defaultLanguage,
        text: inputCategorySelectPlaceholder || '',
      });
    }

    const spaceUpdateParams: SpaceUpdateParams = {
      ...space,
      handle: inputHandle || space.handle,
      title: inputTitle || space.title,
      description: inputDescription,
      defaultLanguage,
      profileCreateConfig: {
        ...space.profileCreateConfig,
        defaultLanguage,
        supportedSocials: (inputSocialLinks?.split(',') ||
          []) as SpaceSupportedSocial[],
      },
      profileCategoryConfig:
        categoryItems.length === 0
          ? undefined
          : {
              defaultLanguage,
              categoryItems,
              localizedCategoryLabels,
              maxItemNumber: inputMaxCategorySelections
                ? parseInt(inputMaxCategorySelections)
                : space.profileCategoryConfig?.maxItemNumber || 1,
            },
      id: undefined,
      hostId: undefined,
      hosts: undefined,
      todayViews: undefined,
    };
    logger.info(
      `${new Date()} - space update params: ${JSON.stringify(
        spaceUpdateParams
      )}`
    );

    let spaceUpdated: Space;
    try {
      const {
        data: {
          results: [response],
        },
      } = await SpaceApi.updateSpace(space.handle, spaceUpdateParams);
      spaceUpdated = response;
      logger.info(`${new Date()} - space updated`);
    } catch (error) {
      logger.error(`${new Date()} - error: ${error}`);
      await ack({
        response_action: 'errors',
        errors: {
          [Object.values(this.spaceEditView.blockIds)[0]]:
            'Failed to edit space',
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
      text: `@${spaceUpdated.handle} has been edited by <@${userId}>`,
      blocks: [
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `*<${getSpaceUrl(spaceUpdated.handle)}|@${
              spaceUpdated.handle
            }>* has been edited by <@${userId}>`,
          },
        },
        {
          type: 'header',
          text: {
            type: 'plain_text',
            text: 'Basic Information',
          },
        },
        {
          type: 'divider',
        },
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text:
              `*Handle*\n@${spaceUpdated.handle}\n` +
              `*Title*\n${spaceUpdated.title}\n` +
              `*Description*\n${spaceUpdated.description || ''}\n` +
              `*Default Language*\n${spaceUpdated.defaultLanguage}`,
          },
        },
        {
          type: 'header',
          text: {
            type: 'plain_text',
            text: 'Category Configuration',
          },
        },
        {
          type: 'divider',
        },
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text:
              `*Category Select Placeholder*\n${
                spaceUpdated.profileCategoryConfig?.localizedCategoryLabels.find(
                  ({ language }) => language === spaceUpdated.defaultLanguage
                )?.text || ''
              }\n` +
              `*Max Category Selections*\n${
                spaceUpdated.profileCategoryConfig?.maxItemNumber || 1
              }`,
          },
        },
        {
          type: 'divider',
        },
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: '*Category Items*',
          },
        },
        ...this.buildCategoryBlocks(categoryItems),
        {
          type: 'header',
          text: {
            type: 'plain_text',
            text: 'Profile Card Configuration',
          },
        },
        {
          type: 'divider',
        },
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `*Supported Socials*\n${
              spaceUpdated.profileCreateConfig?.supportedSocials
                ?.map((social) => SpaceSupportedSocials[social].label)
                .join(', ') || ''
            }`,
          },
        },
      ],
    });
  }

  private buildCategoryBlocks(
    categoryItems: SpaceProfileCategoryItem[]
  ): KnownBlock[] {
    const blocks: KnownBlock[] = [];

    categoryItems.forEach((categoryItem) => {
      blocks.push({
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: categoryItem.localizedNames.map(({ text }) => text).join(' | '),
        },
      });
      blocks.push({
        type: 'context',
        elements: [
          {
            type: 'mrkdwn',
            text: categoryItem.id,
          },
          {
            type: 'mrkdwn',
            text: categoryItem.color || ' ',
          },
        ],
      });
      blocks.push({
        type: 'divider',
      });
    });

    return blocks;
  }
}
