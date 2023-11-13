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
  description?: string;
  profileCategoryConfig?: {
    defaultLanguage: string;
    localizedCategoryLabels: LocalizedText[];
    categoryItems: {
      id: string;
      localizedNames: LocalizedText[];
      color?: string;
      isPrivate?: boolean;
    }[];
    maxItemNumber: number;
  };
}

interface LocalizedText {
  language: string;
  text: string;
}
