export interface User {
  id: string;
  username: string;
  email: string;
  profile_image?: string;
  email_verified?: boolean;
  created_at?: string;
  last_seen?: string;
}

export interface Tribe {
  id: string;
  name: string;
  description?: string;
  member_count: number;
  is_member?: boolean;
  created_at?: string;
}

export interface VoteInfo {
  score: number;
  user_vote: number | null;
}

export interface Thread {
  id: string;
  title: string;
  content?: string;
  score: number;
  comment_count: number;
  reply_count: number;
  user_vote: number;
  created_at: string;
  updated_at: string;
  author?: User;
  tribe?: Tribe;
  comments?: Comment[];
  children?: Thread[];
  vote_info?: VoteInfo;
  is_deleted?: boolean;
}

export interface Comment {
  id: string;
  content: string;
  created_at: string;
  author?: User;
  replies?: Comment[];
}

export interface CommentResult {
  id: string;
  content: string;
  author: User;
  thread_id: string;
  thread_title: string;
}

export interface SearchResults {
  threads: Thread[];
  users: User[];
  comments: CommentResult[];
}