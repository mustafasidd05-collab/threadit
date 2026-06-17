export interface User {
  id: string;
  username: string;
  email: string;
  profile_image: string | null;
  email_verified?: boolean;
  created_at: string;
  last_seen: string;
}

export interface VoteInfo {
  score: number;
  user_vote: number | null;
}

export interface Thread {
  id: string;
  title: string;
  content: string;
  author: User;
  parent_thread_id: string | null;
  tribe_id: string | null;
  created_at: string;
  updated_at: string;
  reply_count: number;
  vote_info: VoteInfo;
  is_deleted: boolean;
}

export interface ThreadTree extends Thread {
  children: ThreadTree[];
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

export interface FileRecord {
  id: string;
  uploader_id: string;
  filename: string;
  file_type: string;
  file_url: string;
  uploaded_at: string;
}

export interface Tribe {
  id: string;
  name: string;
  description: string;
  creator: User;
  created_at: string;
  member_count: number;
  is_member: boolean;
  user_role: string | null;
}

export interface SearchResults {
  threads: Thread[];
  users: User[];
  comments: CommentResult[];
}

export interface CommentResult {
  id: string;
  content: string;
  author: User;
  thread_id: string;
  thread_title: string;
}
