import Color from 'color';
import {
  LocalizedText,
  SpaceContactPoint,
  SpaceProfileCategoryItem,
} from '../apis/space/types';
import { shuffle } from './array';

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
