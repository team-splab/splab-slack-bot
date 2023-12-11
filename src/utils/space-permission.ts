import { Space } from '../apis/space/types';

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
