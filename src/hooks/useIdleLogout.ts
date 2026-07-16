'use client';

import { useEffect, useRef, useState, useCallback } from 'react';

interface UseIdleLogoutOptions {
  timeoutMs: number;
  warningMs: number;
  onWarning: () => void;
  onLogout: () => void;
  enabled: boolean;
}

/**
 * Hook qui detecte l'inactivite utilisateur et declenche
 * un warning puis une deconnexion automatique.
 *
 * Evenements consideres comme activite :
 * - mousedown, mousemove, keypress, scroll, touchstart, click
 */
export function useIdleLogout({
  timeoutMs,
  warningMs,
  onWarning,
  onLogout,
  enabled,
}: UseIdleLogoutOptions) {
  const [isWarning, setIsWarning] = useState(false);
  const warningTimerRef = useRef<NodeJS.Timeout | null>(null);
  const logoutTimerRef = useRef<NodeJS.Timeout | null>(null);

  const clearTimers = useCallback(() => {
    if (warningTimerRef.current) {
      clearTimeout(warningTimerRef.current);
      warningTimerRef.current = null;
    }
    if (logoutTimerRef.current) {
      clearTimeout(logoutTimerRef.current);
      logoutTimerRef.current = null;
    }
  }, []);

  const resetTimers = useCallback(() => {
    clearTimers();
    setIsWarning(false);

    // Timer pour le warning
    warningTimerRef.current = setTimeout(() => {
      setIsWarning(true);
      onWarning();
    }, timeoutMs - warningMs);

    // Timer pour la deconnexion
    logoutTimerRef.current = setTimeout(() => {
      setIsWarning(false);
      onLogout();
    }, timeoutMs);
  }, [timeoutMs, warningMs, onWarning, onLogout, clearTimers]);

  useEffect(() => {
    if (!enabled) {
      clearTimers();
      setIsWarning(false);
      return;
    }

    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];

    const handleActivity = () => {
      // Si on est en mode warning, ne pas reset automatiquement
      // L'utilisateur doit cliquer sur "Rester connecte"
      if (!isWarning) {
        resetTimers();
      }
    };

    events.forEach((event) => {
      window.addEventListener(event, handleActivity, { passive: true });
    });

    // Demarrer les timers
    resetTimers();

    return () => {
      events.forEach((event) => {
        window.removeEventListener(event, handleActivity);
      });
      clearTimers();
    };
  }, [enabled, isWarning, resetTimers, clearTimers]);

  const stayConnected = useCallback(() => {
    setIsWarning(false);
    resetTimers();
  }, [resetTimers]);

  return { isWarning, stayConnected };
}
