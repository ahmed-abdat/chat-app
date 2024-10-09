import React, { useRef, useState, useEffect } from "react";
import { Send, Smile, Paperclip } from "lucide-react";
import EmojiPicker, { EmojiClickData } from "emoji-picker-react";

interface ChatInputProps {
  newMessage: string;
  setNewMessage: (message: string) => void;
  handleSubmit: (e: React.FormEvent) => void;
  handleMediaChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  isSending: boolean;
}

const ChatInput: React.FC<ChatInputProps> = ({
  newMessage,
  setNewMessage,
  handleSubmit,
  handleMediaChange,
  isSending,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const emojiPickerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (emojiPickerRef.current && !emojiPickerRef.current.contains(event.target as Node)) {
        setShowEmojiPicker(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleEmojiClick = (emojiData: EmojiClickData) => {
    setNewMessage((prevMessage) => prevMessage + emojiData.emoji);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewMessage(e.target.value);
  };

  const toggleEmojiPicker = () => {
    setShowEmojiPicker((prev) => !prev);
  };

  return (
    <div className="bg-white border-t border-gray-200 p-4">
      <div className="max-w-4xl mx-auto">
        <form onSubmit={handleSubmit} className="flex items-center space-x-2">
          <button
            type="button"
            onClick={toggleEmojiPicker}
            className="text-gray-500 hover:text-indigo-600 transition-colors"
          >
            <Smile className="h-6 w-6" />
          </button>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="text-gray-500 hover:text-indigo-600 transition-colors"
          >
            <Paperclip className="h-6 w-6" />
          </button>
          <input
            type="text"
            value={newMessage}
            onChange={handleInputChange}
            placeholder="Type a message..."
            className="flex-grow bg-gray-100 text-gray-800 p-2 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
            ref={inputRef}
          />
          <button
            type="submit"
            disabled={isSending || newMessage.trim() === ''}
            className={`bg-indigo-600 text-white p-2 rounded-md hover:bg-indigo-700 transition-colors ${
              isSending || newMessage.trim() === '' ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            <Send className="h-5 w-5" />
          </button>
        </form>
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleMediaChange}
          accept="image/*,video/*"
          className="hidden"
          multiple
        />
        {showEmojiPicker && (
          <div ref={emojiPickerRef} className="absolute bottom-16 left-4 z-10">
            <EmojiPicker
              onEmojiClick={handleEmojiClick}
              theme="light"
              skinTonesDisabled
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatInput;