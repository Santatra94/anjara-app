'use client';

import { useEffect, useState } from 'react';
import { AlertTriangle } from 'lucide-react';

interface IdleWarningModalProps {
  open: boolean;
  warningMs: number;
  onStay: () => void;
  onLogout: () => void;
}

export function IdleWarningModal({
  open,
  warningMs,
  onStay,
  onLogout,
}: IdleWarningModalProps) {
  const [secondsLeft, setSecondsLeft] = useState(Math.floor(warningMs / 1000));

  useEffect(() => {
    if (!open) {
      setSecondsLeft(Math.floor(warningMs / 1000));
      return;
    }

    const interval = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [open, warningMs]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl">
        <div className="flex flex-col items-center text-center">
          <div className="w-16 h-16 rounded-full bg-amber-100 flex items-center justify-center mb-4">
            <AlertTriangle className="h-8 w-8 text-amber-600" />
          </div>

          <h2 className="text-xl font-bold text-gray-900 mb-2">
            Session bientot expiree
          </h2>

          <p className="text-sm text-gray-600 mb-4">
            Vous serez deconnecte pour inactivite dans
          </p>

          <div className="text-5xl font-bold text-amber-600 mb-6">
            {secondsLeft}s
          </div>

          <div className="flex flex-col sm:flex-row gap-3 w-full">
            <button
              onClick={onLogout}
              className="flex-1 px-4 py-3 rounded-lg border border-gray-300 text-gray-700 font-medium hover:bg-gray-50 transition-colors"
            >
              Se deconnecter
            </button>
            <button
              onClick={onStay}
              className="flex-1 px-4 py-3 rounded-lg bg-blue-600 text-white font-bold hover:bg-blue-700 transition-colors"
            >
              Rester connecte
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
