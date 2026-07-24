export interface Profile {
  id: string;
  full_name: string;
  username: string;
  bio?: string;
  phone?: string;
  email?: string;
  county?: string;
  preferred_lang?: string;
  avatar_url?: string;
  heshima_score: number;
  role: 'user' | 'expert' | 'moderator' | 'admin' | 'parent';
  interests: string[];
  badges?: string[];
  verified: boolean;
  post_count: number;
  answer_count: number;
  follower_count: number;
  following_count: number;
  parent_id?: string;
  is_minor?: boolean;
  created_at: string;
}

export interface ParentLink {
  id: string;
  parent_id: string;
  child_name: string;
  child_age?: number;
  child_grade?: string;
  notes?: string;
  approved_professional_ids: string[];
  created_at: string;
  parent?: Pick<Profile, 'full_name' | 'avatar_url'>;
}

export interface Payout {
  id: string;
  professional_id: string;
  tip_id: string;
  amount_professional: number;
  amount_platform: number;
  status: 'pending' | 'paid' | 'cancelled';
  paid_at?: string;
  paid_by?: string;
  notes?: string;
  created_at: string;
  professional?: Pick<Profile, 'full_name' | 'avatar_url'> & { title?: string };
  tip?: Pick<Tip, 'amount' | 'mpesa_ref' | 'created_at'> & { student?: Pick<Profile, 'full_name'> };
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
  author?: Pick<Profile, 'full_name' | 'avatar_url' | 'verified' | 'county' | 'username'>;
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
  author?: Pick<Profile, 'full_name' | 'avatar_url' | 'verified' | 'username'>;
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

export interface Professional {
  id: string;
  profile_id: string;
  title: string;
  bio: string;
  qualifications: string;
  qualifications_doc_url?: string;
  expertise: string[];
  teaching_level: string[];
  hourly_rate?: number;
  verification_status: 'pending' | 'approved' | 'rejected';
  verified_by?: string;
  verified_at?: string;
  rejection_reason?: string;
  avg_rating: number;
  total_sessions: number;
  total_tips: number;
  created_at: string;
  profile?: Pick<Profile, 'full_name' | 'avatar_url' | 'county' | 'verified' | 'heshima_score' | 'role'>;
}

export interface ProfessionalRequest {
  id: string;
  profile_id: string;
  title: string;
  bio: string;
  qualifications: string;
  qualifications_doc_url?: string;
  expertise: string[];
  teaching_level: string[];
  status: 'pending' | 'approved' | 'rejected';
  reviewed_by?: string;
  reviewed_at?: string;
  rejection_reason?: string;
  created_at: string;
  profile?: Pick<Profile, 'full_name' | 'avatar_url' | 'county' | 'email'>;
}

export interface TeachingSession {
  id: string;
  student_id: string;
  professional_id: string;
  topic: string;
  description?: string;
  status: 'requested' | 'active' | 'completed' | 'cancelled';
  created_at: string;
  updated_at?: string;
  student?: Pick<Profile, 'full_name' | 'avatar_url' | 'county'>;
  professional?: Pick<Profile, 'full_name' | 'avatar_url' | 'county'> & { title?: string };
}

export interface ChatMessage {
  id: string;
  session_id: string;
  sender_id: string;
  content: string;
  created_at: string;
  sender?: Pick<Profile, 'full_name' | 'avatar_url'>;
}

export interface ServiceRating {
  id: string;
  session_id: string;
  student_id: string;
  professional_id: string;
  score: number;
  review?: string;
  created_at: string;
  student?: Pick<Profile, 'full_name' | 'avatar_url'>;
}

export interface Tip {
  id: string;
  session_id: string;
  student_id: string;
  professional_id: string;
  amount: number;
  platform_amount?: number;
  professional_amount?: number;
  mpesa_ref?: string;
  status: 'pending' | 'completed' | 'failed';
  payout_status?: 'pending' | 'paid' | 'cancelled';
  created_at: string;
  student?: Pick<Profile, 'full_name'>;
  professional?: Pick<Profile, 'full_name'>;
}
