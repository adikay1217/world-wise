import { useEffect, useState } from 'react';

const BREAKPOINT_PX = 700;

export function useIsMobile() {
  const [isMobile, setIsMobile] = useState(
    () => typeof window !== 'undefined' && window.matchMedia(`(max-width: ${BREAKPOINT_PX}px)`).matches
  );

  useEffect(() => {
    const mq = window.matchMedia(`(max-width: ${BREAKPOINT_PX}px)`);
    const update = (e) => setIsMobile(e.matches);
    mq.addEventListener('change', update);
    return () => mq.removeEventListener('change', update);
  }, []);

  return isMobile;
}
