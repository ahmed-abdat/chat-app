import React, { useState, useRef, useEffect } from "react";
import { X, Plus, Send, Smile } from "lucide-react";
import EmojiPicker, { EmojiClickData } from "emoji-picker-react";
import { MediaItem } from "../types/chat";

interface MultiMediaPreviewProps {
  mediaItems: MediaItem[];
  onClose: () => void;
  onSend: (updatedMediaItems: MediaItem[]) => void;
  onRemoveItem: (index: number) => void;
  onAddMore: (e: React.ChangeEvent<HTMLInputElement>) => void;
  isSending: boolean;
}

const MultiMediaPreview: React.FC<MultiMediaPreviewProps> = ({
  mediaItems,
  onClose,
  onSend,
  onRemoveItem,
  onAddMore,
  isSending,
}) => {
  const [captions, setCaptions] = useState<string[]>(
    mediaItems.map((item) => item.text || "")
  );
  const [showEmojiPicker, setShowEmojiPicker] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const emojiPickerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (emojiPickerRef.current && !emojiPickerRef.current.contains(event.target as Node)) {
        setShowEmojiPicker(null);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleCaptionChange = (index: number, text: string) => {
    const newCaptions = [...captions];
    newCaptions[index] = text;
    setCaptions(newCaptions);
    setShowEmojiPicker(null); // Close emoji picker when typing
  };

  const handleEmojiClick = (emojiData: EmojiClickData, index: number) => {
    const newCaptions = [...captions];
    newCaptions[index] = (newCaptions[index] || "") + emojiData.emoji;
    setCaptions(newCaptions);
  };

  const handleSend = () => {
    const updatedMediaItems = mediaItems.map((item, index) => ({
      ...item,
      text: captions[index],
    }));
    onSend(updatedMediaItems);
  };

  const handleAddMore = () => {
    fileInputRef.current?.click();
  };

  const toggleEmojiPicker = (index: number) => {
    setShowEmojiPicker(prevIndex => prevIndex === index ? null : index);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-4 max-w-4xl w-full h-[90vh] flex flex-col">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold">Media Preview</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <X size={24} />
          </button>
        </div>
        <div className="flex-grow overflow-y-auto">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {mediaItems.map((item, index) => (
              <div key={index} className="relative">
                {item.type === "image" ? (
                  <img
                    src={item.preview}
                    alt={`Preview ${index}`}
                    className="w-full h-48 object-cover rounded-lg"
                  />
                ) : (
                  <video
                    src={item.preview}
                    className="w-full h-48 object-cover rounded-lg"
                    controls
                  />
                )}
                <button
                  onClick={() => onRemoveItem(index)}
                  className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                >
                  <X size={16} />
                </button>
                <div className="mt-2 relative">
                  <input
                    type="text"
                    value={captions[index]}
                    onChange={(e) => handleCaptionChange(index, e.target.value)}
                    onFocus={() => setShowEmojiPicker(null)}
                    placeholder="Add a caption..."
                    className="w-full p-2 pr-10 border border-gray-300 rounded-md"
                  />
                  <button
                    type="button"
                    onClick={() => toggleEmojiPicker(index)}
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    <Smile className="h-5 w-5" />
                  </button>
                </div>
                {showEmojiPicker === index && (
                  <div ref={emojiPickerRef} className="absolute z-10 mt-2">
                    <EmojiPicker
                      onEmojiClick={(emoji) => handleEmojiClick(emoji, index)}
                      width={280}
                      height={350}
                    />
                  </div>
                )}
              </div>
            ))}
            <div className="flex items-center justify-center h-48 border-2 border-dashed border-gray-300 rounded-lg">
              <button
                onClick={handleAddMore}
                className="flex flex-col items-center text-gray-600 hover:text-gray-800"
              >
                <Plus size={24} />
                <span>Add More</span>
              </button>
            </div>
          </div>
        </div>
        <div className="mt-4 flex justify-end">
          <button
            onClick={handleSend}
            disabled={isSending}
            className="bg-indigo-500 text-white px-4 py-2 rounded-md hover:bg-indigo-600 transition-colors flex items-center"
          >
            {isSending ? (
              <>
                <svg className="animate-spin h-5 w-5 mr-2" viewBox="0 0 24 24">
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                Sending
              </>
            ) : (
              <>
                <Send className="mr-2" size={20} />
                Send
              </>
            )}
          </button>
        </div>
      </div>
      <input
        type="file"
        ref={fileInputRef}
        onChange={onAddMore}
        accept="image/*,video/*"
        className="hidden"
        multiple
      />
    </div>
  );
};

export default MultiMediaPreview;