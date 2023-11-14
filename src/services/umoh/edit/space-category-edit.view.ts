import { KnownBlock, View } from '@slack/bolt';
import { ViewBuilder } from '../../../interfaces/view-builder';
import { SpaceProfileCategoryItem } from '../../../apis/space/types';

export class SpaceCategoryEditView implements ViewBuilder {
  readonly callbackId = 'space-category-edit';
  readonly blockIds = {
    inputCategoryId: 'input-category-id',
    inputCategoryColor: 'input-category-color',
    inputCategoryNameKo: 'input-category-name-ko',
    inputCategoryNameEn: 'input-category-name-en',
    inputCategoryNameVi: 'input-category-name-vi',
    inputCategoryNameZh: 'input-category-name-zh',
  };

  build({ categoryItem }: { categoryItem: SpaceProfileCategoryItem }): View {
    return {
      type: 'modal',
      callback_id: this.callbackId,
      title: {
        type: 'plain_text',
        text: 'Edit category',
      },
      submit: {
        type: 'plain_text',
        text: 'Confirm',
      },
      close: {
        type: 'plain_text',
        text: 'Back',
      },
      blocks: [
        {
          type: 'input',
          optional: false,
          block_id: this.blockIds.inputCategoryId,
          label: {
            type: 'plain_text',
            text: 'Category ID',
          },
          hint: {
            type: 'plain_text',
            text: 'Unique ID for the category.',
          },
          element: {
            type: 'plain_text_input',
            initial_value: categoryItem.id,
            focus_on_load: true,
            placeholder: {
              type: 'plain_text',
              text: 'Unique ID for the category.',
            },
          },
        },
        {
          type: 'input',
          optional: true,
          block_id: this.blockIds.inputCategoryColor,
          label: {
            type: 'plain_text',
            text: 'Category Color',
          },
          hint: {
            type: 'plain_text',
            text: 'Hex color code for the category. e.g. #FF0000',
          },
          element: {
            type: 'plain_text_input',
            initial_value: categoryItem.color,
            placeholder: {
              type: 'plain_text',
              text: 'Hex color code for the category. e.g. #FF0000',
            },
          },
        },
        {
          type: 'divider',
        },
        {
          type: 'header',
          text: {
            type: 'plain_text',
            text: 'Category Names',
          },
        },
        this.buildCategoryNameBlock(
          this.blockIds.inputCategoryNameKo,
          categoryItem.localizedNames.find((name) => name.language === 'ko')
            ?.text || '',
          'Korean'
        ),
        this.buildCategoryNameBlock(
          this.blockIds.inputCategoryNameEn,
          categoryItem.localizedNames.find((name) => name.language === 'en')
            ?.text || '',
          'English'
        ),
        this.buildCategoryNameBlock(
          this.blockIds.inputCategoryNameVi,
          categoryItem.localizedNames.find((name) => name.language === 'vi')
            ?.text || '',
          'Vietnamese'
        ),
        this.buildCategoryNameBlock(
          this.blockIds.inputCategoryNameZh,
          categoryItem.localizedNames.find((name) => name.language === 'zh')
            ?.text || '',
          'Taiwanese'
        ),
      ],
    };
  }

  private buildCategoryNameBlock(
    blockId: string,
    initialName: string,
    language: string
  ): KnownBlock {
    return {
      type: 'input',
      optional: true,
      block_id: blockId,
      label: {
        type: 'plain_text',
        text: language,
      },
      element: {
        type: 'plain_text_input',
        initial_value: initialName,
        placeholder: {
          type: 'plain_text',
          text: ' ',
        },
      },
    };
  }
}
