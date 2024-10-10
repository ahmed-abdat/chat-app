import { Timestamp } from 'firebase/firestore';

export interface Message {
  id: string;
  text: string;
  createdAt: Timestamp | null;
  uid: string;
  mediaUrl?: string;
  mediaType?: 'image' | 'video';
  thumbnailUrl?: string;
  videoDuration?: number;
}

export interface UserData {
  uid: string;
  displayName: string;
  lastSeen: { seconds: number; nanoseconds: number } | string | null;
  online: boolean;
  photoURL: string;
  email: string;
}

export interface UserPreview extends UserData {
  uid: string;
}

export interface MediaItem {
  file: File;
  preview: string;
  type: 'image' | 'video';
  url: string;
  text: string;
  userName: string;
  userAvatar: string;
}

export interface ChatMediaItem {
  url: string;
  text: string;
  type: 'image' | 'video';
  userName: string;
  userAvatar: string;
}