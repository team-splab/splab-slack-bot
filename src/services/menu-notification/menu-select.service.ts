import {
  Block,
  BlockAction,
  ButtonAction,
  KnownBlock,
  MrkdwnElement,
  SectionBlock,
  SlackActionMiddlewareArgs,
} from '@slack/bolt';
import { menuNotificationService } from '../..';

export class MenuSelectService {
  static menuSelectedUserIds: { [key: string]: string[] } = {};

  public async onMenuSelectAction({
    ack,
    body,
  }: SlackActionMiddlewareArgs<BlockAction<ButtonAction>>) {
    console.log(`${new Date()} - Menu select action`);
    await ack();

    const blocks = body.message?.blocks as (Block | KnownBlock)[];
    const userId = body.user.id;
    const selectedMenuId = body.actions[0].value;

    MenuSelectService.menuSelectedUserIds = {};
    blocks
      .filter((block) => block.type === 'section')
      .map((block) => (block as SectionBlock).text as MrkdwnElement)
      .forEach(async (menuElement) => {
        const firstLine = menuElement.text.split('\n')[0];
        const menuName = (firstLine.match(/\*(.*)\*/g) || []).pop() || '';
        const currentMenuId = menuName.match(/[A-Z]/g)?.join('') || '';

        let userIds: string[] = firstLine.match(/<@([^>]*)>/g) || [];
        if (
          currentMenuId === selectedMenuId &&
          !userIds.includes(`<@${userId}>`)
        ) {
          userIds.push(`<@${userId}>`);
        } else {
          userIds = userIds.filter((id) => !id.includes(`<@${userId}>`));
        }

        MenuSelectService.menuSelectedUserIds[currentMenuId] = userIds;
      });

    await menuNotificationService.sendMenuNotification();
  }
}
