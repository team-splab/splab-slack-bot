import { Block, KnownBlock } from '@slack/bolt';
import { app } from '../../app';
import { ACTIONS, DAYS_KOREAN } from '../../utils/consts';
import { GreeatMenuRepository } from './greeat-menu.repository';
import { Menu } from './menu';
import { getTodayString } from '../../utils/date';
import { MenuSelectService } from './menu-select.service';

export class MenuNotificationService {
  private readonly channelId: string;

  private lastSentTs: string | undefined;
  private lastSentDateString: string | undefined;

  constructor(channelId: string) {
    this.channelId = channelId;
  }

  public async sendMenuNotification(): Promise<void> {
    const greeatMenuRepository = new GreeatMenuRepository();
    const menus = await greeatMenuRepository.fetchMenus();
    await this.postOrUpdateMenuNotificationToChannel(menus);
  }

  private async postOrUpdateMenuNotificationToChannel(
    menus: Menu[]
  ): Promise<void> {
    const today = new Date();
    const title = `${today.getMonth() + 1}/${today.getDate()} (${
      DAYS_KOREAN[today.getDay()]
    }) 오늘의 메뉴`;

    const todayString = getTodayString();
    if (this.lastSentTs && this.lastSentDateString === todayString) {
      const blocks = this.buildBlocks(
        title,
        menus,
        MenuSelectService.menuSelectedUserIds
      );
      const result = await app.client.chat.update({
        channel: this.channelId,
        ts: this.lastSentTs,
        text: title,
        blocks: blocks,
      });
      this.lastSentTs = result.ts;
      console.log(`${new Date()} - Menu notification updated`);
    } else {
      MenuSelectService.menuSelectedUserIds = {};
      const blocks = this.buildBlocks(title, menus, {});
      const result = await app.client.chat.postMessage({
        channel: this.channelId,
        text: title,
        blocks: blocks,
      });
      this.lastSentTs = result.ts;
      console.log(`${new Date()} - Menu notification posted`);
    }
    this.lastSentDateString = todayString;
  }

  private buildBlocks(
    title: string,
    menus: Menu[],
    menuSelectedUserIds: typeof MenuSelectService.menuSelectedUserIds
  ): (KnownBlock | Block)[] {
    return [
      {
        type: 'header',
        text: {
          type: 'plain_text',
          text: title,
          emoji: true,
        },
      },

      ...menus
        .map((menu) => {
          const selectedUserIds = menuSelectedUserIds[menu.cornerId] || [];

          const { maxQuantity, currentQuantity } = menu;
          const imageUrl = encodeURI(menu.imageUrl);
          let remainingText: string;
          if (maxQuantity >= currentQuantity) {
            remainingText = `*${maxQuantity - currentQuantity}* 인분 남음`;
          } else {
            remainingText = `*${
              currentQuantity - maxQuantity
            }* 인분 초과 판매 중`;
          }
          const remainingPercentText = `${Math.round(
            ((maxQuantity - currentQuantity) / menu.maxQuantity) * 100
          )}%`;
          const blocks: (KnownBlock | Block)[] = [
            {
              type: 'divider',
            },
            {
              type: 'section',
              text: {
                type: 'mrkdwn',
                text: `*${menu.cornerName}*  ${selectedUserIds.join(' ')}\n*${
                  menu.name
                }* (${
                  menu.category
                })\n${remainingText} (${remainingPercentText})\n${
                  menu.kcal
                }kcal`,
              },
              accessory: {
                type: 'button',
                text: {
                  type: 'plain_text',
                  text: '선택',
                },
                value: menu.cornerId,
                action_id: ACTIONS.MENU_SELECT,
              },
            },
          ];
          if (menu.imageUrl) {
            blocks.push({
              type: 'image',
              title: {
                type: 'plain_text',
                text: menu.name,
                emoji: true,
              },
              image_url: imageUrl,
              alt_text: menu.name,
            });
          }
          return blocks;
        })
        .flat(),
      {
        type: 'divider',
      },
      {
        type: 'context',
        elements: [
          {
            type: 'mrkdwn',
            text: `마지막 업데이트: ${new Date().toLocaleString()}`,
          },
        ],
      },
    ] as (KnownBlock | Block)[];
  }
}
