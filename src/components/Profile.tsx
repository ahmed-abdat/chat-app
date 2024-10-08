import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { updateProfile } from 'firebase/auth';
import { doc, updateDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import {  db, storage } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import { ArrowLeft, Save, Upload, Loader } from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';

const avatarOptions = [
  'https://api.dicebear.com/6.x/adventurer/svg?seed=Felix',
  'https://api.dicebear.com/6.x/adventurer/svg?seed=Aneka',
  'https://api.dicebear.com/6.x/adventurer/svg?seed=Milo',
  'https://api.dicebear.com/6.x/adventurer/svg?seed=Zoe',
  'https://api.dicebear.com/6.x/adventurer/svg?seed=Alex',
];

const Profile: React.FC = () => {
  const { currentUser } = useAuth();
  const [displayName, setDisplayName] = useState(currentUser?.displayName || '');
  const [avatarUrl, setAvatarUrl] = useState(currentUser?.photoURL || avatarOptions[0]);
  const [customAvatar, setCustomAvatar] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (currentUser?.displayName) {
      setDisplayName(currentUser.displayName);
    }
    if (currentUser?.photoURL) {
      setAvatarUrl(currentUser.photoURL);
    }
  }, [currentUser]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;

    setLoading(true);
    const toastId = toast.loading('Updating profile...');

    try {
      let photoURL = avatarUrl;

      if (customAvatar) {
        const fileRef = ref(storage, `avatars/${currentUser.uid}`);
        await uploadBytes(fileRef, customAvatar);
        photoURL = await getDownloadURL(fileRef);
      }

      await updateProfile(currentUser, { displayName, photoURL });
      await updateDoc(doc(db, 'users', currentUser.uid), { 
        displayName,
        photoURL
      });

      toast.success('Profile updated successfully', { id: toastId });
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('Failed to update profile', { id: toastId });
    } finally {
      setLoading(false);
    }
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setCustomAvatar(e.target.files[0]);
      setAvatarUrl(URL.createObjectURL(e.target.files[0]));
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 py-6 flex flex-col justify-center sm:py-12">
      <div className="relative py-3 sm:max-w-xl sm:mx-auto">
        <div className="absolute inset-0 bg-gradient-to-r from-indigo-300 to-indigo-600 shadow-lg transform -skew-y-6 sm:skew-y-0 sm:-rotate-6 sm:rounded-3xl"></div>
        <div className="relative px-4 py-10 bg-white shadow-lg sm:rounded-3xl sm:p-20">
          <div className="max-w-md mx-auto">
            <div>
              <h1 className="text-2xl font-semibold">Profile</h1>
            </div>
            <form onSubmit={handleSubmit} className="divide-y divide-gray-200">
              <div className="py-8 text-base leading-6 space-y-4 text-gray-700 sm:text-lg sm:leading-7">
                <div className="relative">
                  <input
                    id="displayName"
                    name="displayName"
                    type="text"
                    className="peer placeholder-transparent h-10 w-full border-b-2 border-gray-300 text-gray-900 focus:outline-none focus:border-indigo-600"
                    placeholder="Display Name"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    disabled={loading}
                  />
                  <label htmlFor="displayName" className="absolute left-0 -top-3.5 text-gray-600 text-sm peer-placeholder-shown:text-base peer-placeholder-shown:text-gray-440 peer-placeholder-shown:top-2 transition-all peer-focus:-top-3.5 peer-focus:text-gray-600 peer-focus:text-sm">
                    Display Name
                  </label>
                </div>
                <div className="relative">
                  <p className="text-sm text-gray-500">Email: {currentUser?.email}</p>
                </div>
                <div className="relative">
                  <p className="text-sm text-gray-500 mb-2">Avatar:</p>
                  <div className="flex flex-wrap gap-2 mb-4">
                    {avatarOptions.map((avatar, index) => (
                      <img
                        key={index}
                        src={avatar}
                        alt={`Avatar option ${index + 1}`}
                        className={`w-12 h-12 rounded-full cursor-pointer ${avatarUrl === avatar ? 'ring-2 ring-indigo-500' : ''}`}
                        onClick={() => setAvatarUrl(avatar)}
                      />
                    ))}
                  </div>
                  <div className="flex items-center space-x-4">
                    <img src={avatarUrl} alt="Selected avatar" className="w-16 h-16 rounded-full" />
                    <label htmlFor="avatar-upload" className="cursor-pointer bg-indigo-500 text-white px-4 py-2 rounded-md hover:bg-indigo-600 flex items-center">
                      <Upload className="mr-2 h-4 w-4" />
                      Upload Custom Avatar
                      <input
                        id="avatar-upload"
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleAvatarChange}
                        disabled={loading}
                      />
                    </label>
                  </div>
                </div>
              </div>
              <div className="pt-4 flex items-center space-x-4">
                <button
                  type="button"
                  onClick={() => navigate('/')}
                  className="bg-gray-300 flex justify-center items-center w-full text-gray-700 px-4 py-3 rounded-md focus:outline-none hover:bg-gray-400 disabled:opacity-50"
                  disabled={loading}
                >
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back to Chat
                </button>
                <button
                  type="submit"
                  className="bg-indigo-500 flex justify-center items-center w-full text-white px-4 py-3 rounded-md focus:outline-none hover:bg-indigo-600 disabled:opacity-50"
                  disabled={loading}
                >
                  {loading ? (
                    <Loader className="animate-spin h-5 w-5 mr-2" />
                  ) : (
                    <Save className="mr-2 h-4 w-4" />
                  )}
                  {loading ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
      <Toaster position="bottom-center" />
    </div>
  );
};

export default Profile;