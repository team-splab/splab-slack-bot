import { app } from '../../app';
import { DAYS_KOREAN, TEST_CHANNEL_ID } from '../../utils/consts';
import { GreeatMenuRepository } from './greeat-menu.repository';
import { Menu } from './menu';

export class MenuNotificationService {
  public async sendMenuNotification(): Promise<void> {
    const greeatMenuRepository = new GreeatMenuRepository();
    const menus = await greeatMenuRepository.fetchMenus();
    await this.sendMenuNotificationToChannel(TEST_CHANNEL_ID, menus);
  }

  private async sendMenuNotificationToChannel(
    channelId: string,
    menus: Menu[]
  ): Promise<void> {
    await app.client.chat.postMessage({
      channel: channelId,
      blocks: [
        {
          type: 'header',
          text: {
            type: 'plain_text',
            text: `${new Date().getMonth() + 1}/${new Date().getDate()} (${
              DAYS_KOREAN[new Date().getDay()]
            }) 오늘의 메뉴`,
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
            return [
              {
                type: 'divider',
              },
              {
                type: 'section',
                text: {
                  type: 'mrkdwn',
                  text: `*${menu.cornerName}*\n*${menu.name}* (${menu.category})\n${remainingText}\n${menu.kcal}kcal`,
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
      ],
    });
  }
}
