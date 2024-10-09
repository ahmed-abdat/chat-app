import { useState, useCallback } from 'react';
import { User } from 'firebase/auth';
import { Message } from '../types/chat';

export const useMessages = (currentUser: User | null) => {
  const [messages, setMessages] = useState<Message[]>([]);

  const addMessage = useCallback((newMessages: Message[]) => {
    setMessages((prevMessages) => [...prevMessages, ...newMessages]);
  }, []);

  const fetchUserData = useCallback((uid: string) => {
    // Implement user data fetching logic here
    console.log(`Fetching user data for ${uid}`);
  }, []);

  return { messages, addMessage, fetchUserData };
};