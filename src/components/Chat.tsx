import React, { useState, useEffect, useRef } from 'react';
import { collection, query, orderBy, limit, onSnapshot, addDoc, serverTimestamp, Timestamp, doc } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import { format } from 'date-fns';
import { Send, Smile } from 'lucide-react';
import UserProfilePreview from './UserProfilePreview';
import Header from './Header';
import data from '@emoji-mart/data';
import Picker from '@emoji-mart/react';

interface Message {
  id: string;
  text: string;
  createdAt: Timestamp | null;
  uid: string;
}

interface UserData {
  displayName: string;
  photoURL: string;
  email: string;
}

interface UserPreview extends UserData {
  uid: string;
}

const Chat: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [previewUser, setPreviewUser] = useState<UserPreview | null>(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [usersData, setUsersData] = useState<{[uid: string]: UserData}>({});
  const { currentUser } = useAuth();
  const messagesEndRef = useRef<null | HTMLDivElement>(null);
  const chatContainerRef = useRef<null | HTMLDivElement>(null);

  useEffect(() => {
    if (!currentUser) return;

    const q = query(collection(db, 'messages'), orderBy('createdAt', 'desc'), limit(50));
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const fetchedMessages: Message[] = [];
      querySnapshot.forEach((doc) => {
        fetchedMessages.push({ id: doc.id, ...doc.data() } as Message);
      });
      setMessages(fetchedMessages.reverse());

      // Fetch user data for new UIDs
      const uniqueUids = Array.from(new Set(fetchedMessages.map(m => m.uid)));
      uniqueUids.forEach(uid => {
        if (!usersData[uid]) {
          fetchUserData(uid);
        }
      });
    });

    return () => unsubscribe();
  }, [currentUser]);

  const fetchUserData = async (uid: string) => {
    const userRef = doc(db, 'users', uid);
    const unsubscribe = onSnapshot(userRef, (doc) => {
      if (doc.exists()) {
        setUsersData(prevData => ({
          ...prevData,
          [uid]: {
            displayName: doc.data().displayName || 'Anonymous',
            photoURL: doc.data().photoURL || 'https://api.dicebear.com/6.x/adventurer/svg?seed=Felix',
            email: doc.data().email
          }
        }));
      }
    });

    return unsubscribe;
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newMessage.trim() === '' || !currentUser) return;

    await addDoc(collection(db, 'messages'), {
      text: newMessage,
      createdAt: serverTimestamp(),
      uid: currentUser.uid
    });

    setNewMessage('');
  };

  const formatMessageDate = (timestamp: Timestamp | null) => {
    if (!timestamp) return '';
    return format(timestamp.toDate(), 'HH:mm');
  };

  const handleUserClick = (user: UserPreview) => {
    setPreviewUser(user);
  };

  const handleEmojiSelect = (emoji: any) => {
    setNewMessage(prevMessage => prevMessage + emoji.native);
    setShowEmojiPicker(false);
  };

  return (
    <div className="flex flex-col h-screen bg-gray-100">
      <Header />
      <div className="flex-grow overflow-hidden" ref={chatContainerRef}>
        <div className="h-full overflow-y-auto p-4 space-y-4">
          {messages.map((message) => {
            const userData = usersData[message.uid] || { displayName: 'Loading...', photoURL: 'https://api.dicebear.com/6.x/adventurer/svg?seed=Felix', email: '' };
            return (
              <div
                key={message.id}
                className={`flex ${
                  message.uid === currentUser?.uid ? 'justify-end' : 'justify-start'
                }`}
              >
                <div className={`flex items-end space-x-2 max-w-xs lg:max-w-md ${
                  message.uid === currentUser?.uid ? 'flex-row-reverse space-x-reverse' : 'flex-row'
                }`}>
                  <div className="relative">
                    <img
                      src={userData.photoURL}
                      alt={`${userData.displayName}'s avatar`}
                      className="w-8 h-8 rounded-full cursor-pointer"
                      onClick={() => handleUserClick({...userData, uid: message.uid})}
                    />
                    <div className="absolute bottom-0 right-0 w-2 h-2 rounded-full bg-green-500"></div>
                  </div>
                  <div
                    className={`px-4 py-2 rounded-lg ${
                      message.uid === currentUser?.uid
                        ? 'bg-indigo-500 text-white'
                        : 'bg-white text-gray-900'
                    }`}
                  >
                    <p className="font-semibold text-sm">
                      {message.uid === currentUser?.uid ? 'You' : userData.displayName}
                    </p>
                    <p className="mt-1">{message.text}</p>
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
      </div>
      <footer className="bg-white border-t border-gray-200 p-4">
        <form onSubmit={handleSubmit} className="max-w-4xl mx-auto flex items-center space-x-2">
          <div className="relative flex-grow">
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Type a message..."
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
          <button
            type="submit"
            className="bg-indigo-500 text-white px-4 py-2 rounded-md hover:bg-indigo-600 flex items-center"
          >
            <Send className="mr-2 h-4 w-4" />
            Send
          </button>
        </form>
        {showEmojiPicker && (
          <div className="absolute bottom-16 right-4">
            <Picker data={data} onEmojiSelect={handleEmojiSelect} />
          </div>
        )}
      </footer>
      {previewUser && (
        <UserProfilePreview
          displayName={previewUser.displayName}
          photoURL={previewUser.photoURL}
          email={previewUser.email}
          uid={previewUser.uid}
          onClose={() => setPreviewUser(null)}
        />
      )}
    </div>
  );
};

export default Chat;