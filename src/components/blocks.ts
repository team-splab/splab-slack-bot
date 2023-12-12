import {
  ActionsBlock,
  Button,
  Confirm,
  ContextBlock,
  DividerBlock,
  HeaderBlock,
  InputBlock,
  PlainTextOption,
  SectionBlock,
} from '@slack/bolt';
import { Element } from './elements';

export const Block = {
  Header: (text: string): HeaderBlock => ({
    type: 'header',
    text: Element.PlainText(text),
  }),
  Text: (text: string): SectionBlock => ({
    type: 'section',
    text: Element.MarkdownText(text),
  }),
  Divider: (): DividerBlock => ({
    type: 'divider',
  }),
  TextInput: ({
    label,
    hint,
    placeholder,
    initialValue,
    blockId,
    optional = false,
    focusOnLoad = false,
    multiline = false,
  }: {
    label: string;
    hint?: string;
    placeholder?: string;
    initialValue?: string;
    blockId?: string;
    optional?: boolean;
    focusOnLoad?: boolean;
    multiline?: boolean;
  }): InputBlock => ({
    type: 'input',
    optional,
    block_id: blockId,
    label: Element.PlainText(label),
    hint: Element.PlainText(hint),
    element: {
      type: 'plain_text_input',
      initial_value: initialValue,
      focus_on_load: focusOnLoad,
      multiline: multiline,
      placeholder: Element.PlainText(placeholder),
    },
  }),
  NumberInput: ({
    label,
    initialValue,
    minValue,
    maxValue,
    blockId,
    optional = false,
    isDecimalAllowed = false,
  }: {
    label: string;
    initialValue?: string;
    minValue?: string;
    maxValue?: string;
    blockId?: string;
    optional?: boolean;
    isDecimalAllowed?: boolean;
  }): InputBlock => ({
    type: 'input',
    optional,
    block_id: blockId,
    label: Element.PlainText(label),
    element: {
      type: 'number_input',
      min_value: minValue,
      max_value: maxValue,
      is_decimal_allowed: isDecimalAllowed,
      initial_value: initialValue,
    },
  }),
  SectionWithSelect: ({
    text,
    options,
    initialOptionValue,
    blockId,
    actionId,
  }: {
    text: string;
    options: PlainTextOption[];
    initialOptionValue?: string;
    blockId?: string;
    actionId?: string;
  }): SectionBlock => ({
    type: 'section',
    block_id: blockId,
    text: Element.MarkdownText(text),
    accessory: {
      type: 'static_select',
      action_id: actionId,
      initial_option: initialOptionValue
        ? options.find((o) => o.value === initialOptionValue)
        : undefined,
      options: options,
    },
  }),
  MultiSelect: ({
    label,
    placeholder,
    options,
    initialOptionValues,
    blockId,
    optional = false,
  }: {
    label: string;
    placeholder?: string;
    options: PlainTextOption[];
    initialOptionValues?: string[];
    blockId?: string;
    optional?: boolean;
  }): InputBlock => ({
    type: 'input',
    optional: optional,
    block_id: blockId,
    label: Element.PlainText(label),
    element: {
      type: 'multi_static_select',
      placeholder: Element.PlainText(placeholder),
      initial_options: initialOptionValues
        ? options.filter((o) =>
            initialOptionValues.includes(o.value || o.text.text)
          )
        : undefined,
      options: options,
    },
  }),
  Buttons: (
    buttons: {
      text: string;
      style?: Button['style'];
      confirm?: {
        title?: string;
        text: string;
        confirm?: string;
        deny?: string;
        style?: Confirm['style'];
      };
      actionId?: string;
    }[]
  ): ActionsBlock => ({
    type: 'actions',
    elements: buttons.map(
      (button) =>
        ({
          type: 'button',
          style: button.style,
          action_id: button.actionId,
          confirm: button.confirm
            ? {
                title: Element.PlainText(button.confirm.title),
                text: Element.MarkdownText(button.confirm.text),
                confirm: Element.PlainText(button.confirm.confirm),
                deny: Element.PlainText(button.confirm.deny),
                style: button.confirm.style,
              }
            : undefined,
          text: Element.PlainText(button.text),
        } satisfies Button)
    ),
  }),
  SectionWithOverflow: ({
    text,
    options,
    actionId,
  }: {
    text: string;
    options: {
      text: string;
      value?: string;
    }[];
    actionId?: string;
  }): SectionBlock => ({
    type: 'section',
    text: Element.MarkdownText(text),
    accessory: {
      type: 'overflow',
      action_id: actionId,
      options: options.map((option) => ({
        text: Element.PlainText(option.text),
        value: option.value,
      })),
    },
  }),
  Context: (texts: string[]): ContextBlock => ({
    type: 'context',
    elements: texts.map((text) => Element.MarkdownText(text)),
  }),
};
