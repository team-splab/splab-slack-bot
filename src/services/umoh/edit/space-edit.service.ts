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
  SpaceBoardAccessType,
  SpaceContactPoint,
  SpaceProfileCategoryItem,
  SpaceSupportedSocial,
  SpaceSupportedSocials,
  SpaceUpdateParams,
} from '../../../apis/space/types';
import { SpaceApi } from '../../../apis/space';
import {
  getContactPoint,
  getSpaceUrl,
  updateLocalizedTexts,
} from '../../../utils/space';
import { getValuesFromState, postBlocksInThread } from '../../../utils/slack';
import { SpaceCategoryEditService } from './space-category-edit.service';
import { SpaceEditView, SpaceEditViewPrivateMetadata } from './space-edit.view';
import { capitalizeFirstLetter } from '../../../utils/stringUtils';

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
      this.spaceEditView.actionIds.selectIgnore,
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
          contacts: space.contactPoints
            .filter(({ value }) => value)
            .map(({ value }) => value)
            .join(', '),
          categoryItems: space.profileCategoryConfig?.categoryItems || [],
          categorySelectPlaceholder:
            space.profileCategoryConfig?.localizedCategoryLabels.find(
              ({ language }) => language === space.defaultLanguage
            )?.text,
          maxCategorySelections: space.profileCategoryConfig?.maxItemNumber,
          defaultLanguage: space.defaultLanguage,
          socialLinks: space.profileCreateConfig?.supportedSocials,
          subtitlePlaceholder:
            space.profileCreateConfig?.localizedSubtitlePlaceholders?.find(
              ({ language }) => language === space.defaultLanguage
            )?.text,
          boardAccessType: space.boardConfig?.isEnabled
            ? space.boardConfig?.accessType
            : 'DISABLED',
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
      inputHandle,
      inputTitle,
      inputDescription,
      inputContacts,
      inputDefaultLanguage,
      inputCategorySelectPlaceholder,
      inputMaxCategorySelections,
      inputSocialLinks,
      inputSubtitlePlaceholder,
      inputBoardAccessType,
    } = getValuesFromState({
      state: view.state,
      blockIds: this.spaceEditView.blockIds,
    });

    const contactPoints: SpaceContactPoint[] =
      inputContacts?.split(/[\n,]+/).map((value) => getContactPoint(value)) ||
      [];

    const defaultLanguage = inputDefaultLanguage || space.defaultLanguage;
    const localizedCategoryLabels = updateLocalizedTexts(
      space.profileCategoryConfig?.localizedCategoryLabels || [],
      {
        language: defaultLanguage,
        text: inputCategorySelectPlaceholder || '',
      }
    );
    const localizedSubtitlePlaceholders = updateLocalizedTexts(
      space.profileCreateConfig?.localizedSubtitlePlaceholders || [],
      {
        language: defaultLanguage,
        text: inputSubtitlePlaceholder || '',
      }
    );

    const spaceUpdateParams: SpaceUpdateParams = {
      ...space,
      handle: inputHandle || space.handle,
      title: inputTitle || space.title,
      description: inputDescription,
      contactPoints,
      defaultLanguage,
      profileCreateConfig: {
        ...space.profileCreateConfig,
        defaultLanguage,
        supportedSocials: (inputSocialLinks
          ?.split(',')
          .filter((value) => value) || []) as SpaceSupportedSocial[],
        localizedSubtitlePlaceholders:
          localizedSubtitlePlaceholders.length === 0
            ? undefined
            : localizedSubtitlePlaceholders,
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
      profileSubtitleType:
        localizedSubtitlePlaceholders.length === 0 ? 'CATEGORY' : 'SUBTITLE',
      boardConfig: {
        isEnabled: inputBoardAccessType !== 'DISABLED',
        accessType:
          inputBoardAccessType !== 'DISABLED'
            ? (inputBoardAccessType as SpaceBoardAccessType)
            : 'PRIVATE',
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

    const blocks = [
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
            `${spaceUpdated.contactPoints
              .map(
                ({ type, value }) =>
                  `*${capitalizeFirstLetter(type)}*\n${value}`
              )
              .join('\n')}\n` +
            `*Default language*\n${spaceUpdated.defaultLanguage}`,
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
            `*Category select placeholder*\n${
              spaceUpdated.profileCategoryConfig?.localizedCategoryLabels.find(
                ({ language }) => language === spaceUpdated.defaultLanguage
              )?.text || ''
            }\n` +
            `*Maximum number of selections*\n${
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
          text: '*Category items*',
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
          text: `*Supported socials*\n${
            spaceUpdated.profileCreateConfig?.supportedSocials
              ?.map((social) => SpaceSupportedSocials[social].label)
              .join(', ') || ''
          }`,
        },
      },
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `*Subtitle placeholder*\n${
            spaceUpdated.profileCreateConfig?.localizedSubtitlePlaceholders?.find(
              ({ language }) => language === spaceUpdated.defaultLanguage
            )?.text || ''
          }`,
        },
      },
      {
        type: 'header',
        text: {
          type: 'plain_text',
          text: 'Permission Configuration',
        },
      },
      {
        type: 'divider',
      },
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `*Board access type*\n${
            spaceUpdated.boardConfig?.isEnabled
              ? capitalizeFirstLetter(spaceUpdated.boardConfig?.accessType)
              : 'Disabled'
          }`,
        },
      },
    ];

    await postBlocksInThread({
      client,
      channel: channel,
      messageText: `@${spaceUpdated.handle} has been edited by <@${userId}>`,
      messageBlocks: [
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `*<${getSpaceUrl(spaceUpdated.handle)}|@${
              spaceUpdated.handle
            }>* has been edited by <@${userId}>`,
          },
        },
      ],
      threadBlocks: blocks,
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
