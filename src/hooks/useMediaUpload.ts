import { useCallback } from 'react';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '../firebase';

export const useMediaUpload = () => {
  const uploadMedia = useCallback(async (file: File) => {
    const mediaRef = ref(storage, `chat-media/${Date.now()}-${file.name}`);
    await uploadBytes(mediaRef, file);
    return getDownloadURL(mediaRef);
  }, []);

  return { uploadMedia };
};