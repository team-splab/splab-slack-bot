import { KnownBlock, View } from '@slack/bolt';
import { SpaceProfileCategoryItem } from '../../../apis/space/types';
import { ViewBuilder } from '../../../interfaces/view-builder';

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

export class SpaceEditView implements ViewBuilder {
  readonly callbackId = 'space-edit';

  readonly blockIds = {
    inputHandle: 'input-handle',
    inputTitle: 'input-title',
    inputDescription: 'input-description',
  };
  readonly actionIds = {
    categoryActionsOverflow: 'category-actions-overflow',
    addCategory: 'add-category',
  };

  build({
    privateMetadata,
    initialValues,
  }: {
    privateMetadata: SpaceEditViewPrivateMetadata;
    initialValues: {
      handle: string;
      title: string;
      description?: string;
      categoryItems: SpaceProfileCategoryItem[];
    };
  }): View {
    return {
      type: 'modal',
      callback_id: this.callbackId,
      private_metadata: JSON.stringify(privateMetadata),
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
          type: 'header',
          text: {
            type: 'plain_text',

            text: 'Categories',
          },
        },
        {
          type: 'divider',
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
