'use client';

import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Download } from 'lucide-react';

export default function PhotoViewerModal() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  
  const photoUrlParam = searchParams?.get('photo');
  const photoUrl = photoUrlParam ? decodeURIComponent(photoUrlParam) : null;

  const handleClose = () => {
    if (!pathname) return;
    const params = new URLSearchParams(searchParams?.toString() ?? '');
    params.delete('photo');
    router.push(`${pathname}?${params.toString()}`, { scroll: false });
  };

  const handleDownload = async () => {
    if (!photoUrl) return;
    try {
      const response = await fetch(photoUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `pingly_photo_${Date.now()}.jpg`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Failed to download image:', err);
    }
  };

  return (
    <AnimatePresence>
      {photoUrl && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/95 backdrop-blur-xl">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="relative flex h-full w-full items-center justify-center p-4 sm:p-8"
          >
            {/* Toolbar */}
            <div className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between p-4 bg-gradient-to-b from-black/60 to-transparent">
              <button
                onClick={handleClose}
                className="flex h-10 w-10 items-center justify-center rounded-full bg-black/40 text-white transition-colors hover:bg-black/60"
              >
                <X className="h-5 w-5" />
              </button>
              <button
                onClick={handleDownload}
                className="flex h-10 w-10 items-center justify-center rounded-full bg-black/40 text-white transition-colors hover:bg-black/60"
              >
                <Download className="h-5 w-5" />
              </button>
            </div>

            {/* Image */}
            <div 
              className="relative flex h-full w-full items-center justify-center"
              onClick={handleClose}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={photoUrl}
                alt="Full screen photo"
                className="max-h-full max-w-full object-contain cursor-default"
                onClick={(e) => e.stopPropagation()}
              />
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
