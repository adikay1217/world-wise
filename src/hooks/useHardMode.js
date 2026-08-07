import { useEffect, useState } from 'react';

const KEY = 'globle_hard_mode';

export function useHardMode() {
  const [hardMode, setHardMode] = useState(() => {
    try {
      return localStorage.getItem(KEY) === '1';
    } catch {
      return false;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(KEY, hardMode ? '1' : '0');
    } catch {
      // storage unavailable — preference just won't persist across reloads
    }
  }, [hardMode]);

  return [hardMode, setHardMode];
}
