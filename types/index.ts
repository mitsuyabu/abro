export type UserPhase = 'considering' | 'preparing' | 'abroad' | 'returned';

export interface User {
  id: string;
  email: string;
  nickname: string | null;
  phase: UserPhase;
  interested_countries: string[];
  purposes: string[];
  avatar_url: string | null;
  bio: string | null;
  created_at: string;
  updated_at: string;
}

export interface AuthSession {
  access_token: string;
  refresh_token: string;
  user: {
    id: string;
    email: string;
  };
}

export interface UserUpdate {
  nickname?: string | null;
  phase?: UserPhase;
  interested_countries?: string[];
  purposes?: string[];
  avatar_url?: string | null;
  bio?: string | null;
  updated_at?: string;
}

export type Database = {
  public: {
    Tables: {
      users: {
        Row: User;
        Insert: {
          id: string;
          email: string;
          nickname?: string | null;
          phase?: UserPhase;
          interested_countries?: string[];
          purposes?: string[];
          avatar_url?: string | null;
          bio?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: UserUpdate;
      };
    };
  };
};
