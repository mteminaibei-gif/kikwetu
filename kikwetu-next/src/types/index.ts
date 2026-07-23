export interface Profile {
  id: string;
  full_name: string;
  username: string;
  phone?: string;
  email?: string;
  county?: string;
  preferred_lang?: string;
  avatar_url?: string;
  heshima_score: number;
  role: 'user' | 'expert' | 'moderator' | 'admin';
  interests: string[];
  badges?: string[];
  verified: boolean;
  post_count: number;
  answer_count: number;
  follower_count: number;
  following_count: number;
  created_at: string;
}

export interface Thread {
  id: string;
  author_id: string;
  space_id?: string;
  type: 'question' | 'educative' | 'poll';
  title: string;
  content: string;
  language?: string;
  media_urls?: string[];
  tags?: string[];
  county?: string;
  is_anonymous?: boolean;
  upvotes_count: number;
  reply_count: number;
  created_at: string;
  author?: Pick<Profile, 'full_name' | 'avatar_url' | 'verified' | 'county'>;
  space?: { name: string };
}

export interface Reply {
  id: string;
  thread_id: string;
  author_id: string;
  parent_id?: string;
  content: string;
  language?: string;
  is_accepted: boolean;
  upvotes_count: number;
  created_at: string;
  author?: Pick<Profile, 'full_name' | 'avatar_url' | 'verified'>;
}

export interface Space {
  id: string;
  name: string;
  slug: string;
  description?: string;
  icon?: string;
  category?: string;
  cover_url?: string;
  is_private: boolean;
  member_count: number;
  thread_count: number;
  created_at: string;
}

export interface Vote {
  id: string;
  user_id: string;
  entity_id: string;
  entity_type: 'thread' | 'reply';
  vote_type: 'up' | 'down';
  created_at: string;
}

export interface Notification {
  id: string;
  user_id: string;
  type: 'upvote' | 'reply' | 'follow' | 'accept' | 'badge';
  title: string;
  body?: string;
  related_id?: string;
  actor_id?: string;
  is_read: boolean;
  created_at: string;
}

export interface Report {
  id: string;
  reporter_id: string;
  entity_id: string;
  entity_type: 'thread' | 'reply' | 'profile';
  reason: string;
  status: 'pending' | 'resolved' | 'dismissed';
  created_at: string;
  content?: string;
  author?: string;
}

export interface LiveRoom {
  id: string;
  title: string;
  host_id: string;
  language: string;
  is_active: boolean;
  participant_count: number;
  created_at: string;
}

export interface Quiz {
  id: string;
  space_id?: string;
  title: string;
  description?: string;
  options: QuizOption[];
  correct_answer: number;
  difficulty: 'easy' | 'medium' | 'hard';
  points: number;
  created_at: string;
}

export interface QuizOption {
  id: number;
  text: string;
}

export interface QuizResult {
  id: string;
  user_id: string;
  quiz_id: string;
  score: number;
  answers: number[];
  completed_at: string;
}
