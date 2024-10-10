import React, { useState, useEffect, useRef, useCallback } from "react";
import { collection, query, orderBy, limit, onSnapshot, addDoc, serverTimestamp, getDoc, doc } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { db, storage } from "../firebase";
import { useAuth } from "../contexts/AuthContext";
import { ChevronDown } from "lucide-react";
import UserProfilePreview from "./UserProfilePreview";
import MediaCarousel from "./MediaCarousel";
import MultiMediaPreview from "./MultiMediaPreview";
import { Message, UserData, MediaItem, ChatMediaItem } from "../types/chat";
import MessageList from "./MessageList";
import ChatInput from "./ChatInput";

const Chat: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [previewUser, setPreviewUser] = useState<UserData | null>(null);
  const [usersData, setUsersData] = useState<{ [uid: string]: UserData }>({});
  const { currentUser } = useAuth();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const [isSending, setIsSending] = useState(false);
  const [carouselIndex, setCarouselIndex] = useState(0);
  const [showCarousel, setShowCarousel] = useState(false);
  const [isAtBottom, setIsAtBottom] = useState(true);
  const [selectedMedia, setSelectedMedia] = useState<MediaItem[]>([]);
  const [showMultiMediaPreview, setShowMultiMediaPreview] = useState(false);
  const [carouselMedia, setCarouselMedia] = useState<ChatMediaItem[]>([]);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  const fetchUserData = async (uid: string): Promise<UserData | null> => {
    if (usersData[uid]) return usersData[uid];
    
    try {
      const userDoc = await getDoc(doc(db, "users", uid));
      if (userDoc.exists()) {
        const userData = userDoc.data() as UserData;
        setUsersData(prev => ({ ...prev, [uid]: userData }));
        return userData;
      }
    } catch (error) {
      console.error("Error fetching user data:", error);
    }
    return null;
  };

  useEffect(() => {
    if (!currentUser) return;

    const q = query(collection(db, "messages"), orderBy("createdAt", "desc"), limit(50));
    const unsubscribe = onSnapshot(q, async (querySnapshot) => {
      const fetchedMessages: Message[] = [];
      const mediaItems: ChatMediaItem[] = [];
      const userPromises: Promise<void>[] = [];

      for (const doc of querySnapshot.docs) {
        const message = { id: doc.id, ...doc.data() } as Message;
        fetchedMessages.push(message);
        if (message.mediaUrl) {
          const userData = await fetchUserData(message.uid);
          mediaItems.push({
            url: message.mediaUrl,
            text: message.text || "",
            type: message.mediaType || "image",
            userName: userData?.displayName || "Unknown User",
            userAvatar: userData?.photoURL || "https://via.placeholder.com/40",
          });
        }
        
        if (!usersData[message.uid]) {
          userPromises.push(fetchUserData(message.uid).then());
        }
      }

      await Promise.all(userPromises);

      setMessages(fetchedMessages.reverse());
      setCarouselMedia(mediaItems.reverse());
      scrollToBottom();
    });

    return () => unsubscribe();
  }, [currentUser, scrollToBottom]);

  useEffect(() => {
    const chatContainer = chatContainerRef.current;
    if (!chatContainer) return;

    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = chatContainer;
      setIsAtBottom(scrollHeight - scrollTop - clientHeight < 1);
    };

    chatContainer.addEventListener("scroll", handleScroll);
    return () => chatContainer.removeEventListener("scroll", handleScroll);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newMessage.trim() === "" || !currentUser || isSending) return;

    setIsSending(true);
    try {
      await addDoc(collection(db, "messages"), {
        text: newMessage.trim(),
        createdAt: serverTimestamp(),
        uid: currentUser.uid,
      });
      setNewMessage("");
      scrollToBottom();
    } catch (error) {
      console.error("Error sending message:", error);
    } finally {
      setIsSending(false);
    }
  };

  const handleMediaChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newMediaItems: MediaItem[] = Array.from(e.target.files).map((file, index) => ({
        file,
        preview: URL.createObjectURL(file),
        type: file.type.startsWith("image/") ? "image" : "video",
        url: URL.createObjectURL(file),
        text: index === 0 ? newMessage : "",
        userName: currentUser?.displayName || "Unknown User",
        userAvatar: currentUser?.photoURL || "https://via.placeholder.com/40",
      }));
      setSelectedMedia((prev) => [...prev, ...newMediaItems]);
      setShowMultiMediaPreview(true);
      setNewMessage(""); // Clear the input after setting the text to the first media item
    }
  };

  const handleSendMedia = async (updatedMediaItems: MediaItem[]) => {
    if (updatedMediaItems.length === 0 || !currentUser || isSending) return;

    setIsSending(true);
    try {
      for (const mediaItem of updatedMediaItems) {
        const mediaRef = ref(storage, `chat-media/${Date.now()}-${mediaItem.file.name}`);
        await uploadBytes(mediaRef, mediaItem.file);
        const mediaUrl = await getDownloadURL(mediaRef);

        await addDoc(collection(db, "messages"), {
          text: mediaItem.text,
          createdAt: serverTimestamp(),
          uid: currentUser.uid,
          mediaUrl: mediaUrl,
          mediaType: mediaItem.type,
        });
      }
      setSelectedMedia([]);
      setShowMultiMediaPreview(false);
      scrollToBottom();
    } catch (error) {
      console.error("Error sending media:", error);
    } finally {
      setIsSending(false);
    }
  };

  const handleMediaClick = (mediaUrl: string) => {
    const index = carouselMedia.findIndex((item) => item.url === mediaUrl);
    if (index !== -1) {
      setCarouselIndex(index);
      setShowCarousel(true);
    }
  };

  const handleAddMore = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleMediaChange(e);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-64px)] bg-gray-100">
      <div className="flex-grow overflow-y-auto relative" ref={chatContainerRef}>
        <MessageList
          messages={messages}
          currentUser={currentUser}
          handleUserClick={setPreviewUser}
          handleMediaClick={handleMediaClick}
          messagesEndRef={messagesEndRef}
          usersData={usersData}
        />
        {!isAtBottom && (
          <button
            onClick={scrollToBottom}
            className="absolute bottom-4 right-4 bg-indigo-500 text-white rounded-full p-2 shadow-lg hover:bg-indigo-600 transition-colors"
          >
            <ChevronDown size={24} />
          </button>
        )}
      </div>
      <ChatInput
        newMessage={newMessage}
        setNewMessage={setNewMessage}
        handleSubmit={handleSubmit}
        handleMediaChange={handleMediaChange}
        isSending={isSending}
      />
      {previewUser && (
        <UserProfilePreview
          {...previewUser}
          lastSeen={typeof previewUser.lastSeen === 'string' ? null : previewUser.lastSeen}
          onClose={() => setPreviewUser(null)}
        />
      )}
      {showCarousel && (
        <MediaCarousel
          media={carouselMedia}
          initialIndex={carouselIndex}
          onClose={() => setShowCarousel(false)}
        />
      )}
      {showMultiMediaPreview && (
        <MultiMediaPreview
          mediaItems={selectedMedia}
          onClose={() => {
            setSelectedMedia([]);
            setShowMultiMediaPreview(false);
          }}
          onSend={handleSendMedia}
          onRemoveItem={(index) => {
            setSelectedMedia((prev) => prev.filter((_, i) => i !== index));
          }}
          onAddMore={handleAddMore}
          isSending={isSending}
        />
      )}
    </div>
  );
};

export default Chat;