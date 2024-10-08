import React from 'react';
import { Message, UserData } from '../types/chat';
import { User } from 'firebase/auth';
import { format } from 'date-fns';

interface MessageListProps {
  messages: Message[];
  currentUser: User | null;
  handleUserClick: (user: UserData) => void;
  handleMediaClick: (mediaUrl: string) => void;
  messagesEndRef: React.RefObject<HTMLDivElement>;
  usersData: { [uid: string]: UserData };
}

const MessageList: React.FC<MessageListProps> = ({
  messages,
  currentUser,
  handleUserClick,
  handleMediaClick,
  messagesEndRef,
  usersData,
}) => {
  const formatMessageDate = (timestamp: any) => {
    if (!timestamp) return "";
    return format(timestamp.toDate(), "HH:mm");
  };

  const renderMedia = (message: Message, isCurrentUser: boolean) => {
    const mediaClass = isCurrentUser ? "bg-white rounded-lg" : "";
    if (message.mediaType === 'video') {
      return (
        <div className={mediaClass}>
          <video
            src={message.mediaUrl}
            className="mt-2 max-w-full h-auto rounded-lg cursor-pointer"
            controls
            onClick={() => handleMediaClick(message.mediaUrl!)}
          >
            Your browser does not support the video tag.
          </video>
        </div>
      );
    } else {
      return (
        <div className={mediaClass}>
          <img
            src={message.mediaUrl}
            alt="Shared media"
            className="mt-2 max-w-full h-auto rounded-lg cursor-pointer"
            onClick={() => handleMediaClick(message.mediaUrl!)}
          />
        </div>
      );
    }
  };

  return (
    <div className="h-full overflow-y-auto p-4 space-y-4">
      {messages.map((message) => {
        const userData = usersData[message.uid] || {
          displayName: "Unknown User",
          photoURL: "https://api.dicebear.com/6.x/adventurer/svg?seed=Milo",
          email: "",
          online: false,
          lastSeen: null,
        };
        const isCurrentUser = message.uid === currentUser?.uid;
        return (
          <div
            key={message.id}
            className={`flex ${isCurrentUser ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`flex items-end space-x-2 max-w-xs lg:max-w-md ${
                isCurrentUser ? "flex-row-reverse space-x-reverse" : "flex-row"
              }`}
            >
              <div className="relative flex-shrink-0">
                <img
                  src={userData.photoURL}
                  alt={`${userData.displayName}'s avatar`}
                  className="w-8 h-8 rounded-full object-cover cursor-pointer"
                  onClick={() => handleUserClick(userData)}
                />
              </div>
              <div
                className={`px-4 py-2 rounded-lg ${
                  isCurrentUser
                    ? "bg-indigo-500 text-white"
                    : "bg-white text-gray-900"
                }`}
              >
                <p className="font-semibold text-sm">
                  {isCurrentUser ? "You" : userData.displayName}
                </p>
                {message.mediaUrl && renderMedia(message, isCurrentUser)}
                {message.text && <p className="mt-1">{message.text}</p>}
                <p className="text-xs opacity-75 mt-1">
                  {formatMessageDate(message.createdAt)}
                </p>
              </div>
            </div>
          </div>
        );
      })}
      <div ref={messagesEndRef} />
    </div>
  );
};

export default MessageList;