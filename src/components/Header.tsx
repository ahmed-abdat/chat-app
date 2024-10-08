import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { signOut } from "firebase/auth";
import { auth, db } from "../firebase";
import { useAuth } from "../contexts/AuthContext";
import { MessageCircle, User, LogOut, ChevronDown } from "lucide-react";
import { doc, updateDoc, serverTimestamp } from "firebase/firestore";

const Header: React.FC = () => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  const updateUserStatus = async (status: 'online' | 'offline') => {
    if (currentUser) {
      const userRef = doc(db, 'users', currentUser.uid);
      await updateDoc(userRef, {
        online: status === 'online',
        lastSeen: serverTimestamp()
      });
    }
  };

  const handleSignOut = async () => {
    try {
      await updateUserStatus("offline");
      signOut(auth);
      navigate("/login");
    } catch (error) {
      console.error("Failed to sign out", error);
    }
  };

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (currentUser) {
        if (document.hidden) {
          updateUserStatus("offline");
          console.log("User went offline (visibility change)");
        } else {
          updateUserStatus("online");
          console.log("User came online (visibility change)");
        }
      }
    };

    const handleBeforeUnload = () => {
      if (currentUser) {
        updateUserStatus("offline");
        console.log("User went offline (before unload)");
      }
    };

    if (currentUser) {
      document.addEventListener("visibilitychange", handleVisibilityChange);
      window.addEventListener("beforeunload", handleBeforeUnload);

      // Set user as online when component mounts
      updateUserStatus("online");
      console.log("User set to online (component mount)");
    }

    return () => {
      if (currentUser) {
        document.removeEventListener(
          "visibilitychange",
          handleVisibilityChange
        );
        window.removeEventListener("beforeunload", handleBeforeUnload);
        updateUserStatus("offline");
        console.log("Component unmounting, user set to offline");
      }
    };
  }, [currentUser]);

  return (
    <header className="bg-indigo-600 text-white shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <MessageCircle className="h-8 w-8" />
            <h1 className="text-2xl font-bold">Chaty</h1>
          </div>
          <div className="relative">
            <button
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="flex items-center space-x-2 focus:outline-none"
            >
              <img
                src={
                  currentUser?.photoURL ||
                  "https://api.dicebear.com/6.x/adventurer/svg?seed=Felix"
                }
                alt="User avatar"
                className="w-10 h-10 rounded-full border-2 border-white"
              />
              <span className="hidden sm:inline-block font-medium">
                {currentUser?.displayName || "User"}
              </span>
              <ChevronDown className="h-4 w-4" />
            </button>
            {isDropdownOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-10">
                <button
                  onClick={() => {
                    navigate("/profile");
                    setIsDropdownOpen(false);
                  }}
                  className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left"
                >
                  <User className="inline-block mr-2 h-4 w-4" />
                  Manage Profile
                </button>
                <button
                  onClick={handleSignOut}
                  className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left"
                >
                  <LogOut className="inline-block mr-2 h-4 w-4" />
                  Sign Out
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
