import {
  AllMiddlewareArgs,
  BlockButtonAction,
  SlackActionMiddlewareArgs,
  SlackViewMiddlewareArgs,
  ViewOutput,
} from '@slack/bolt';
import { SpaceProfileCategoryItem } from '../../../apis/space/types';
import { app } from '../../../app';
import { getValuesFromState } from '../../../utils/slack';
import {
  SpaceCategoryEditView,
  SpaceCategoryEditViewPrivateMetadata,
} from './space-category-edit.view';
import { SpaceEditView } from './space-edit.view';

export type SpaceCategoryEditActionValue = SpaceProfileCategoryItem;

export class SpaceCategoryEditService {
  private readonly spaceCategoryEditView: SpaceCategoryEditView;
  private readonly spaceEditView: SpaceEditView;
  private readonly isCreateMode: boolean;

  constructor(
    spaceCategoryEditView: SpaceCategoryEditView,
    spaceEditView: SpaceEditView,
    isCreateMode = false
  ) {
    this.spaceCategoryEditView = spaceCategoryEditView;
    this.spaceEditView = spaceEditView;
    this.isCreateMode = isCreateMode;

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

    const categoryItem: SpaceCategoryEditActionValue = JSON.parse(action.value);
    logger.info(
      `${new Date()} - category item: ${JSON.stringify(categoryItem)}`
    );

    const previousView = body.view;
    if (!previousView) {
      logger.info(`${new Date()} - previous view not found`);
      await ack();
      return;
    }
    logger.info(
      `${new Date()} - previousView.private_metadata: ${
        previousView.private_metadata
      }\npreviousView.id: ${previousView.id}`
    );

    await ack();

    await client.views.push({
      trigger_id: body.trigger_id,
      view: this.spaceCategoryEditView.build({
        initialValues: {
          categoryItem,
        },
        privateMetadata: {
          categoryIdToEdit: categoryItem.id,
          spaceEditViewId: previousView.id,
          spaceEditViewPrivateMetadata: JSON.parse(
            previousView.private_metadata
          ),
          spaceEditViewState: previousView.state,
        },
      }),
    });
  }

  private async onCategoryEditSubmit({
    logger,
    view,
    client,
    ack,
  }: SlackViewMiddlewareArgs & AllMiddlewareArgs) {
    logger.info(`${new Date()} - ${view.callback_id} modal submitted`);

    const {
      categoryIdToEdit,
      spaceEditViewId,
      spaceEditViewPrivateMetadata,
      spaceEditViewState,
    }: SpaceCategoryEditViewPrivateMetadata = JSON.parse(view.private_metadata);

    const categoryItem = this.getCategoryItemFromState(view.state);
    logger.info(`${new Date()} - values: ${JSON.stringify(categoryItem)}`);

    if (categoryItem.color && !categoryItem.color.match(/^#[0-9a-f]{6}$/i)) {
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

    if (categoryItem.localizedNames.length === 0) {
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

    const editViewState = getValuesFromState({
      blockIds: this.spaceEditView.blockIds,
      state: spaceEditViewState,
    });

    const categoryItems = spaceEditViewPrivateMetadata.categoryItems;
    if (this.isCreateMode) {
      categoryItems.push(categoryItem);
    } else {
      const categoryItemIndex = categoryItems.findIndex(
        (categoryItem) => categoryItem.id === categoryIdToEdit
      );
      categoryItems[categoryItemIndex] = categoryItem;
    }

    await client.views.update({
      view_id: spaceEditViewId,
      view: this.spaceEditView.build({
        privateMetadata: {
          ...spaceEditViewPrivateMetadata,
          categoryItems,
        },
        initialValues: {
          handle:
            editViewState.inputHandle ||
            spaceEditViewPrivateMetadata.spaceHandle,
          title: editViewState.inputTitle || '',
          description: editViewState.inputDescription,
          categoryItems: spaceEditViewPrivateMetadata.categoryItems,
        },
      }),
    });
  }

  private getCategoryItemFromState(
    state: ViewOutput['state']
  ): SpaceProfileCategoryItem {
    let values = getValuesFromState({
      state: state,
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

    const localizedNames = [];
    if (values.inputCategoryNameKo) {
      localizedNames.push({
        language: 'ko',
        text: values.inputCategoryNameKo,
      });
    }
    if (values.inputCategoryNameEn) {
      localizedNames.push({
        language: 'en',
        text: values.inputCategoryNameEn,
      });
    }
    if (values.inputCategoryNameVi) {
      localizedNames.push({
        language: 'vi',
        text: values.inputCategoryNameVi,
      });
    }
    if (values.inputCategoryNameZh) {
      localizedNames.push({
        language: 'zh',
        text: values.inputCategoryNameZh,
      });
    }
    return {
      id: values.inputCategoryId || '',
      color: values.inputCategoryColor,
      localizedNames: localizedNames,
    };
  }
}
