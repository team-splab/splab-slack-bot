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
  SpaceMessagingOption,
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
import {
  SpaceEditView,
  SpaceEditViewPrivateMetadata,
  spaceMessagingPermissionOptions,
} from './space-edit.view';
import { capitalizeFirstLetter } from '../../../utils/stringUtils';
import {
  deletePrivateMetadata,
  getPrivateMetadata,
  savePrivateMetadata,
} from '../../../utils/redis';
import {
  SpacePermissionType,
  SpacePermissions,
  getSpacePermissionValue,
} from '../../../utils/space-permission';
import {
  SpaceImageShapeType,
  SpaceImageShapes,
  getSpaceImageShapeValue,
} from '../../../utils/space-image-shape';
import { Block } from '../../../components/blocks';

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
    app.view(
      {
        type: 'view_closed',
        callback_id: this.spaceEditView.callbackId,
      },
      async ({ ack, view, logger }) => {
        logger.info(`${new Date()} - ${view.callback_id} modal closed`);
        await ack();
        await deletePrivateMetadata({ viewId: view.id });
      }
    );

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
      this.spaceEditView.actionIds.fillCategoryColors,
      this.categoryCreateService.onFillCategoryColors.bind(
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

    const viewRes = await client.views.open({
      trigger_id: command.trigger_id,
      view: this.spaceEditView.build({
        initialValues: {
          spaceId: space.id,
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
          imageShape: getSpaceImageShapeValue(space).value,
          defaultLanguage: space.defaultLanguage,
          socialLinks: space.profileCreateConfig?.supportedSocials,
          subtitlePlaceholder:
            space.profileCreateConfig?.localizedSubtitlePlaceholders?.find(
              ({ language }) => language === space.defaultLanguage
            )?.text,
          luckyDraw: space.profileBackfaceConfig?.isBackfaceEnabled
            ? 'ENABLED'
            : 'DISABLED',
          spacePermission: getSpacePermissionValue(space).value,
          messagingPermission: space.messagingOption,
          boardAccessType: space.boardConfig?.isEnabled
            ? space.boardConfig?.accessType
            : 'DISABLED',
          entryCode: space.enterCode,
        },
      }),
    });

    const viewId = viewRes.view?.id;
    if (!viewId) {
      logger.error(`${new Date()} - viewId is not provided`);
      return;
    }

    const privateMetadata: SpaceEditViewPrivateMetadata = {
      spaceId: space.id,
      spaceHandle,
      channel: command.channel_id,
      userId: command.user_id,
      categoryItems: space.profileCategoryConfig?.categoryItems || [],
    };
    await savePrivateMetadata({ viewId, privateMetadata });
  }

  async onModalSubmit({
    view,
    ack,
    logger,
    client,
  }: SlackViewMiddlewareArgs & AllMiddlewareArgs) {
    logger.info(`${new Date()} - ${view.callback_id} modal submitted`);

    const {
      spaceHandle,
      channel,
      userId,
      categoryItems,
    }: SpaceEditViewPrivateMetadata = await getPrivateMetadata({
      viewId: view.id,
    });
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

    const stateValues = getValuesFromState({
      state: view.state,
      blockIds: this.spaceEditView.blockIds,
    });

    const contactPoints: SpaceContactPoint[] =
      stateValues.inputContacts
        ?.split(/[\n,]+/)
        .map((value) => getContactPoint(value)) || [];

    const imageShape =
      SpaceImageShapes[stateValues.inputImageShape as SpaceImageShapeType];

    const defaultLanguage =
      stateValues.inputDefaultLanguage || space.defaultLanguage;
    const localizedCategoryLabels = updateLocalizedTexts(
      space.profileCategoryConfig?.localizedCategoryLabels || [],
      {
        language: defaultLanguage,
        text: stateValues.inputCategorySelectPlaceholder || '',
      }
    );
    const localizedSubtitlePlaceholders = updateLocalizedTexts(
      space.profileCreateConfig?.localizedSubtitlePlaceholders || [],
      {
        language: defaultLanguage,
        text: stateValues.inputSubtitlePlaceholder || '',
      }
    );

    const spacePermission =
      SpacePermissions[stateValues.inputSpacePermission as SpacePermissionType];

    const spaceUpdateParams: SpaceUpdateParams = {
      ...space,
      handle: stateValues.inputHandle || space.handle,
      title: stateValues.inputTitle || space.title,
      description: stateValues.inputDescription,
      contactPoints,
      ...imageShape.criteria,
      defaultLanguage,
      profileCreateConfig: {
        ...space.profileCreateConfig,
        defaultLanguage,
        supportedSocials: (stateValues.inputSocialLinks
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
              maxItemNumber: stateValues.inputMaxCategorySelections
                ? parseInt(stateValues.inputMaxCategorySelections)
                : space.profileCategoryConfig?.maxItemNumber || 1,
            },
      profileBackfaceConfig:
        stateValues.inputLuckyDraw === 'ENABLED'
          ? { isBackfaceEnabled: true }
          : undefined,
      profileSubtitleType:
        localizedSubtitlePlaceholders.length === 0 ? 'CATEGORY' : 'SUBTITLE',
      boardConfig: {
        isEnabled: stateValues.inputBoardAccessType !== 'DISABLED',
        accessType:
          stateValues.inputBoardAccessType !== 'DISABLED'
            ? (stateValues.inputBoardAccessType as SpaceBoardAccessType)
            : 'PRIVATE',
      },
      ...spacePermission.criteria,
      enterCode: stateValues.inputEntryCode,
      isNeedMessaging: stateValues.inputMessagingPermission !== 'DISABLED',
      messagingOption:
        stateValues.inputMessagingPermission as SpaceMessagingOption,
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
      Block.Header('Basic Information'),
      Block.Divider(),
      Block.Text(`*Handle*\n@${spaceUpdated.handle}`),
      Block.Text(`*Title*\n${spaceUpdated.title}`),
      Block.Text(`*Description*\n${spaceUpdated.description || ''}`),
      ...spaceUpdated.contactPoints.map(({ type, value }) =>
        Block.Text(`*${capitalizeFirstLetter(type)}*\n${value}`)
      ),
      Block.Text(
        `*Image shape*\n${getSpaceImageShapeValue(spaceUpdated).label}`
      ),
      Block.Text(`*Default language*\n${spaceUpdated.defaultLanguage}`),
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
      Block.Text(
        `*Category select placeholder*\n${
          spaceUpdated.profileCategoryConfig?.localizedCategoryLabels.find(
            ({ language }) => language === spaceUpdated.defaultLanguage
          )?.text || ''
        }`
      ),
      Block.Text(
        `*Maximum number of selections*\n${
          spaceUpdated.profileCategoryConfig?.maxItemNumber || 1
        }`
      ),
      Block.Divider(),
      Block.Text('*Category items*'),
      ...this.buildCategoryBlocks(categoryItems),
      Block.Header('Profile Card Configuration'),
      Block.Divider(),
      Block.Text(
        `*Supported socials*\n${
          spaceUpdated.profileCreateConfig?.supportedSocials
            ?.map((social) => SpaceSupportedSocials[social].label)
            .join(', ') || ''
        }`
      ),
      Block.Text(
        `*Subtitle placeholder*\n${
          spaceUpdated.profileCreateConfig?.localizedSubtitlePlaceholders?.find(
            ({ language }) => language === spaceUpdated.defaultLanguage
          )?.text || ''
        }`
      ),
      Block.Text(
        `*Lucky draw*\n${
          spaceUpdated.profileBackfaceConfig?.isBackfaceEnabled
            ? 'Enabled'
            : 'Disabled'
        }`
      ),
      Block.Header('Permission Configuration'),
      Block.Divider(),
      Block.Text(`*Space*\n${getSpacePermissionValue(spaceUpdated).label}`),
      Block.Text(
        `*Messaging*\n${
          spaceMessagingPermissionOptions.find(
            ({ value }) => value === spaceUpdated.messagingOption
          )?.text.text
        }`
      ),
      Block.Text(
        `*Community forum*\n${
          spaceUpdated.boardConfig?.isEnabled
            ? capitalizeFirstLetter(spaceUpdated.boardConfig?.accessType)
            : 'Disabled'
        }`
      ),
      Block.Text(`*Entry code*\n${spaceUpdated.enterCode || ''}`),
    ];

    const userProfileResponse = await client.users.profile.get({
      user: userId,
    });
    logger.info(
      `${new Date()} - user profile: ${JSON.stringify(userProfileResponse)}`
    );
    const userDisplayName =
      userProfileResponse.profile?.display_name ||
      userProfileResponse.profile?.real_name;

    await postBlocksInThread({
      client,
      channel: channel,
      messageText: `@${spaceUpdated.handle} has been edited by ${userDisplayName}`,
      messageBlocks: [
        Block.Text(
          `*<${getSpaceUrl(spaceUpdated.handle)}|@${
            spaceUpdated.handle
          }>* has been edited by *${userDisplayName}*`
        ),
      ],
      threadBlocks: blocks,
    });

    await deletePrivateMetadata({ viewId: view.id });
  }

  private buildCategoryBlocks(
    categoryItems: SpaceProfileCategoryItem[]
  ): KnownBlock[] {
    const blocks: KnownBlock[] = [];

    categoryItems.forEach((categoryItem) => {
      blocks.push(
        Block.Text(
          categoryItem.localizedNames.map(({ text }) => text).join(' | ')
        )
      );
      blocks.push(Block.Context([categoryItem.id, categoryItem.color || ' ']));
      blocks.push(Block.Divider());
    });

    return blocks;
  }
}
