import { useEffect, useState } from 'react';

const MAX_SCALE = 1.25;
const VIEWPORT_MARGIN = 24;

export function useFitScale(width, height) {
  const [scale, setScale] = useState(1);

  useEffect(() => {
    function update() {
      const availW = window.innerWidth - VIEWPORT_MARGIN * 2;
      const availH = window.innerHeight - VIEWPORT_MARGIN * 2;
      setScale(Math.min(availW / width, availH / height, MAX_SCALE));
    }
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, [width, height]);

  return scale;
}
