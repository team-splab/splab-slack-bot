import { LocalizedText, SpaceContactPoint } from '../apis/space/types';

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
