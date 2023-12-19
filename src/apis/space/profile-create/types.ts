import { Timezone } from '../../types';

export interface SignUpAndCreateSpaceProfileRequest {
  signUpInfo: {
    email: string;
    name: string;
    phone?: string;
    timezone: Timezone;
    locale: string;
  };
  spaceProfileInfo: CreateSpaceProfileRequest;
}

export interface CreateSpaceProfileRequest {
  spaceId: string;
  title: string;
  subtitle?: string;
  tags: string[];
  categoryIds: string[];
  description?: string;
  imageUrl?: string;
  links?: SpaceProfileLink[];
}

export interface SpaceProfileLink {
  url: string;
  label: string;
  iconId: string;
  size?: number;
  color?: string;
}
