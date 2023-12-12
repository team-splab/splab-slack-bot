export interface SpaceEngagingEvent {
  type: 'REACTION' | 'SCRAP';
  spaceTitle: string;
  spaceHandle: string;
  spaceLocale: string;
  profiles: EngagingProfile[];
  popularProfile: EngagingProfile;
}

export interface EngagingProfile {
  email?: string;
  phone?: string;
  title: string;
  imageUrl: string | 'https://storage.umoh.io/official/umoh_icon_gray.png';
  category: string;
  introduce: string;
}
