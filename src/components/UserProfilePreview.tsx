import { X } from 'lucide-react';
import { format } from 'date-fns';

interface UserProfilePreviewProps {
  displayName: string;
  lastSeen: { seconds: number; nanoseconds: number } | null;
  online: boolean;
  photoURL: string;
  email: string;
  uid: string;
  onClose: () => void;
}

const UserProfilePreview: React.FC<UserProfilePreviewProps> = ({ 
  displayName, 
  lastSeen, 
  online, 
  photoURL, 
  email, 
  onClose 
}) => {
  const formatLastSeen = (lastSeen: { seconds: number; nanoseconds: number } | null): string => {
    if (!lastSeen) {
      return "Unknown";
    }
    const date = new Date(lastSeen.seconds * 1000);
    return format(date, "MMMM d, yyyy 'at' HH:mm:ss");
  };

  const formattedLastSeen = formatLastSeen(lastSeen);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-white rounded-lg p-6 max-w-sm w-full" onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold">User Profile</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X size={24} />
          </button>
        </div>
        <div className="flex flex-col items-center">
          <div className="relative">
            <img src={photoURL} alt={`${displayName}'s avatar`} className="w-24 h-24 rounded-full mb-4" />
            <div className={`absolute bottom-0 right-0 w-4 h-4 rounded-full ${online ? 'bg-green-500' : 'bg-gray-500'}`}></div>
          </div>
          <h3 className="text-xl font-semibold mb-2">{displayName}</h3>
          <p className="text-gray-600">{email}</p>
          <p className={`mt-2 ${online ? 'text-green-500' : 'text-gray-500'}`}>
            Status: {online ? "Online" : "Offline"}
          </p>
          <p className="text-gray-600 mt-2">Last seen: {formattedLastSeen}</p>
        </div>
      </div>
    </div>
  );
};

export default UserProfilePreview;