export type Msg = {
  id: string;
  user_id: string;
  nickname: string;
  content: string;
  created_at: string; // ISO
};

export type FileDB = {
  messages: Msg[];
};

export type Presence = Record<string, { nickname: string; ts: number }>;
