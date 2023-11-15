import {
  AckFn,
  AllMiddlewareArgs,
  BlockButtonAction,
  BlockOverflowAction,
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
import {
  SpaceCategoryOverflowActionValue,
  SpaceEditView,
  SpaceEditViewPrivateMetadata,
} from './space-edit.view';

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

  async onCategoryEditOrDelete(
    args: SlackActionMiddlewareArgs<BlockOverflowAction> & AllMiddlewareArgs
  ): Promise<void> {
    const { logger, action } = args;
    logger.info(`${new Date()} - space category edit`);

    const actionValue: SpaceCategoryOverflowActionValue = JSON.parse(
      action.selected_option.value
    );

    switch (actionValue.type) {
      case 'edit':
        this.openModal({
          ...args,
          categoryId: actionValue.categoryId,
        });
        break;
      case 'delete':
        this.onCategoryDelete(args);
    }
  }

  async onCategoryCreate(
    args: SlackActionMiddlewareArgs<BlockButtonAction> & AllMiddlewareArgs
  ): Promise<void> {
    const { logger } = args;
    logger.info(`${new Date()} - space category create`);

    this.openModal({
      ...args,
    });
  }

  private async openModal({
    categoryId,
    logger,
    client,
    body,
    ack,
  }: {
    categoryId?: string;
    body: BlockButtonAction | BlockOverflowAction;
    ack: AckFn<void>;
  } & AllMiddlewareArgs) {
    logger.info(`${new Date()} - categoryId: ${categoryId}`);

    const spaceEditView = body.view;
    if (!spaceEditView) {
      logger.info(`${new Date()} - space edit view not found`);
      await ack();
      return;
    }
    logger.info(
      `${new Date()} - spaceEditView.private_metadata: ${
        spaceEditView.private_metadata
      }\nspaceEditView.id: ${spaceEditView.id}`
    );

    await ack();

    const spaceEditViewPrivateMetadata: SpaceEditViewPrivateMetadata =
      JSON.parse(spaceEditView.private_metadata);

    let categoryItem: SpaceProfileCategoryItem = { id: '', localizedNames: [] };
    if (categoryId) {
      categoryItem =
        spaceEditViewPrivateMetadata.categoryItems.find(
          (item) => item.id === categoryId
        ) || categoryItem;
    }

    await client.views.push({
      trigger_id: body.trigger_id,
      view: this.spaceCategoryEditView.build({
        initialValues: {
          categoryItem,
        },
        privateMetadata: {
          categoryIdToEdit: categoryItem.id,
          spaceEditViewId: spaceEditView.id,
          spaceEditViewPrivateMetadata: spaceEditViewPrivateMetadata,
          spaceEditViewState: spaceEditView.state,
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
    logger.info(
      `${new Date()} - categoryItems: ${JSON.stringify(categoryItems)}`
    );

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
          categoryItems: categoryItems,
        },
      }),
    });
  }

  private async onCategoryDelete({
    logger,
    action,
    body,
    client,
    ack,
  }: SlackActionMiddlewareArgs<BlockOverflowAction> & AllMiddlewareArgs) {
    logger.info(`${new Date()} - space category delete`);

    const spaceEditView = body.view;
    if (!spaceEditView) {
      logger.info(`${new Date()} - spaceEditView not found`);
      await ack();
      return;
    }
    logger.info(
      `${new Date()} - spaceEditView.private_metadata: ${
        spaceEditView.private_metadata
      }\nspaceEditView.id: ${spaceEditView.id}`
    );

    await ack();

    const actionValue: SpaceCategoryOverflowActionValue = JSON.parse(
      action.selected_option.value
    );
    logger.info(`${new Date()} - actionValue: ${JSON.stringify(actionValue)}`);

    const spaceEditViewPrivateMetadata: SpaceEditViewPrivateMetadata =
      JSON.parse(spaceEditView.private_metadata);

    const categoryItems = spaceEditViewPrivateMetadata.categoryItems.filter(
      (categoryItem) => categoryItem.id !== actionValue.categoryId
    );
    logger.info(
      `${new Date()} - categoryItems: ${JSON.stringify(categoryItems)}`
    );

    const editViewState = getValuesFromState({
      blockIds: this.spaceEditView.blockIds,
      state: spaceEditView.state,
    });

    await client.views.update({
      view_id: spaceEditView.id,
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
          categoryItems: categoryItems,
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
