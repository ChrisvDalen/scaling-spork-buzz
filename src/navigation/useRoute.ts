import { useCallback, useEffect, useState } from 'react';
import { parseHash, toHash, type Route } from './routes';

export function useRoute(): {
  route: Route;
  navigate: (route: Route) => void;
} {
  const [route, setRoute] = useState<Route>(() => parseHash(window.location.hash));

  useEffect(() => {
    const onHashChange = () => setRoute(parseHash(window.location.hash));
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  const navigate = useCallback((next: Route) => {
    const hash = toHash(next);
    if (window.location.hash === hash) {
      setRoute(next);
      return;
    }
    window.location.hash = hash;
  }, []);

  return { route, navigate };
}
