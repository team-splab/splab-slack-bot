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
import { SpaceCategoryEditView } from './space-category-edit.view';

export type SpaceCategoryEditActionValue = SpaceProfileCategoryItem;

export class SpaceCategoryEditService {
  private readonly spaceCategoryEditView = new SpaceCategoryEditView();

  constructor() {
    app.view(
      this.spaceCategoryEditView.callbackId,
      this.onCategoryEditSubmit.bind(this)
    );
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
      view: this.spaceCategoryEditView.build({ categoryItem }),
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
      blockIds: this.spaceCategoryEditView.blockIds,
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
          [this.spaceCategoryEditView.blockIds.inputCategoryColor]:
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
          [this.spaceCategoryEditView.blockIds.inputCategoryNameKo]:
            'At least one category name is required.',
          [this.spaceCategoryEditView.blockIds.inputCategoryNameEn]:
            'At least one category name is required.',
          [this.spaceCategoryEditView.blockIds.inputCategoryNameVi]:
            'At least one category name is required.',
          [this.spaceCategoryEditView.blockIds.inputCategoryNameZh]:
            'At least one category name is required.',
        },
      });
      return;
    }

    await ack();
  }
}
