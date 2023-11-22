import { LocalizedText, Space, SpaceContactPoint } from '../apis/space/types';

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

export interface SpacePermission {
  label: string;
  value: string;
  criteria?: Pick<
    Space,
    | 'isAccessLimitedToOnlyCardOwners'
    | 'isFullyPrivate'
    | 'defaultProfileVisible'
  >;
}

export const SpacePermissions: Record<string, SpacePermission> = {
  PUBLIC: {
    label: 'Public',
    value: 'PUBLIC',
    criteria: {
      isAccessLimitedToOnlyCardOwners: false,
      isFullyPrivate: false,
      defaultProfileVisible: true,
    },
  },
  PREVIEW: {
    label: 'Preview',
    value: 'PREVIEW',
    criteria: {
      isAccessLimitedToOnlyCardOwners: true,
      isFullyPrivate: false,
      defaultProfileVisible: true,
    },
  },
  PRIVATE_APPROVAL_REQUIRED: {
    label: 'Private (Approval required)',
    value: 'PRIVATE_APPROVAL_REQUIRED',
    criteria: {
      isAccessLimitedToOnlyCardOwners: true,
      isFullyPrivate: true,
      defaultProfileVisible: false,
    },
  },
  PRIVATE_APPROVAL_NOT_REQUIRED: {
    label: 'Private (Approval not required)',
    value: 'PRIVATE_APPROVAL_NOT_REQUIRED',
    criteria: {
      isAccessLimitedToOnlyCardOwners: true,
      isFullyPrivate: true,
      defaultProfileVisible: true,
    },
  },
  CUSTOM: {
    label: 'Custom',
    value: 'CUSTOM',
  },
};

export type SpacePermissionType = keyof typeof SpacePermissions;

export const getSpacePermissionValue = (
  criteria: NonNullable<SpacePermission['criteria']>
): SpacePermission => {
  const spacePermission = Object.values(SpacePermissions).find((permission) => {
    if (!permission.criteria) {
      return false;
    }
    return Object.keys(permission.criteria).every((k) => {
      const key = k as keyof typeof criteria;
      return permission.criteria?.[key] === criteria[key];
    });
  });
  return spacePermission || SpacePermissions.CUSTOM;
};
