import { useState, useRef, useCallback } from 'react';

export const useScrollToBottom = () => {
  const [isAtBottom, setIsAtBottom] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = useCallback((behavior: ScrollBehavior = 'smooth') => {
    messagesEndRef.current?.scrollIntoView({ behavior });
  }, []);

  const handleScroll = useCallback(() => {
    if (chatContainerRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = chatContainerRef.current;
      setIsAtBottom(scrollHeight - scrollTop - clientHeight < 1);
    }
  }, []);

  return { scrollToBottom, isAtBottom, messagesEndRef, chatContainerRef, handleScroll };
};