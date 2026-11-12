import { useEffect, useState } from 'react';

/** True under the given breakpoint (640px = Tailwind's `sm`) — used to swap
 * chart tick density/angle so axis labels don't overlap on phone-width screens. */
export function useIsNarrow(breakpoint = 640) {
  const [isNarrow, setIsNarrow] = useState(
    () => typeof window !== 'undefined' && window.innerWidth < breakpoint,
  );

  useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${breakpoint - 1}px)`);
    const onChange = (e) => setIsNarrow(e.matches);
    onChange(mql);
    mql.addEventListener('change', onChange);
    return () => mql.removeEventListener('change', onChange);
  }, [breakpoint]);

  return isNarrow;
}
