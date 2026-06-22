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
  media: ThreadMedia[];
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

export interface ThreadMedia {
  id: string;
  sanity_asset_id: string;
  media_type: "image" | "video";
  url: string;
  thumbnail_url?: string;
  caption?: string;
  duration?: number;
  width?: number;
  height?: number;
  order_index: number;
  created_at: string;
}

export interface Message {
  id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  sent_time: string;
  read_status: boolean;
}

export interface Conversation {
  other_user: string;
  other_username: string;
  last_message: string;
  last_message_time: string;
  unread_count: number;
}