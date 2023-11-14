import {
  AllMiddlewareArgs,
  BlockButtonAction,
  KnownBlock,
  SlackActionMiddlewareArgs,
  SlackViewMiddlewareArgs,
} from '@slack/bolt';
import { SpaceProfileCategoryItem } from '../../../apis/space/types';
import { app } from '../../../app';
import { getValuesFromState } from '../../../utils/slack';

export type SpaceCategoryEditActionValue = SpaceProfileCategoryItem;

export class SpaceCategoryEditService {
  private readonly callbackId = 'space-category-edit';
  private readonly blockIds = {
    inputCategoryId: 'input-category-id',
    inputCategoryColor: 'input-category-color',
    inputCategoryNameKo: 'input-category-name-ko',
    inputCategoryNameEn: 'input-category-name-en',
    inputCategoryNameVi: 'input-category-name-vi',
    inputCategoryNameZh: 'input-category-name-zh',
  };

  constructor() {
    app.view(this.callbackId, this.onCategoryEditSubmit.bind(this));
  }

  async onCategoryEdit({
    action,
    logger,
    client,
    body,
    ack,
  }: SlackActionMiddlewareArgs<BlockButtonAction> &
    AllMiddlewareArgs): Promise<void> {
    logger.info(`${new Date()} - space category edit`);

    const categoryItem = JSON.parse(
      action.value
    ) as SpaceCategoryEditActionValue;
    logger.info(
      `${new Date()} - category item: ${JSON.stringify(categoryItem)}`
    );

    await ack();

    await client.views.push({
      trigger_id: body.trigger_id,
      view: {
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
      },
    });
  }

  private async onCategoryEditSubmit({
    logger,
    view,
    ack,
  }: SlackViewMiddlewareArgs & AllMiddlewareArgs) {
    logger.info(`${new Date()} - ${view.callback_id} modal submitted`);

    let values = getValuesFromState({
      state: view.state,
      blockIds: this.blockIds,
    });
    values = {
      inputCategoryId: values.inputCategoryId?.trim(),
      inputCategoryColor: values.inputCategoryColor?.trim(),
      inputCategoryNameKo: values.inputCategoryNameKo?.trim(),
      inputCategoryNameEn: values.inputCategoryNameEn?.trim(),
      inputCategoryNameVi: values.inputCategoryNameVi?.trim(),
      inputCategoryNameZh: values.inputCategoryNameZh?.trim(),
    };
    logger.info(`${new Date()} - values: ${JSON.stringify(values)}`);

    if (
      values.inputCategoryColor &&
      !values.inputCategoryColor.match(/^#[0-9a-f]{6}$/i)
    ) {
      logger.info(`${new Date()} - invalid color`);
      await ack({
        response_action: 'errors',
        errors: {
          [this.blockIds.inputCategoryColor]:
            'Color must be a hex code. e.g. #FF0000',
        },
      });
      return;
    }

    if (
      !values.inputCategoryNameKo &&
      !values.inputCategoryNameEn &&
      !values.inputCategoryNameVi &&
      !values.inputCategoryNameZh
    ) {
      logger.info(`${new Date()} - invalid category names`);
      await ack({
        response_action: 'errors',
        errors: {
          [this.blockIds.inputCategoryNameKo]:
            'At least one category name is required.',
          [this.blockIds.inputCategoryNameEn]:
            'At least one category name is required.',
          [this.blockIds.inputCategoryNameVi]:
            'At least one category name is required.',
          [this.blockIds.inputCategoryNameZh]:
            'At least one category name is required.',
        },
      });
      return;
    }

    await ack();
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
