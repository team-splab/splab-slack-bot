import { MrkdwnElement, PlainTextElement } from '@slack/bolt';

export const Element = {
  PlainText: <T extends string | undefined>(
    text: T
  ): T extends string ? PlainTextElement : PlainTextElement | undefined => {
    return text
      ? ({ type: 'plain_text', text } as PlainTextElement)
      : (undefined as any);
  },
  MarkdownText: <T extends string | undefined>(
    text: T
  ): T extends string ? MrkdwnElement : MrkdwnElement | undefined => {
    return text
      ? ({ type: 'mrkdwn', text } as MrkdwnElement)
      : (undefined as any);
  },
};
