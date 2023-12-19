import { KnownBlock, PlainTextOption, View, ViewOutput } from '@slack/bolt';
import {
  SpaceBoardAccessTypes,
  SpaceMessagingOptions,
  SpaceProfileCategoryItem,
  SpaceSupportedSocial,
  SpaceSupportedSocials,
} from '../../../apis/space/types';
import { ViewBuilder } from '../../../interfaces/view-builder';
import { getSpaceUrl } from '../../../utils/space';
import { getValuesFromState } from '../../../utils/slack';
import { SpacePermissions } from '../../../utils/space-permission';
import { SpaceImageShapes } from '../../../utils/space-image-shape';
import { Block } from '../../../components/blocks';
import { Element } from '../../../components/elements';

export interface SpaceCategoryOverflowActionValue {
  type: 'edit' | 'delete';
  categoryId: string;
}

export interface SpaceEditViewPrivateMetadata {
  spaceId: string;
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
    inputImageShape: 'input-image-shape',
    inputDefaultLanguage: 'input-default-language',
    inputCategorySelectPlaceholder: 'input-category-select-placeholder',
    inputMaxCategorySelections: 'input-max-category-selections',
    inputSocialLinks: 'input-social-links',
    inputSubtitlePlaceholder: 'input-subtitle-placeholder',
    inputSpacePermission: 'input-space-permission',
    inputMessagingPermission: 'input-messaging-permission',
    inputBoardAccessType: 'input-board-access-type',
    inputEntryCode: 'input-entry-code',
  };
  readonly actionIds = {
    categoryActionsOverflow: 'category-actions-overflow',
    addCategory: 'add-category',
    fillCategoryColors: 'fill-category-colors',
    selectIgnore: 'select-ignore',
  };

  buildWithState({
    state,
    spaceId,
    categoryItems,
  }: {
    state: ViewOutput['state'];
    spaceId: string;
    categoryItems?: SpaceProfileCategoryItem[];
  }): View {
    const values = getValuesFromState({
      blockIds: this.blockIds,
      state: state,
    });
    return this.build({
      initialValues: {
        spaceId,
        handle: values.inputHandle || '',
        title: values.inputTitle || '',
        description: values.inputDescription,
        contacts: values.inputContacts,
        imageShape: values.inputImageShape || '',
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
        entryCode: values.inputEntryCode,
      },
    });
  }

  build({
    initialValues,
  }: {
    initialValues: {
      spaceId: string;
      handle: string;
      title: string;
      description?: string;
      contacts?: string;
      imageShape: string;
      defaultLanguage: string;
      categorySelectPlaceholder?: string;
      maxCategorySelections?: number;
      categoryItems: SpaceProfileCategoryItem[];
      socialLinks?: string[];
      subtitlePlaceholder?: string;
      spacePermission?: string;
      messagingPermission?: string;
      boardAccessType?: string;
      entryCode?: string;
    };
  }): View {
    const defaultLanguageOptions: PlainTextOption[] = [
      {
        value: 'ko',
        text: Element.PlainText('Korean'),
      },
      {
        value: 'en',
        text: Element.PlainText('English'),
      },
      {
        value: 'vi',
        text: Element.PlainText('Vietnamese'),
      },
      {
        value: 'zh',
        text: Element.PlainText('Taiwanese'),
      },
    ];

    const imageShapeOptions: PlainTextOption[] = Object.values(
      SpaceImageShapes
    ).map((shape) => {
      return {
        value: shape.value,
        text: Element.PlainText(shape.label),
      };
    });

    const socialOptions: PlainTextOption[] = Object.values(
      SpaceSupportedSocials
    ).map((social) => {
      return {
        text: Element.PlainText(social.label),
        value: social.id,
      };
    });
    let socialInitialValues: string[] | undefined =
      initialValues.socialLinks?.reduce((acc, socialLink) => {
        const social =
          SpaceSupportedSocials[socialLink as SpaceSupportedSocial];
        if (social) {
          acc.push(social.id);
        }
        return acc;
      }, [] as string[]);
    if (socialInitialValues?.length === 0) {
      socialInitialValues = undefined;
    }

    const spacePermissionOptions: PlainTextOption[] = Object.values(
      SpacePermissions
    ).map((permission) => ({
      value: permission.value,
      text: Element.PlainText(permission.label),
    }));

    const boardPermissionOptions: PlainTextOption[] = [
      {
        value: 'DISABLED',
        text: Element.PlainText('Disabled'),
      },
      {
        value: SpaceBoardAccessTypes.PUBLIC,
        text: Element.PlainText('Public'),
      },
      {
        value: SpaceBoardAccessTypes.PREVIEW,
        text: Element.PlainText('Preview'),
      },
      {
        value: SpaceBoardAccessTypes.PRIVATE,
        text: Element.PlainText('Private'),
      },
    ];

    return {
      type: 'modal',
      callback_id: this.callbackId,
      notify_on_close: true,
      title: Element.PlainText('Edit Space'),
      submit: Element.PlainText('Edit'),
      close: Element.PlainText('Cancel'),
      blocks: [
        Block.Context([
          `URL: <${getSpaceUrl(initialValues.handle)}|${getSpaceUrl(
            initialValues.handle
          )}>`,
          `ID: ${initialValues.spaceId}`,
        ]),
        Block.Header('Basic Information'),
        Block.Divider(),
        Block.TextInput({
          label: 'Handle',
          hint: 'Space handle without @',
          placeholder: 'Space handle without @',
          initialValue: initialValues.handle,
          blockId: this.blockIds.inputHandle,
          focusOnLoad: true,
        }),
        Block.TextInput({
          label: 'Title',
          placeholder: 'Space title',
          initialValue: initialValues.title,
          blockId: this.blockIds.inputTitle,
        }),
        Block.TextInput({
          label: 'Description',
          placeholder: 'Space description',
          initialValue: initialValues.description,
          blockId: this.blockIds.inputDescription,
          optional: true,
          multiline: true,
        }),
        Block.TextInput({
          label: 'Contact points',
          hint: 'Enter emails, phone numbers, or URLs separated by commas, or new lines. The order will be preserved.',
          placeholder:
            'ex) email@splab.dev, 010-1234-5678, https://umoh.io, https://join.umoh.io/kr',
          initialValue: initialValues.contacts,
          blockId: this.blockIds.inputContacts,
          optional: true,
          multiline: true,
        }),
        Block.SectionWithSelect({
          text: '*Image Shape*',
          options: imageShapeOptions,
          initialOptionValue: initialValues.imageShape,
          blockId: this.blockIds.inputImageShape,
          actionId: this.actionIds.selectIgnore,
        }),
        Block.SectionWithSelect({
          text: '*Default language*',
          options: defaultLanguageOptions,
          initialOptionValue: initialValues.defaultLanguage,
          blockId: this.blockIds.inputDefaultLanguage,
          actionId: this.actionIds.selectIgnore,
        }),
        Block.Header('Category Configuration'),
        Block.Divider(),
        Block.TextInput({
          label: 'Category select placeholder',
          placeholder: 'ex) Select a category',
          initialValue: initialValues.categorySelectPlaceholder,
          blockId: this.blockIds.inputCategorySelectPlaceholder,
          optional: true,
        }),
        Block.NumberInput({
          label: 'Maximum number of selections',
          initialValue: initialValues.maxCategorySelections?.toString() || '1',
          minValue: '1',
          blockId: this.blockIds.inputMaxCategorySelections,
        }),
        Block.Divider(),
        Block.Text('*Categories*'),
        ...this.buildCategoryBlocks(initialValues.categoryItems),
        Block.Buttons([
          {
            text: 'Add Category',
            style: 'primary',
            actionId: this.actionIds.addCategory,
          },
          {
            text: 'Fill colors randomly',
            confirm: {
              title: 'This will reset all category colors.',
              text: 'Are you sure?',
              confirm: 'Yes',
              deny: 'No',
            },
            actionId: this.actionIds.fillCategoryColors,
          },
        ]),
        Block.Header('Profile Card Configuration'),
        Block.Divider(),
        Block.MultiSelect({
          label: 'Social links',
          placeholder: 'Select social links to show on profile card',
          options: socialOptions,
          initialOptionValues: socialInitialValues,
          blockId: this.blockIds.inputSocialLinks,
          optional: true,
        }),
        Block.TextInput({
          label: 'Subtitle placeholder',
          placeholder: 'ex) CEO, Splab',
          initialValue: initialValues.subtitlePlaceholder,
          blockId: this.blockIds.inputSubtitlePlaceholder,
          optional: true,
        }),
        Block.Header('Permission Configuration'),
        Block.Divider(),
        Block.SectionWithSelect({
          text: '*Space*',
          options: spacePermissionOptions,
          initialOptionValue: initialValues.spacePermission,
          blockId: this.blockIds.inputSpacePermission,
          actionId: this.actionIds.selectIgnore,
        }),
        Block.SectionWithSelect({
          text: '*Messaging*',
          options: spaceMessagingPermissionOptions,
          initialOptionValue: initialValues.messagingPermission,
          blockId: this.blockIds.inputMessagingPermission,
          actionId: this.actionIds.selectIgnore,
        }),
        Block.SectionWithSelect({
          text: '*Community forum*',
          options: boardPermissionOptions,
          initialOptionValue: initialValues.boardAccessType,
          blockId: this.blockIds.inputBoardAccessType,
          actionId: this.actionIds.selectIgnore,
        }),
        Block.TextInput({
          label: 'Entry code',
          placeholder: 'ex) 231219, splab',
          initialValue: initialValues.entryCode,
          blockId: this.blockIds.inputEntryCode,
          optional: true,
        }),
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
        Block.SectionWithOverflow({
          text: categoryItem.localizedNames.map(({ text }) => text).join(' | '),
          options: [
            {
              text: ':large_blue_circle: Edit',
              value: JSON.stringify(editActionValue),
            },
            {
              text: ':red_circle: Delete',
              value: JSON.stringify(deleteActionValue),
            },
          ],
          actionId: this.actionIds.categoryActionsOverflow,
        }),
        Block.Context([categoryItem.id, categoryItem.color || ' ']),
        Block.Divider()
      );
    });

    return blocks;
  }
}
