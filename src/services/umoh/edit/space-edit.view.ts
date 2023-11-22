import { KnownBlock, PlainTextOption, View, ViewOutput } from '@slack/bolt';
import {
  SpaceBoardAccessTypes,
  SpaceMessagingOptions,
  SpaceProfileCategoryItem,
  SpaceSupportedSocial,
  SpaceSupportedSocials,
} from '../../../apis/space/types';
import { ViewBuilder } from '../../../interfaces/view-builder';
import { getSpaceUrl, SpacePermissions } from '../../../utils/space';
import { getValuesFromState } from '../../../utils/slack';

export interface SpaceCategoryOverflowActionValue {
  type: 'edit' | 'delete';
  categoryId: string;
}

export interface SpaceEditViewPrivateMetadata {
  spaceHandle: string;
  channel: string;
  userId: string;
  categoryItems: SpaceProfileCategoryItem[];
}

export const spaceMessagingPermissionOptions: PlainTextOption[] = [
  {
    value: SpaceMessagingOptions.DISABLED,
    text: {
      type: 'plain_text',
      text: 'Disabled',
    },
  },
  {
    value: SpaceMessagingOptions.ENABLED_WITH_AUTH,
    text: {
      type: 'plain_text',
      text: 'Enabled',
    },
  },
  {
    value: SpaceMessagingOptions.ENABLED_WITHOUT_AUTH,
    text: {
      type: 'plain_text',
      text: 'Enabled (Login not required)',
    },
  },
];

export class SpaceEditView implements ViewBuilder {
  readonly callbackId = 'space-edit';

  readonly blockIds = {
    inputHandle: 'input-handle',
    inputTitle: 'input-title',
    inputDescription: 'input-description',
    inputContacts: 'input-contacts',
    inputDefaultLanguage: 'input-default-language',
    inputCategorySelectPlaceholder: 'input-category-select-placeholder',
    inputMaxCategorySelections: 'input-max-category-selections',
    inputSocialLinks: 'input-social-links',
    inputSubtitlePlaceholder: 'input-subtitle-placeholder',
    inputSpacePermission: 'input-space-permission',
    inputMessagingPermission: 'input-messaging-permission',
    inputBoardAccessType: 'input-board-access-type',
  };
  readonly actionIds = {
    categoryActionsOverflow: 'category-actions-overflow',
    addCategory: 'add-category',
    selectIgnore: 'select-ignore',
  };

  buildWithState({
    state,
    categoryItems,
  }: {
    state: ViewOutput['state'];
    categoryItems?: SpaceProfileCategoryItem[];
  }): View {
    const values = getValuesFromState({
      blockIds: this.blockIds,
      state: state,
    });
    return this.build({
      initialValues: {
        handle: values.inputHandle || '',
        title: values.inputTitle || '',
        description: values.inputDescription,
        contacts: values.inputContacts,
        defaultLanguage: values.inputDefaultLanguage || '',
        categorySelectPlaceholder: values.inputCategorySelectPlaceholder,
        maxCategorySelections: values.inputMaxCategorySelections
          ? parseInt(values.inputMaxCategorySelections)
          : undefined,
        categoryItems: categoryItems || [],
        socialLinks: values.inputSocialLinks?.split(','),
        subtitlePlaceholder: values.inputSubtitlePlaceholder,
        messagingPermission: values.inputMessagingPermission,
        boardAccessType: values.inputBoardAccessType,
      },
    });
  }

  build({
    initialValues,
  }: {
    initialValues: {
      handle: string;
      title: string;
      description?: string;
      contacts?: string;
      defaultLanguage: string;
      categorySelectPlaceholder?: string;
      maxCategorySelections?: number;
      categoryItems: SpaceProfileCategoryItem[];
      socialLinks?: string[];
      subtitlePlaceholder?: string;
      spacePermission?: string;
      messagingPermission?: string;
      boardAccessType?: string;
    };
  }): View {
    const defaultLanguageOptions: PlainTextOption[] = [
      {
        value: 'ko',
        text: {
          type: 'plain_text',
          text: 'Korean',
        },
      },
      {
        value: 'en',
        text: {
          type: 'plain_text',
          text: 'English',
        },
      },
      {
        value: 'vi',
        text: {
          type: 'plain_text',
          text: 'Vietnamese',
        },
      },
      {
        value: 'zh',
        text: {
          type: 'plain_text',
          text: 'Taiwanese',
        },
      },
    ];

    const socialOptions: PlainTextOption[] = Object.values(
      SpaceSupportedSocials
    ).map((social) => {
      return {
        text: {
          type: 'plain_text',
          text: social.label,
        },
        value: social.id,
      };
    });
    let socialInitialOptions: PlainTextOption[] | undefined =
      initialValues.socialLinks?.reduce((acc, socialLink) => {
        const social =
          SpaceSupportedSocials[socialLink as SpaceSupportedSocial];
        if (social) {
          acc.push({
            text: {
              type: 'plain_text',
              text: social.label,
            },
            value: social.id,
          });
        }
        return acc;
      }, [] as PlainTextOption[]);
    if (socialInitialOptions?.length === 0) {
      socialInitialOptions = undefined;
    }

    const spacePermissionOptions: PlainTextOption[] = Object.values(
      SpacePermissions
    ).map((permission) => ({
      value: permission.value,
      text: {
        type: 'plain_text',
        text: permission.label,
      },
    }));

    const boardPermissionOptions: PlainTextOption[] = [
      {
        value: 'DISABLED',
        text: {
          type: 'plain_text',
          text: 'Disabled',
        },
      },
      {
        value: SpaceBoardAccessTypes.PUBLIC,
        text: {
          type: 'plain_text',
          text: 'Public',
        },
      },
      {
        value: SpaceBoardAccessTypes.PREVIEW,
        text: {
          type: 'plain_text',
          text: 'Preview',
        },
      },
      {
        value: SpaceBoardAccessTypes.PRIVATE,
        text: {
          type: 'plain_text',
          text: 'Private',
        },
      },
    ];

    return {
      type: 'modal',
      callback_id: this.callbackId,
      notify_on_close: true,
      title: {
        type: 'plain_text',
        text: 'Edit Space',
      },
      submit: {
        type: 'plain_text',
        text: 'Edit',
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
            text: `Space: <${getSpaceUrl(initialValues.handle)}|${getSpaceUrl(
              initialValues.handle
            )}>`,
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
          type: 'input',
          optional: false,
          block_id: this.blockIds.inputHandle,
          label: {
            type: 'plain_text',
            text: 'Handle',
          },
          hint: {
            type: 'plain_text',
            text: 'Space handle without @',
          },
          element: {
            type: 'plain_text_input',
            initial_value: initialValues.handle,
            focus_on_load: true,
            placeholder: {
              type: 'plain_text',
              text: 'Space handle without @',
            },
          },
        },
        {
          type: 'input',
          optional: false,
          block_id: this.blockIds.inputTitle,
          label: {
            type: 'plain_text',
            text: 'Title',
          },
          element: {
            type: 'plain_text_input',
            initial_value: initialValues.title,
            placeholder: {
              type: 'plain_text',
              text: 'Space title',
            },
          },
        },
        {
          type: 'input',
          optional: true,
          block_id: this.blockIds.inputDescription,
          label: {
            type: 'plain_text',
            text: 'Description',
          },
          element: {
            type: 'plain_text_input',
            initial_value: initialValues.description,
            multiline: true,
            placeholder: {
              type: 'plain_text',
              text: 'Space description',
            },
          },
        },
        {
          type: 'input',
          optional: true,
          block_id: this.blockIds.inputContacts,
          label: {
            type: 'plain_text',
            text: 'Contact points',
          },
          hint: {
            type: 'plain_text',
            text: 'Enter emails, phone numbers, or URLs separated by commas, or new lines. The order will be preserved.',
          },
          element: {
            type: 'plain_text_input',
            initial_value: initialValues.contacts,
            multiline: true,
            placeholder: {
              type: 'plain_text',
              text: 'ex) email@splab.dev, 010-1234-5678, https://umoh.io, https://join.umoh.io/kr',
            },
          },
        },
        {
          type: 'section',
          block_id: this.blockIds.inputDefaultLanguage,
          text: {
            type: 'mrkdwn',
            text: '*Default language*',
          },
          accessory: {
            type: 'static_select',
            action_id: this.actionIds.selectIgnore,
            initial_option: defaultLanguageOptions.find(
              (option) => option.value === initialValues.defaultLanguage
            ),
            options: defaultLanguageOptions,
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
          type: 'input',
          optional: true,
          block_id: this.blockIds.inputCategorySelectPlaceholder,
          label: {
            type: 'plain_text',
            text: 'Category select placeholder',
          },
          element: {
            type: 'plain_text_input',
            initial_value: initialValues.categorySelectPlaceholder,
            placeholder: {
              type: 'plain_text',
              text: 'ex) Select a category',
            },
          },
        },
        {
          type: 'input',
          optional: false,
          block_id: this.blockIds.inputMaxCategorySelections,
          element: {
            type: 'number_input',
            min_value: '1',
            is_decimal_allowed: false,
            initial_value:
              initialValues.maxCategorySelections?.toString() || '1',
          },
          label: {
            type: 'plain_text',
            text: 'Maximum number of selections',
          },
        },
        { type: 'divider' },
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: '*Categories*',
          },
        },
        ...this.buildCategoryBlocks(initialValues.categoryItems),
        {
          type: 'actions',
          elements: [
            {
              type: 'button',
              style: 'primary',
              action_id: this.actionIds.addCategory,
              text: {
                type: 'plain_text',
                text: 'Add Category',
              },
            },
          ],
        },
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
          type: 'input',
          optional: true,
          block_id: this.blockIds.inputSocialLinks,
          label: {
            type: 'plain_text',
            text: 'Social links',
          },
          element: {
            type: 'multi_static_select',
            placeholder: {
              type: 'plain_text',
              text: 'Select social links to show on profile card',
            },
            initial_options: socialInitialOptions,
            options: socialOptions,
          },
        },
        {
          type: 'input',
          optional: true,
          block_id: this.blockIds.inputSubtitlePlaceholder,
          label: {
            type: 'plain_text',
            text: 'Subtitle placeholder',
          },
          element: {
            type: 'plain_text_input',
            initial_value: initialValues.subtitlePlaceholder,
            placeholder: {
              type: 'plain_text',
              text: 'ex) CEO, Splab',
            },
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
          block_id: this.blockIds.inputSpacePermission,
          text: {
            type: 'mrkdwn',
            text: '*Space*',
          },
          accessory: {
            type: 'static_select',
            action_id: this.actionIds.selectIgnore,
            initial_option: spacePermissionOptions.find(
              (option) => option.value === initialValues.spacePermission
            ),
            options: spacePermissionOptions,
          },
        },
        {
          type: 'section',
          block_id: this.blockIds.inputMessagingPermission,
          text: {
            type: 'mrkdwn',
            text: '*Messaging*',
          },
          accessory: {
            type: 'static_select',

            action_id: this.actionIds.selectIgnore,
            initial_option: spaceMessagingPermissionOptions.find(
              (option) => option.value === initialValues.messagingPermission
            ),
            options: spaceMessagingPermissionOptions,
          },
        },
        {
          type: 'section',
          block_id: this.blockIds.inputBoardAccessType,
          text: {
            type: 'mrkdwn',
            text: '*Community forum*',
          },
          accessory: {
            type: 'static_select',
            action_id: this.actionIds.selectIgnore,
            initial_option: boardPermissionOptions.find(
              (option) => option.value === initialValues.boardAccessType
            ),
            options: boardPermissionOptions,
          },
        },
      ],
    };
  }

  private buildCategoryBlocks(
    categoryItems: SpaceProfileCategoryItem[]
  ): KnownBlock[] {
    const blocks: KnownBlock[] = [];

    categoryItems.forEach((categoryItem) => {
      const editActionValue: SpaceCategoryOverflowActionValue = {
        type: 'edit',
        categoryId: categoryItem.id,
      };
      const deleteActionValue: SpaceCategoryOverflowActionValue = {
        type: 'delete',
        categoryId: categoryItem.id,
      };
      blocks.push(
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: categoryItem.localizedNames
              .map(({ text }) => text)
              .join(' | '),
          },
          accessory: {
            type: 'overflow',
            action_id: this.actionIds.categoryActionsOverflow,
            options: [
              {
                value: JSON.stringify(editActionValue),
                text: {
                  type: 'plain_text',
                  text: ':large_blue_circle: Edit',
                },
              },
              {
                value: JSON.stringify(deleteActionValue),
                text: {
                  type: 'plain_text',
                  text: ':red_circle: Delete',
                },
              },
            ],
          },
        },
        {
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
        },
        {
          type: 'divider',
        }
      );
    });

    return blocks;
  }
}
