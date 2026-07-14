'use client';

import * as React from 'react';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MobileSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  children: React.ReactNode;
}

export function MobileSheet({ open, onOpenChange, title, children }: MobileSheetProps) {
  const [isMobile, setIsMobile] = React.useState(false);

  React.useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        {/* Overlay */}
        <DialogPrimitive.Overlay
          className={cn(
            'fixed inset-0 z-50 bg-black/50',
            'data-[state=open]:animate-in data-[state=closed]:animate-out',
            'data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0'
          )}
        />

        {/* Contenu */}
        <DialogPrimitive.Content
          className={cn(
            'fixed z-50 bg-white shadow-lg',
            'data-[state=open]:animate-in data-[state=closed]:animate-out',
            isMobile
              ? [
                  'inset-x-0 bottom-0',
                  'rounded-t-2xl',
                  'max-h-[92vh] overflow-y-auto',
                  'data-[state=closed]:slide-out-to-bottom',
                  'data-[state=open]:slide-in-from-bottom',
                  'duration-300',
                ]
              : [
                  'left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2',
                  'w-full max-w-md rounded-lg',
                  'data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0',
                  'data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95',
                  'duration-200',
                ]
          )}
        >
          {/* Handle mobile (barre grise en haut) */}
          {isMobile && (
            <div className="flex justify-center pt-3 pb-1">
              <div className="w-10 h-1 rounded-full bg-gray-300" />
            </div>
          )}

          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
            <DialogPrimitive.Title className="text-lg font-semibold text-gray-900">
              {title}
            </DialogPrimitive.Title>
            <DialogPrimitive.Close className="rounded-md p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition">
              <X className="h-5 w-5" />
              <span className="sr-only">Fermer</span>
            </DialogPrimitive.Close>
          </div>

          {/* Body */}
          <div className="px-6 py-4 pb-8">
            {children}
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
          }
