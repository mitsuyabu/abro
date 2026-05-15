// ─── ユーザー ───────────────────────────────────────────
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
  followers_count: number;
  following_count: number;
  posts_count: number;
  created_at: string;
  updated_at: string;
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

// ─── チャット ────────────────────────────────────────────
export type ChatType = 'ai' | 'agent' | 'community';
export type MessageRole = 'user' | 'assistant' | 'system';
export type PlanItemType = 'school' | 'accommodation' | 'flight' | 'insurance' | 'visa' | 'activity' | 'other';
export type PlanStatus = 'draft' | 'private' | 'shared' | 'public';

export interface Chat {
  id: string;
  user_id: string;
  title: string | null;
  type: ChatType;
  plan_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface StructuredContent {
  type: 'plan_item';
  item_type: PlanItemType;
  title: string;
  description?: string;
  cost_jpy?: number;
  metadata?: Record<string, unknown>;
}

export interface Message {
  id: string;
  chat_id: string;
  role: MessageRole;
  content: string;
  structured_content: StructuredContent | null;
  created_at: string;
}

// ─── プラン ──────────────────────────────────────────────
export interface Plan {
  id: string;
  user_id: string;
  title: string;
  destination_country: string | null;
  destination_city: string | null;
  start_date: string | null;
  end_date: string | null;
  duration_weeks: number | null;
  purpose: string | null;
  budget_jpy: number | null;
  status: PlanStatus;
  is_template: boolean;
  created_at: string;
  updated_at: string;
}

export interface PlanItem {
  id: string;
  plan_id: string;
  item_type: PlanItemType;
  title: string;
  description: string | null;
  cost_jpy: number | null;
  start_date: string | null;
  end_date: string | null;
  metadata: Record<string, unknown> | null;
  order_index: number;
  created_at: string;
}

// ─── 費用シミュレーター ──────────────────────────────────
export type CostFrequency = 'once' | 'monthly' | 'weekly' | 'daily';
export type CostCategory =
  | 'visa' | 'tuition' | 'flight' | 'accommodation'
  | 'food' | 'transport' | 'insurance' | 'phone'
  | 'pocket_money' | 'reserve' | 'other';

export interface CostSimulation {
  id: string;
  plan_id: string | null;
  user_id: string;
  currency: string;
  exchange_rates: Record<string, number> | null;
  created_at: string;
  updated_at: string;
}

export interface CostItem {
  id: string;
  simulation_id: string;
  category: CostCategory;
  label: string;
  amount_jpy: number;
  frequency: CostFrequency;
  duration: number;
  note: string | null;
  is_estimated: boolean;
  order_index: number;
  created_at: string;
}

// ─── ブックマーク ────────────────────────────────────────
export type BookmarkSourceType = 'url' | 'image' | 'pdf' | 'note' | 'map_pin' | 'video';

export interface Bookmark {
  id: string;
  user_id: string;
  source_type: BookmarkSourceType;
  source_url: string | null;
  title: string | null;
  description: string | null;
  thumbnail_url: string | null;
  content_text: string | null;
  category: string;
  tags: string[];
  location: Record<string, unknown> | null;
  metadata: Record<string, unknown> | null;
  ai_classified: boolean;
  ai_confidence: number | null;
  plan_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface BookmarkCategory {
  id: string;
  user_id: string;
  key: string;
  label: string;
  icon: string | null;
  is_default: boolean;
  order_index: number;
}

// ─── 親子連携 / タスク ───────────────────────────────────
export type ParentLinkStatus = 'pending' | 'active' | 'revoked';
export type ParentLinkPermission = 'view' | 'comment';

export interface ParentLink {
  id: string;
  child_user_id: string;
  parent_user_id: string | null;
  permission: ParentLinkPermission;
  status: ParentLinkStatus;
  invitation_code: string | null;
  created_at: string;
  approved_at: string | null;
}

export interface Task {
  id: string;
  user_id: string;
  plan_id: string | null;
  title: string;
  description: string | null;
  category: string | null;
  due_date: string | null;
  completed_at: string | null;
  priority: number;
  is_milestone: boolean;
  auto_generated: boolean;
  created_at: string;
}

// ─── エージェント ────────────────────────────────────────
export type AgentPlan = 'basic' | 'premium' | 'enterprise';
export type CollaboratorRole = 'agent' | 'friend' | 'parent';
export type CollaboratorPermission = 'view' | 'suggest' | 'edit';

export interface Agent {
  id: string;
  name: string;
  logo_url: string | null;
  description: string | null;
  specialties: string[];
  countries: string[];
  rating: number;
  review_count: number;
  plan: AgentPlan;
  created_at: string;
}

export interface AgentCounselor {
  id: string;
  agent_id: string;
  user_id: string | null;
  display_name: string;
  avatar_url: string | null;
  bio: string | null;
  specialties: string[];
  languages: string[];
  years_experience: number | null;
  is_online: boolean;
  rating: number;
  review_count: number;
  created_at: string;
}

export interface AgentReview {
  id: string;
  agent_id: string | null;
  counselor_id: string | null;
  reviewer_id: string;
  rating: number;
  comment: string | null;
  verified: boolean;
  created_at: string;
}

export interface PlanCollaborator {
  id: string;
  plan_id: string;
  collaborator_user_id: string;
  role: CollaboratorRole;
  permission: CollaboratorPermission;
  invited_at: string;
  accepted_at: string | null;
}

// ─── SNS ─────────────────────────────────────────────────
export type PostVisibility = 'public' | 'phase_only' | 'community_only';

export interface Post {
  id: string;
  user_id: string;
  content: string;
  media_urls: string[];
  location: Record<string, unknown> | null;
  visibility: PostVisibility;
  user_phase: string | null;
  like_count: number;
  comment_count: number;
  created_at: string;
  updated_at: string;
}

export interface PostWithUser extends Post {
  user: Pick<User, 'id' | 'nickname' | 'avatar_url' | 'phase'>;
  liked_by_me: boolean;
}

export interface PostComment {
  id: string;
  post_id: string;
  user_id: string;
  content: string;
  created_at: string;
  user?: Pick<User, 'id' | 'nickname' | 'avatar_url'>;
}

export interface Follow {
  follower_id: string;
  following_id: string;
  created_at: string;
}

export interface DmThread {
  id: string;
  participant_a: string;
  participant_b: string;
  last_message_at: string | null;
  last_message_preview: string | null;
  created_at: string;
  other_user?: Pick<User, 'id' | 'nickname' | 'avatar_url'>;
}

export interface DmMessage {
  id: string;
  thread_id: string;
  sender_id: string;
  content: string;
  read_at: string | null;
  created_at: string;
}

// ─── コミュニティ ─────────────────────────────────────────
export type CommunityType = 'city' | 'school' | 'purpose' | 'custom';
export type CommunityMemberRole = 'owner' | 'admin' | 'member';

export interface Community {
  id: string;
  name: string;
  description: string | null;
  type: CommunityType;
  is_official: boolean;
  cover_emoji: string;
  city: string | null;
  country: string | null;
  member_count: number;
  post_count: number;
  created_by: string | null;
  created_at: string;
  is_member?: boolean;
  my_role?: CommunityMemberRole | null;
}

export interface CommunityMember {
  community_id: string;
  user_id: string;
  role: CommunityMemberRole;
  joined_at: string;
}

export interface CommunityPost {
  id: string;
  community_id: string;
  user_id: string;
  content: string;
  like_count: number;
  is_pinned: boolean;
  created_at: string;
  updated_at: string;
  user?: Pick<User, 'id' | 'nickname' | 'avatar_url' | 'phase'>;
  liked_by_me?: boolean;
}

// ─── 掲示板 ──────────────────────────────────────────────
export type ListingCategory = 'job' | 'roommate' | 'item' | 'travel_companion' | 'other';
export type ListingStatus = 'active' | 'closed';
export type ListingPriceFrequency = 'hour' | 'day' | 'week' | 'month' | 'once';

export interface Listing {
  id: string;
  user_id: string;
  category: ListingCategory;
  title: string;
  description: string;
  city: string | null;
  country: string | null;
  price_amount: number | null;
  price_currency: string;
  price_frequency: ListingPriceFrequency | null;
  images: string[];
  expires_at: string | null;
  status: ListingStatus;
  metadata: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
  user?: Pick<User, 'id' | 'nickname' | 'avatar_url' | 'phase'>;
}

export interface ListingInquiry {
  id: string;
  listing_id: string;
  inquirer_id: string;
  message: string;
  status: string;
  created_at: string;
}

// ─── 先輩Q&A ──────────────────────────────────────────────
export type QaCategory = 'visa' | 'life' | 'school' | 'work' | 'money' | 'housing' | 'accident' | 'other';

export interface QaThread {
  id: string;
  questioner_id: string;
  category: QaCategory;
  title: string;
  content: string;
  is_anonymous: boolean;
  answer_count: number;
  view_count: number;
  is_resolved: boolean;
  best_answer_id: string | null;
  created_at: string;
  updated_at: string;
  questioner?: Pick<User, 'id' | 'nickname' | 'avatar_url' | 'phase'>;
}

export interface QaAnswer {
  id: string;
  thread_id: string;
  answerer_id: string;
  content: string;
  vote_count: number;
  is_best: boolean;
  created_at: string;
  updated_at: string;
  answerer?: Pick<User, 'id' | 'nickname' | 'avatar_url' | 'phase'>;
  voted_by_me?: boolean;
}

// ─── Supabase DB 型 ──────────────────────────────────────
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
      chats: {
        Row: Chat;
        Insert: {
          id?: string;
          user_id: string;
          title?: string | null;
          type?: ChatType;
          plan_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          title?: string | null;
          plan_id?: string | null;
          updated_at?: string;
        };
      };
      messages: {
        Row: Message;
        Insert: {
          id?: string;
          chat_id: string;
          role: MessageRole;
          content: string;
          structured_content?: StructuredContent | null;
          created_at?: string;
        };
        Update: Record<string, never>;
      };
      plans: {
        Row: Plan;
        Insert: {
          id?: string;
          user_id: string;
          title: string;
          destination_country?: string | null;
          destination_city?: string | null;
          start_date?: string | null;
          end_date?: string | null;
          duration_weeks?: number | null;
          purpose?: string | null;
          budget_jpy?: number | null;
          status?: PlanStatus;
          is_template?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Omit<Plan, 'id' | 'user_id' | 'created_at'>>;
      };
      plan_items: {
        Row: PlanItem;
        Insert: {
          id?: string;
          plan_id: string;
          item_type: PlanItemType;
          title: string;
          description?: string | null;
          cost_jpy?: number | null;
          start_date?: string | null;
          end_date?: string | null;
          metadata?: Record<string, unknown> | null;
          order_index?: number;
          created_at?: string;
        };
        Update: Partial<Omit<PlanItem, 'id' | 'plan_id' | 'created_at'>>;
      };
    };
  };
};
