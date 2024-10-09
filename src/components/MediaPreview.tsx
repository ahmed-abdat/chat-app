import React, { useState } from 'react';
import {  Send, Smile } from 'lucide-react';
import Picker from "@emoji-mart/react";
import data from "@emoji-mart/data";

interface MediaPreviewProps {
  mediaType: 'image' | 'video';
  mediaUrl: string;
  onClose: () => void;
  onSend: (caption: string) => void;
}

const MediaPreview: React.FC<MediaPreviewProps> = ({ mediaType, mediaUrl, onClose, onSend }) => {
  const [caption, setCaption] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  const handleEmojiSelect = (emoji: any) => {
    setCaption((prevCaption) => prevCaption + emoji.native);
    setShowEmojiPicker(false);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-4 max-w-2xl w-full relative">
        {mediaType === 'image' ? (
          <img
            src={mediaUrl}
            alt="Selected media preview"
            className="max-w-full max-h-[60vh] mx-auto rounded-lg"
          />
        ) : (
          <video
            src={mediaUrl}
            controls
            className="max-w-full max-h-[60vh] mx-auto rounded-lg"
          />
        )}
        <div className="mt-4">
          <div className="relative">
            <input
              type="text"
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder="Add a caption..."
              className="w-full p-2 pr-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <button
              type="button"
              onClick={() => setShowEmojiPicker(!showEmojiPicker)}
              className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <Smile className="h-5 w-5" />
            </button>
          </div>
          <div className="flex justify-end mt-4 space-x-2">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600"
            >
              Cancel
            </button>
            <button
              onClick={() => onSend(caption)}
              className="px-4 py-2 bg-indigo-500 text-white rounded-md hover:bg-indigo-600 flex items-center"
            >
              <Send className="mr-2 h-4 w-4" />
              Send
            </button>
          </div>
        </div>
      </div>
      {showEmojiPicker && (
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-[60]">
          <Picker data={data} onEmojiSelect={handleEmojiSelect} />
        </div>
      )}
    </div>
  );
};

export default MediaPreview;