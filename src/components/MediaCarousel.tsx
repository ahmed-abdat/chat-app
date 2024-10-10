import React, { useState, useRef, useEffect } from 'react';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';
import * as Dialog from '@radix-ui/react-dialog';
import { cn } from '../lib/utils';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { type CarouselApi } from "@/components/ui/carousel";

interface MediaItem {
  url: string;
  text: string;
  type: 'image' | 'video';
  userName: string;
  userAvatar: string;
}

interface MediaCarouselProps {
  media: MediaItem[];
  initialIndex: number;
  onClose: () => void;
}

const MediaCarousel: React.FC<MediaCarouselProps> = ({ media, initialIndex, onClose }) => {
  const [api, setApi] = useState<CarouselApi>();
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const carouselRef = useRef<HTMLDivElement>(null);
  const videoRefs = useRef<(HTMLVideoElement | null)[]>([]);

  useEffect(() => {
    if (api) {
      api.scrollTo(initialIndex);
    }
  }, [api, initialIndex]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (carouselRef.current && !carouselRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [onClose]);

  useEffect(() => {
    if (api) {
      api.on("select", () => {
        const selectedIndex = api.selectedScrollSnap();
        setCurrentIndex(selectedIndex);
        
        // Stop all videos except the current one
        videoRefs.current.forEach((videoRef, index) => {
          if (videoRef && index !== selectedIndex) {
            videoRef.pause();
            videoRef.currentTime = 0;
          }
        });
      });
    }
  }, [api]);

  if (!media || media.length === 0) {
    return null;
  }

  return (
    <Dialog.Root open={true} onOpenChange={onClose}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black bg-opacity-75 z-50" />
        <Dialog.Content className="fixed inset-0 flex items-center justify-center z-50 p-4">
          <div ref={carouselRef} className="relative w-full max-w-3xl mx-auto bg-white rounded-lg shadow-lg overflow-hidden">
            <Carousel className="w-full" setApi={setApi}>
              <CarouselContent>
                {media.map((item, index) => (
                  <CarouselItem key={index}>
                    <div className="flex flex-col p-4">
                      <div className="flex justify-center items-center bg-gray-100 rounded-lg overflow-hidden" style={{ height: '60vh' }}>
                        {item.type === 'image' ? (
                          <img
                            src={item.url}
                            alt={`Image ${index + 1}`}
                            className="max-w-full max-h-full object-contain"
                          />
                        ) : (
                          <video
                            ref={el => videoRefs.current[index] = el}
                            src={item.url}
                            controls
                            className="max-w-full max-h-full object-contain"
                          >
                            Your browser does not support the video tag.
                          </video>
                        )}
                      </div>
                      <div className="mt-4">
                        <div className="flex items-center space-x-3">
                          <img src={item.userAvatar} alt={`${item.userName}'s avatar`} className="w-10 h-10 rounded-full object-cover" />
                          <span className="font-semibold text-gray-800">{item.userName}</span>
                        </div>
                        {item.text && (
                          <p className="text-gray-600 text-sm mt-2 break-words">
                            {item.text}
                          </p>
                        )}
                      </div>
                    </div>
                  </CarouselItem>
                ))}
              </CarouselContent>
              <CarouselPrevious className="absolute left-4 top-1/2 transform -translate-y-1/2" />
              <CarouselNext className="absolute right-4 top-1/2 transform -translate-y-1/2" />
            </Carousel>
            <Dialog.Close asChild>
              <button
                className={cn(
                  "absolute top-4 right-4 rounded-full bg-black bg-opacity-50 p-2 text-white hover:bg-opacity-75 focus:outline-none focus:ring-2 focus:ring-white",
                )}
              >
                <X className="h-6 w-6" />
                <span className="sr-only">Close</span>
              </button>
            </Dialog.Close>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
};

export default MediaCarousel;