import React, {
  useState,
  useEffect,
  useRef,
  useLayoutEffect,
  useCallback,
} from "react";
import {
  collection,
  query,
  orderBy,
  limit,
  onSnapshot,
  addDoc,
  serverTimestamp,
  Timestamp,
  doc,
} from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { db, storage } from "../firebase";
import { useAuth } from "../contexts/AuthContext";
import { format } from "date-fns";
import {
  Send,
  Smile,
  Image as ImageIcon,
  Loader,
  ChevronDown,
} from "lucide-react";
import UserProfilePreview from "./UserProfilePreview";
import ImageCarousel from "./ImageCarousel";
import data from "@emoji-mart/data";
import Picker from "@emoji-mart/react";

interface Message {
  id: string;
  text: string;
  createdAt: Timestamp | null;
  uid: string;
  imageUrl?: string;
}

interface UserData {
  displayName: string;
  photoURL: string;
  email: string;
  online: boolean;
  lastSeen: string;
}

interface UserPreview extends UserData {
  uid: string;
}

const Chat: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [previewUser, setPreviewUser] = useState<UserPreview | null>(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [usersData, setUsersData] = useState<{ [uid: string]: UserData }>({});
  const { currentUser } = useAuth();
  const messagesEndRef = useRef<null | HTMLDivElement>(null);
  const chatContainerRef = useRef<null | HTMLDivElement>(null);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageCaption, setImageCaption] = useState("");
  const [fullScreenPreview, setFullScreenPreview] = useState(false);
  const [_, setEmojiPickerPosition] = useState<"bottom" | "top">("bottom");
  const [isSending, setIsSending] = useState(false);
  const [carouselImages, setCarouselImages] = useState<
    Array<{ url: string; text: string }>
  >([]);
  const [carouselIndex, setCarouselIndex] = useState(0);
  const [showCarousel, setShowCarousel] = useState(false);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [isAtBottom, setIsAtBottom] = useState(true);
  const lastMessageRef = useRef<HTMLDivElement>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);

  useEffect(() => {
    if (!currentUser) return;

    const q = query(
      collection(db, "messages"),
      orderBy("createdAt", "desc"),
      limit(50)
    );
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const fetchedMessages: Message[] = [];
      const imageUrls: Array<{ url: string; text: string }> = [];
      querySnapshot.forEach((doc) => {
        const message = { id: doc.id, ...doc.data() } as Message;
        fetchedMessages.push(message);
        if (message.imageUrl) {
          imageUrls.push({ url: message.imageUrl, text: message.text });
        }
      });
      setMessages(fetchedMessages.reverse());
      setCarouselImages(imageUrls.reverse());

      // Scroll to bottom when new messages are received
      scrollToBottom();

      // Fetch user data for new UIDs
      const uniqueUids = Array.from(new Set(fetchedMessages.map((m) => m.uid)));
      uniqueUids.forEach((uid) => {
        if (!usersData[uid]) {
          fetchUserData(uid);
        }
      });
    });

    return () => unsubscribe();
  }, [currentUser]);

  // Use useLayoutEffect to scroll after the DOM has been updated
  useLayoutEffect(() => {
    if (messages.length > 0) {
      scrollToBottom();
    }
  }, [messages]);

  // Additional useEffect to handle initial load and refresh
  useEffect(() => {
    if (isInitialLoad && messages.length > 0) {
      scrollToBottom("auto");
      setIsInitialLoad(false);
    }
  }, [isInitialLoad, messages]);

  const scrollToBottom = useCallback((behavior: ScrollBehavior = "smooth") => {
    messagesEndRef.current?.scrollIntoView({ behavior });
  }, []);

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

  useEffect(() => {
    if (!lastMessageRef.current) return;

    observerRef.current = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && isAtBottom) {
          scrollToBottom();
        }
      },
      { threshold: 0.5 }
    );

    observerRef.current.observe(lastMessageRef.current);

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [messages, isAtBottom, scrollToBottom]);

  const fetchUserData = async (uid: string) => {
    const userRef = doc(db, "users", uid);
    const unsubscribe = onSnapshot(userRef, (doc) => {
      if (doc.exists()) {
        const userData = doc.data();
        setUsersData((prevData) => ({
          ...prevData,
          [uid]: {
            displayName: userData.displayName || "Anonymous",
            photoURL:
              userData.photoURL ||
              "https://api.dicebear.com/6.x/adventurer/svg?seed=Felix",
            email: userData.email,
            online: userData.online || false,
            lastSeen: userData.lastSeen || null, // Ensure lastSeen is captured
          },
        }));
      }
    });

    return unsubscribe;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (
      (newMessage.trim() === "" && !selectedImage) ||
      !currentUser ||
      isSending
    )
      return;

    setIsSending(true);

    try {
      let imageUrl = "";
      if (selectedImage) {
        const imageRef = ref(
          storage,
          `chat-images/${Date.now()}-${selectedImage.name}`
        );
        await uploadBytes(imageRef, selectedImage);
        imageUrl = await getDownloadURL(imageRef);
      }

      await addDoc(collection(db, "messages"), {
        text: imageUrl ? imageCaption : newMessage,
        createdAt: serverTimestamp(),
        uid: currentUser.uid,
        imageUrl: imageUrl || null,
      });

      setNewMessage("");
      setSelectedImage(null);
      setImagePreview(null);
      setImageCaption("");
      setFullScreenPreview(false);

      // Scroll to bottom after sending a new message
      scrollToBottom();
    } catch (error) {
      console.error("Error sending message:", error);
      // Optionally, show an error message to the user
    } finally {
      setIsSending(false);
    }
  };

  const formatMessageDate = (timestamp: Timestamp | null) => {
    if (!timestamp) return "";
    return format(timestamp.toDate(), "HH:mm");
  };

  const handleUserClick = (user: UserPreview) => {
    setPreviewUser({
      ...user,
      lastSeen: user.lastSeen || usersData[user.uid].lastSeen,
    });
  };

  const handleEmojiButtonClick = (position: "bottom" | "top") => {
    setShowEmojiPicker(!showEmojiPicker);
    setEmojiPickerPosition(position);
  };

  const handleEmojiSelect = (emoji: any) => {
    if (fullScreenPreview) {
      setImageCaption((prevCaption) => prevCaption + emoji.native);
    } else {
      setNewMessage((prevMessage) => prevMessage + emoji.native);
    }
    setShowEmojiPicker(false);
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
        setImageCaption(newMessage); // Set the current message as the image caption
        setNewMessage(""); // Clear the message input
        setFullScreenPreview(true);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveImage = () => {
    setSelectedImage(null);
    setImagePreview(null);
    setImageCaption("");
    setFullScreenPreview(false);
  };

  const handleSendImage = async () => {
    if (!selectedImage || !currentUser || isSending) return;

    setIsSending(true);

    try {
      const imageRef = ref(
        storage,
        `chat-images/${Date.now()}-${selectedImage.name}`
      );
      await uploadBytes(imageRef, selectedImage);
      const imageUrl = await getDownloadURL(imageRef);

      await addDoc(collection(db, "messages"), {
        text: imageCaption,
        createdAt: serverTimestamp(),
        uid: currentUser.uid,
        imageUrl: imageUrl,
      });

      setSelectedImage(null);
      setImagePreview(null);
      setImageCaption("");
      setFullScreenPreview(false);

      // Scroll to bottom after sending a new image
      scrollToBottom();
    } catch (error) {
      console.error("Error sending image:", error);
      // Optionally, show an error message to the user
    } finally {
      setIsSending(false);
    }
  };

  const handleImageClick = (imageUrl: string) => {
    const index = carouselImages.findIndex((img) => img.url === imageUrl);
    if (index !== -1) {
      setCarouselIndex(index);
      setShowCarousel(true);
    }
  };

  const handleScrollToBottomClick = () => {
    scrollToBottom();
  };

  return (
    <div className="flex flex-col h-screen bg-gray-100">
      <div
        className="flex-grow overflow-hidden relative"
        ref={chatContainerRef}
      >
        <div className="h-full overflow-y-auto p-4 space-y-4">
          {messages.map((message, index) => {
            const userData = usersData[message.uid] || {
              displayName: "Loading...",
              photoURL:
                "https://api.dicebear.com/6.x/adventurer/svg?seed=Felix",
              email: "",
              online: false,
              lastSeen: null,
            };
            return (
              <div
                key={message.id}
                ref={index === messages.length - 1 ? lastMessageRef : null}
                className={`flex ${
                  message.uid === currentUser?.uid
                    ? "justify-end"
                    : "justify-start"
                }`}
              >
                <div
                  className={`flex items-end space-x-2 max-w-xs lg:max-w-md ${
                    message.uid === currentUser?.uid
                      ? "flex-row-reverse space-x-reverse"
                      : "flex-row"
                  }`}
                >
                  <div className="relative flex-shrink-0">
                    <img
                      src={userData.photoURL}
                      alt={`${userData.displayName}'s avatar`}
                      className="w-8 h-8 rounded-full object-cover cursor-pointer"
                      onClick={() =>
                        handleUserClick({ ...userData, uid: message.uid })
                      }
                    />
                    {userData.online && (
                      <div className="absolute bottom-0 right-0 w-2 h-2 rounded-full bg-green-500 border-2 border-white"></div>
                    )}
                  </div>
                  <div
                    className={`px-4 py-2 rounded-lg ${
                      message.uid === currentUser?.uid
                        ? "bg-indigo-500 text-white"
                        : "bg-white text-gray-900"
                    }`}
                  >
                    <p className="font-semibold text-sm">
                      {message.uid === currentUser?.uid
                        ? "You"
                        : userData.displayName}
                    </p>
                    {message.imageUrl && (
                      <img
                        src={message.imageUrl}
                        alt="Shared image"
                        className="mt-2 max-w-full h-auto rounded-lg cursor-pointer"
                        onClick={() => handleImageClick(message.imageUrl!)}
                      />
                    )}
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
        {!isAtBottom && (
          <button
            onClick={handleScrollToBottomClick}
            className="absolute bottom-4 right-4 bg-indigo-500 text-white rounded-full p-2 shadow-lg hover:bg-indigo-600 transition-colors"
          >
            <ChevronDown size={24} />
          </button>
        )}
      </div>
      <footer className="bg-white border-t border-gray-200 p-4">
        <form
          onSubmit={handleSubmit}
          className="max-w-4xl mx-auto flex items-center space-x-2"
        >
          <div className="relative flex-grow">
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Type a message..."
              className="w-full p-2 pr-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              disabled={isSending}
            />
            <button
              type="button"
              onClick={() => handleEmojiButtonClick("bottom")}
              className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              disabled={isSending}
            >
              <Smile className="h-5 w-5" />
            </button>
          </div>
          <label
            className={`cursor-pointer ${
              isSending ? "opacity-50 cursor-not-allowed" : ""
            }`}
          >
            <input
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              className="hidden"
              disabled={isSending}
            />
            <ImageIcon className="h-6 w-6 text-gray-400 hover:text-gray-600" />
          </label>
          <button
            type="submit"
            className="bg-indigo-500 text-white px-4 py-2 rounded-md hover:bg-indigo-600 flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={isSending}
          >
            {isSending ? (
              <Loader className="animate-spin h-5 w-5 mr-2" />
            ) : (
              <Send className="mr-2 h-4 w-4" />
            )}
            Send
          </button>
        </form>
        {showEmojiPicker && !fullScreenPreview && (
          <div className="absolute bottom-16 right-4 z-50">
            <Picker data={data} onEmojiSelect={handleEmojiSelect} />
          </div>
        )}
      </footer>
      {fullScreenPreview && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-4 max-w-2xl w-full relative">
            <img
              src={imagePreview || ""}
              alt="Selected image preview"
              className="max-w-full max-h-[60vh] mx-auto rounded-lg"
            />
            <div className="mt-4">
              <div className="relative">
                <input
                  type="text"
                  value={imageCaption}
                  onChange={(e) => setImageCaption(e.target.value)}
                  placeholder="Add a caption..."
                  className="w-full p-2 pr-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  disabled={isSending}
                />
                <button
                  type="button"
                  onClick={() => handleEmojiButtonClick("top")}
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  disabled={isSending}
                >
                  <Smile className="h-5 w-5" />
                </button>
              </div>
              <div className="flex justify-end mt-4 space-x-2">
                <button
                  onClick={handleRemoveImage}
                  className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={isSending}
                >
                  Cancel
                </button>
                <button
                  onClick={handleSendImage}
                  className="px-4 py-2 bg-indigo-500 text-white rounded-md hover:bg-indigo-600 flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={isSending}
                >
                  {isSending ? (
                    <Loader className="animate-spin h-5 w-5 mr-2" />
                  ) : (
                    <Send className="mr-2 h-4 w-4" />
                  )}
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
      )}
      {previewUser && (
        <UserProfilePreview
          displayName={previewUser.displayName}
          isOnline={previewUser.online}
          photoURL={previewUser.photoURL}
          email={previewUser.email}
          uid={previewUser.uid}
          onClose={() => setPreviewUser(null)}
          lastSeen={previewUser.lastSeen}
        />
      )}
      {showCarousel && (
        <ImageCarousel
          images={carouselImages}
          initialIndex={carouselIndex}
          onClose={() => setShowCarousel(false)}
        />
      )}
    </div>
  );
};

export default Chat;
