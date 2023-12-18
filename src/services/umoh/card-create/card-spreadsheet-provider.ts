import { GoogleSpreadsheet } from 'google-spreadsheet';
import { googleJwt } from '../../../google-auth';
import {
  SignUpAndCreateSpaceProfileRequest,
  SpaceProfileLink,
} from '../../../apis/space/profile-create.ts/types';
import { parsePhoneNumber } from 'libphonenumber-js';
import { SpaceSupportedSocial } from '../../../apis/space/types';
import { SpaceSocialUtil } from '../../../utils/space';

export class CardSpreadsheetProvider {
  private readonly spreadsheet: GoogleSpreadsheet;

  constructor(
    private readonly spreadsheetUrl: string,
    private readonly spaceId: string
  ) {
    const spreadsheetId = this.spreadsheetUrl.match(
      /https:\/\/docs.google.com\/spreadsheets\/d\/(.*)\/edit/
    )?.[1];
    if (!spreadsheetId) {
      throw new Error('Invalid spreadsheet url');
    }
    this.spreadsheet = new GoogleSpreadsheet(spreadsheetId, googleJwt);
  }

  async initialize(): Promise<void> {
    await this.spreadsheet.loadInfo();
  }

  async getCardData(): Promise<SignUpAndCreateSpaceProfileRequest[]> {
    const sheet = this.spreadsheet.sheetsByIndex[0];
    const rows = await sheet.getRows();

    return rows.map((row, index) => {
      const values: (string | undefined)[] = Object.values(row.toObject());

      const name = values[0]?.trim();
      if (!name) {
        throw new Error(`Name is not provided at row ${index + 2}`);
      }

      const email = values[1]?.trim();
      if (!email) {
        throw new Error(`Email is not provided at row ${index + 2}`);
      }

      let phone: string | undefined;
      const phoneInput = values[2]?.trim();
      if (!phoneInput) {
        phone = undefined;
      } else {
        try {
          const phoneNumber = parsePhoneNumber(phoneInput, 'KR');
          phone = phoneNumber
            .formatInternational()
            .split(' ')
            .splice(1)
            .join('');
        } catch (error) {
          throw new Error(`Invalid phone number at row ${index + 2}`);
        }
      }

      const categoryIds = values[3]
        ?.split(',')
        .map((categoryId) => categoryId.trim())
        .filter((categoryId) => categoryId);

      const subtitle = values[4]?.trim();
      const description = values[5]?.trim();

      const tags = values[6]
        ?.split(/\s|,|\n|#/)
        .map((tag) => tag.trim())
        .filter((tag) => tag && tag !== '#' && tag !== ',' && tag !== '\n');

      const imageUrl = values[7]?.trim();

      const socialUrls: Record<SpaceSupportedSocial, string | undefined> = {
        WEBSITE: values[8]?.trim(),
        LINKEDIN: values[9]?.trim(),
        INSTAGRAM: values[10]?.trim(),
        FACEBOOK: values[11]?.trim(),
        TWITTER: values[12]?.trim(),
        GITHUB: values[13]?.trim(),
        NAVER_BLOG: values[14]?.trim(),
        'COMPANY_VIDEO#1': values[15]?.trim(),
        'COMPANY_FILE#1': values[16]?.trim(),
        'COMPANY_VIDEO#2': '',
        'COMPANY_VIDEO#3': '',
        'COMPANY_VIDEO#4': '',
        'COMPANY_VIDEO#5': '',
        'COMPANY_FILE#2': '',
        'COMPANY_FILE#3': '',
        'COMPANY_FILE#4': '',
        'COMPANY_FILE#5': '',
      };
      const links: SpaceProfileLink[] = Object.entries(socialUrls).reduce(
        (acc, [social, url]) => {
          if (url) {
            acc.push(
              SpaceSocialUtil.getProfileLink(
                social as SpaceSupportedSocial,
                url
              )
            );
          }
          return acc;
        },
        [] as SpaceProfileLink[]
      );

      const requestDto: SignUpAndCreateSpaceProfileRequest = {
        signUpInfo: {
          name,
          email,
          phone,
          timezone: {
            id: '64158cebd3603238234d6c63',
            name: '(GMT+09:00) Seoul',
            timezone: 'Asia/Seoul',
            offset: '+9',
          },
          locale: 'ko',
        },
        spaceProfileInfo: {
          spaceId: this.spaceId,
          title: name,
          categoryIds: categoryIds || [],
          subtitle: subtitle || '',
          description: description || '',
          tags: tags || [],
          imageUrl: imageUrl || '',
          links,
        },
      };
      return requestDto;
    });
  }
}
