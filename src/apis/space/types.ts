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
