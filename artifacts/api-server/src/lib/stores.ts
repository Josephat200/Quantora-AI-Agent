import { randomUUID } from "node:crypto";
import type { Message, Conversation, User, StoredFile } from "../types";

export const users = new Map<string, User>();
export const conversations = new Map<string, Conversation>();
export const files = new Map<string, StoredFile>();

export const newId = () => randomUUID();