export type User = {
  id: string;
  email: string;
  fullName: string;
  hashedPassword: string;
  isActive: boolean;
};

export type Message = {
  id: string;
  role: "user" | "assistant";
  content: string;
  createdAt: string;
};

export type Conversation = {
  id: string;
  userId: string;
  title: string;
  messages: Message[];
  updatedAt: string;
};

export type StoredFile = {
  id: string;
  userId: string;
  filename: string;
  contentType: string;
  size: number;
  path: string;
  createdAt: string;
};