import { Block, KnownBlock } from '@slack/bolt';
import { app } from '../../app';
import { DAYS_KOREAN, TEST_CHANNEL_ID } from '../../utils/consts';
import { GreeatMenuRepository } from './greeat-menu.repository';
import { Menu } from './menu';
import { getTodayString } from '../../utils/date';

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
    const blocks = this.buildBlocks(title, menus);

    const todayString = getTodayString();
    if (this.lastSentTs && this.lastSentDateString === todayString) {
      const result = await app.client.chat.update({
        channel: this.channelId,
        ts: this.lastSentTs,
        text: title,
        blocks: blocks,
      });
      this.lastSentTs = result.ts;
      console.log(`${new Date()} - Menu notification updated`);
    } else {
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

  private buildBlocks(title: string, menus: Menu[]): (KnownBlock | Block)[] {
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
          const { maxQuantity, currentQuantity } = menu;
          let remainingText: string;
          if (maxQuantity >= currentQuantity) {
            remainingText = `*${
              menu.maxQuantity - menu.currentQuantity
            }* 인분 남음`;
          } else {
            remainingText = `*${
              menu.currentQuantity - menu.maxQuantity
            }* 인분 초과 판매 중`;
          }
          const remainingPercentText = `${Math.round(
            (menu.currentQuantity / menu.maxQuantity) * 100
          )}%`;
          return [
            {
              type: 'divider',
            },
            {
              type: 'section',
              text: {
                type: 'mrkdwn',
                text: `*${menu.cornerName}*\n*${menu.name}* (${menu.category})\n${remainingText} (${remainingPercentText})\n${menu.kcal}kcal`,
              },
              accessory: {
                type: 'image',
                image_url: menu.imageUrl,
                alt_text: menu.name,
              },
            },
            {
              type: 'section',
              text: {
                type: 'mrkdwn',
                text: ' ',
              },
              accessory: {
                type: 'button',
                text: {
                  type: 'plain_text',
                  text: '사진 크게 보기',
                  emoji: true,
                },
                value: 'click_me_123',
                url: menu.imageUrl,
                action_id: 'button-action',
              },
            },
          ];
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
    ];
  }
}
