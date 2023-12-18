import Color from 'color';
import {
  LocalizedText,
  SpaceContactPoint,
  SpaceProfileCategoryItem,
  SpaceSupportedSocial,
} from '../apis/space/types';
import { shuffle } from './array';
import { SpaceProfileLink } from '../apis/space/profile-create.ts/types';

export const getSpaceUrl = (spaceHandle: string) => {
  return process.env.IS_PRODUCTION === 'true'
    ? `https://umoh.io/@${spaceHandle}`
    : `https://dev.umoh.io/@${spaceHandle}`;
};

export const getContactPoint = (value: string): SpaceContactPoint => {
  if (value.includes('@')) {
    return {
      type: 'EMAIL',
      value: value.trim(),
    };
  }
  if (value.match(/^[0-9-+ ]+$/)) {
    return {
      type: 'PHONE',
      value: value.trim(),
    };
  }
  if (value.includes('http')) {
    return {
      type: 'WEBSITE',
      value: value.trim(),
    };
  }
  return {
    type: 'WEBSITE',
    value: `https://${value.trim()}`,
  };
};

export const updateLocalizedTexts = (
  localizedTexts: LocalizedText[],
  newLocalizedText: LocalizedText
) => {
  const newLocalizedTexts = [...localizedTexts];
  const index = newLocalizedTexts.findIndex(
    (localizedText) => localizedText.language === newLocalizedText.language
  );
  if (index === -1) {
    if (newLocalizedText.text) {
      newLocalizedTexts.push(newLocalizedText);
    }
  } else {
    if (!newLocalizedText.text) {
      newLocalizedTexts.splice(index, 1);
    } else {
      newLocalizedTexts[index] = newLocalizedText;
    }
  }
  return newLocalizedTexts;
};

export const fillCategoryColorsRandomly = (
  categoryItems: SpaceProfileCategoryItem[]
): SpaceProfileCategoryItem[] => {
  let colors: (string | undefined)[] = categoryItems.map((item) => item.color);

  const startColor = Color.hsv(Math.random() * 360, 73, 75);
  const rotationDegree = colors.length > 1 ? 360 / colors.length : 0;
  for (let i = 0; i < colors.length; i++) {
    const newColor = startColor.rotate(rotationDegree * i);
    colors[i] = newColor.hex();
  }
  colors = shuffle(colors);

  return categoryItems.map((item, index) => ({
    ...item,
    color: colors[index],
  }));
};

const videoIconId = 'carbon:play-outline';
const fileIconId = 'carbon:document-attachment';
const socialToIconIdMap: Record<SpaceSupportedSocial, string> = {
  LINKEDIN: 'logos:linkedin-icon',
  INSTAGRAM: 'skill-icons:instagram',
  TWITTER: 'logos:twitter',
  NAVER_BLOG: 'custom:naver-blog',
  FACEBOOK: 'logos:facebook',
  WEBSITE: 'ant-design:link-outlined',
  GITHUB: 'logos:github-icon',
  'COMPANY_VIDEO#1': videoIconId + '#1',
  'COMPANY_VIDEO#2': videoIconId + '#2',
  'COMPANY_VIDEO#3': videoIconId + '#3',
  'COMPANY_VIDEO#4': videoIconId + '#4',
  'COMPANY_VIDEO#5': videoIconId + '#5',
  'COMPANY_FILE#1': fileIconId + '#1',
  'COMPANY_FILE#2': fileIconId + '#2',
  'COMPANY_FILE#3': fileIconId + '#3',
  'COMPANY_FILE#4': fileIconId + '#4',
  'COMPANY_FILE#5': fileIconId + '#5',
};

export const SpaceSocialUtil = {
  getSocialLabel: (social: SpaceSupportedSocial): string => {
    switch (social) {
      case 'LINKEDIN':
        return 'LinkedIn';
      case 'INSTAGRAM':
        return 'Instagram';
      case 'TWITTER':
        return 'Twitter';
      case 'NAVER_BLOG':
        return '네이버 블로그';
      case 'FACEBOOK':
        return 'Facebook';
      case 'WEBSITE':
        return '웹사이트';
      case 'GITHUB':
        return 'GitHub';
      case 'COMPANY_VIDEO#1':
      case 'COMPANY_VIDEO#2':
      case 'COMPANY_VIDEO#3':
      case 'COMPANY_VIDEO#4':
      case 'COMPANY_VIDEO#5':
        return '기업소개영상';
      case 'COMPANY_FILE#1':
      case 'COMPANY_FILE#2':
      case 'COMPANY_FILE#3':
      case 'COMPANY_FILE#4':
      case 'COMPANY_FILE#5':
        return '기업소개자료';
    }
  },
  getSocialIconId: (social: SpaceSupportedSocial): string => {
    return socialToIconIdMap[social];
  },
  getProfileLink(
    social: SpaceSupportedSocial,
    value: string
  ): SpaceProfileLink {
    let url = value;
    if (!value.startsWith('http') && !value.startsWith('https')) {
      url = `https://${value}`;
    }
    return {
      url,
      label: SpaceSocialUtil.getSocialLabel(social),
      iconId: SpaceSocialUtil.getSocialIconId(social),
    };
  },
};
