import { useEffect, useState } from 'react';

/**
 * A clock that ticks so relative timestamps stay accurate.
 *
 * This is the only recurring timer in the application. It moves the clock, not
 * the data: no fixture is mutated and no event is invented on a tick.
 */
export function useNow(intervalMs = 5000): number {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const handle = window.setInterval(() => setNow(Date.now()), intervalMs);
    return () => window.clearInterval(handle);
  }, [intervalMs]);
  return now;
}
