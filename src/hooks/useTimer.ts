"use client";

import { useState, useEffect, useCallback, useRef } from "react";

interface UseTimerOptions {
  initialSeconds?: number;
  isRunning?: boolean;
  onTick?: (seconds: number) => void;
}

interface UseTimerResult {
  seconds: number;
  isRunning: boolean;
  formattedTime: string;
  start: () => void;
  pause: () => void;
  reset: () => void;
  setSeconds: (seconds: number) => void;
  setIsRunning: (isRunning: boolean) => void;
}

export function useTimer({
  initialSeconds = 0,
  isRunning: initialIsRunning = false,
  onTick,
}: UseTimerOptions = {}): UseTimerResult {
  const [seconds, setSeconds] = useState(initialSeconds);
  const [isRunning, setIsRunning] = useState(initialIsRunning);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const onTickRef = useRef(onTick);

  // Update ref when onTick changes
  useEffect(() => {
    onTickRef.current = onTick;
  }, [onTick]);

  // Timer interval
  useEffect(() => {
    if (isRunning) {
      intervalRef.current = setInterval(() => {
        setSeconds((prev) => {
          const newValue = prev + 1;
          onTickRef.current?.(newValue);
          return newValue;
        });
      }, 1000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isRunning]);

  // Update state when props change
  useEffect(() => {
    setSeconds(initialSeconds);
  }, [initialSeconds]);

  useEffect(() => {
    setIsRunning(initialIsRunning);
  }, [initialIsRunning]);

  const start = useCallback(() => {
    setIsRunning(true);
  }, []);

  const pause = useCallback(() => {
    setIsRunning(false);
  }, []);

  const reset = useCallback(() => {
    setIsRunning(false);
    setSeconds(0);
  }, []);

  // Format time as HH:MM:SS or MM:SS
  const formattedTime = (() => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
    }
    return `${minutes.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  })();

  return {
    seconds,
    isRunning,
    formattedTime,
    start,
    pause,
    reset,
    setSeconds,
    setIsRunning,
  };
}
