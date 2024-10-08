import React, { useState, useRef, useEffect } from 'react';
import { X } from 'lucide-react';
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

interface ImageCarouselProps {
  images: Array<{ url: string; text: string }>;
  initialIndex: number;
  onClose: () => void;
}

const ImageCarousel: React.FC<ImageCarouselProps> = ({ images, initialIndex, onClose }) => {
  const [api, setApi] = useState<CarouselApi>();
  const carouselRef = useRef<HTMLDivElement>(null);

  React.useEffect(() => {
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

  return (
    <Dialog.Root open={true} onOpenChange={onClose}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black bg-opacity-75 z-50" />
        <Dialog.Content className="fixed inset-0 flex items-center justify-center z-50 p-4">
          <div ref={carouselRef} className="relative w-full max-w-4xl mx-auto bg-white rounded-lg shadow-lg overflow-hidden">
            <Dialog.Title className="sr-only">Image Carousel</Dialog.Title>
            <Carousel className="w-full" setApi={setApi}>
              <CarouselContent>
                {images.map((image, index) => (
                  <CarouselItem key={index}>
                    <div className="flex flex-col items-center justify-center h-[80vh]">
                      <img
                        src={image.url}
                        alt={`Image ${index + 1}`}
                        className="max-w-full max-h-[70vh] object-contain"
                      />
                      {image.text && (
                        <p className="mt-4 text-center text-gray-700 max-w-lg">
                          {image.text}
                        </p>
                      )}
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

export default ImageCarousel;