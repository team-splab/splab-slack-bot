export interface SpaceHostsResponse {
  hosts: SpaceHost[];
}

export interface SpaceHostsUpdateParams {
  hosts: SpaceHost[];
}

export interface SpaceHost {
  email: string;
  accessType: 'VIEWER' | 'ADMIN';
}

export interface SpaceResponse extends Space {}

export interface SpaceUpdateParams
  extends Omit<Space, 'id' | 'hostId' | 'hosts' | 'todayViews'> {
  id: undefined;
  hostId: undefined;
  hosts: undefined;
  todayViews: undefined;
}

export interface Space {
  id: string;
  hostId: string;
  hosts: object[];
  handle: string;
  title: string;
  todayViews: number;
  contactPoints: SpaceContactPoint[];
  description?: string;
  imageConfig?: SpaceImageConfig;
  defaultLanguage: string;
  profileCreateConfig?: SpaceProfileCreateConfig;
  profileCategoryConfig?: SpaceProfileCategoryConfig;
  profileBackfaceConfig?: SpaceProfileBackfaceConfig;
  boardConfig?: SpaceBoardConfig;
  profileSubtitleType: 'CATEGORY' | 'SUBTITLE' | 'HIDE';
  isAccessLimitedToOnlyCardOwners: boolean;
  isFullyPrivate: boolean;
  defaultProfileVisible: boolean;
  enterCode?: string;
  isNeedMessaging: boolean;
  messagingOption: SpaceMessagingOption;
}

export interface SpaceContactPoint {
  type: 'EMAIL' | 'PHONE' | 'WEBSITE';
  value: string;
}

export interface SpaceImageConfig {
  fitType?: string;
  borderRadius?: number;
  width?: string;
  height?: string;
}

export interface SpaceProfileCreateConfig {
  defaultLanguage: string;
  supportedSocials?: SpaceSupportedSocial[];
  localizedSubtitlePlaceholders?: LocalizedText[];
}

export const SpaceSupportedSocials = {
  LINKEDIN: {
    id: 'LINKEDIN',
    label: 'LinkedIn',
  },
  INSTAGRAM: {
    id: 'INSTAGRAM',
    label: 'Instagram',
  },
  FACEBOOK: {
    id: 'FACEBOOK',
    label: 'Facebook',
  },
  TWITTER: {
    id: 'TWITTER',
    label: 'Twitter',
  },
  GITHUB: {
    id: 'GITHUB',
    label: 'Github',
  },
  NAVER_BLOG: {
    id: 'NAVER_BLOG',
    label: 'Naver Blog',
  },
  WEBSITE: {
    id: 'WEBSITE',
    label: 'Website',
  },
  'COMPANY_VIDEO#1': {
    id: 'COMPANY_VIDEO#1',
    label: 'Company Video 1',
  },
  'COMPANY_VIDEO#2': {
    id: 'COMPANY_VIDEO#2',
    label: 'Company Video 2',
  },
  'COMPANY_VIDEO#3': {
    id: 'COMPANY_VIDEO#3',
    label: 'Company Video 3',
  },
  'COMPANY_VIDEO#4': {
    id: 'COMPANY_VIDEO#4',
    label: 'Company Video 4',
  },
  'COMPANY_VIDEO#5': {
    id: 'COMPANY_VIDEO#5',
    label: 'Company Video 5',
  },
  'COMPANY_FILE#1': {
    id: 'COMPANY_FILE#1',
    label: 'Company File 1',
  },
  'COMPANY_FILE#2': {
    id: 'COMPANY_FILE#2',
    label: 'Company File 2',
  },
  'COMPANY_FILE#3': {
    id: 'COMPANY_FILE#3',
    label: 'Company File 3',
  },
  'COMPANY_FILE#4': {
    id: 'COMPANY_FILE#4',
    label: 'Company File 4',
  },
  'COMPANY_FILE#5': {
    id: 'COMPANY_FILE#5',
    label: 'Company File 5',
  },
} as const;

export type SpaceSupportedSocial = keyof typeof SpaceSupportedSocials;

export interface SpaceProfileCategoryConfig {
  defaultLanguage: string;
  localizedCategoryLabels: LocalizedText[];
  categoryItems: SpaceProfileCategoryItem[];
  maxItemNumber: number;
}

export interface SpaceProfileBackfaceConfig {
  isBackfaceEnabled: boolean;
}

export interface SpaceProfileCategoryItem {
  id: string;
  localizedNames: LocalizedText[];
  color?: string;
  isPrivate?: boolean;
}

export interface LocalizedText {
  language: string;
  text: string;
}

export interface SpaceBoardConfig {
  isEnabled: boolean;
  accessType: SpaceBoardAccessType;
}

export const SpaceBoardAccessTypes = {
  PUBLIC: 'PUBLIC',
  PREVIEW: 'PREVIEW',
  PRIVATE: 'PRIVATE',
} as const;

export type SpaceBoardAccessType = keyof typeof SpaceBoardAccessTypes;

export const SpaceMessagingOptions = {
  DISABLED: 'DISABLED',
  ENABLED_WITHOUT_AUTH: 'ENABLED_WITHOUT_AUTH',
  ENABLED_WITH_AUTH: 'ENABLED_WITH_AUTH',
} as const;

export type SpaceMessagingOption = keyof typeof SpaceMessagingOptions;
