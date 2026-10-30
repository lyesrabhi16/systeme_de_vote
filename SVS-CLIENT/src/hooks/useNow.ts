import { useEffect, useState } from 'react';

/** The current time, refreshed every `ms` (so that a countdown moves, and an election opens or closes on the page). */
export const useNow = (ms = 30000): Date => {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), ms);
    return () => clearInterval(id);
  }, [ms]);
  return now;
};
