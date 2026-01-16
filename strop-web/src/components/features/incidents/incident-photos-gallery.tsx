"use client";

import { useState } from "react";
import NextImage from "next/image";
import { Maximize2, X, ChevronLeft, ChevronRight } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface IncidentPhoto {
  id: string;
  storage_path: string;
}

interface IncidentPhotosGalleryProps {
  photos: IncidentPhoto[];
}

export function IncidentPhotosGallery({ photos }: IncidentPhotosGalleryProps) {
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState<number | null>(
    null
  );

  if (!photos || photos.length === 0) {
    return (
      <p className="text-sm text-muted-foreground text-center py-8">
        No hay fotos adjuntas
      </p>
    );
  }

  const handleOpen = (index: number) => {
    setSelectedPhotoIndex(index);
  };

  const handleClose = () => {
    setSelectedPhotoIndex(null);
  };

  const handleNext = () => {
    if (selectedPhotoIndex === null) return;
    setSelectedPhotoIndex((prev) =>
      prev !== null && prev < photos.length - 1 ? prev + 1 : 0
    );
  };

  const handlePrev = () => {
    if (selectedPhotoIndex === null) return;
    setSelectedPhotoIndex((prev) =>
      prev !== null && prev > 0 ? prev - 1 : photos.length - 1
    );
  };

  const currentPhoto =
    selectedPhotoIndex !== null ? photos[selectedPhotoIndex] : null;

  return (
    <>
      {/* Grid Thumbnail View */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {photos.map((photo, index) => (
          <div
            key={photo.id}
            className="group relative aspect-video rounded-lg overflow-hidden bg-muted cursor-pointer ring-offset-background transition-all hover:ring-2 hover:ring-ring hover:ring-offset-2"
            onClick={() => handleOpen(index)}
          >
            <NextImage
              src={photo.storage_path}
              alt="Evidencia"
              fill
              className="object-cover transition-transform duration-300 group-hover:scale-105"
              sizes="(max-width: 768px) 50vw, 33vw"
            />
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
              <Maximize2 className="text-white h-8 w-8 drop-shadow-md" />
            </div>
          </div>
        ))}
      </div>

      {/* Full Screen Dialog */}
      <Dialog
        open={selectedPhotoIndex !== null}
        onOpenChange={(open) => !open && handleClose()}
      >
        <DialogContent className="max-w-4xl w-full h-[80vh] p-0 overflow-hidden bg-black border-none">
          <DialogHeader className="absolute top-4 right-4 z-50">
            {/* Close built-in or custom */}
          </DialogHeader>

          <div className="relative w-full h-full flex items-center justify-center bg-black">
            {currentPhoto && (
              <NextImage
                src={currentPhoto.storage_path}
                alt="Evidencia Full Screen"
                fill
                className="object-contain"
                priority
              />
            )}

            {/* Navigation Controls */}
            {photos.length > 1 && (
              <>
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-white/70 hover:text-white hover:bg-white/10 h-12 w-12 rounded-full"
                  onClick={(e) => {
                    e.stopPropagation();
                    handlePrev();
                  }}
                >
                  <ChevronLeft className="h-8 w-8" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-white/70 hover:text-white hover:bg-white/10 h-12 w-12 rounded-full"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleNext();
                  }}
                >
                  <ChevronRight className="h-8 w-8" />
                </Button>
              </>
            )}

            {/* Counter */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 px-3 py-1 bg-black/50 rounded-full text-white text-sm">
              {selectedPhotoIndex !== null ? selectedPhotoIndex + 1 : 0} /{" "}
              {photos.length}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
