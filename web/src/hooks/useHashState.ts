import { useState, useEffect, useCallback, useRef } from 'react';

function parseHash(): URLSearchParams {
  const hash = window.location.hash;
  return new URLSearchParams(hash.slice(1));
}

function writeHash(params: URLSearchParams): void {
  const hash = params.toString();
  const newUrl = hash ? `#${hash}` : window.location.pathname;
  history.pushState(null, '', newUrl);
}

export function useHashParam(
  key: string,
  defaultValue: string
): [string, (value: string) => void] {
  const isUpdatingRef = useRef(false);

  const [value, setValue] = useState<string>(() => {
    const params = parseHash();
    return params.get(key) ?? defaultValue;
  });

  useEffect(() => {
    const onHashChange = () => {
      if (isUpdatingRef.current) return;
      const params = parseHash();
      setValue(params.get(key) ?? defaultValue);
    };
    window.addEventListener('hashchange', onHashChange);
    window.addEventListener('popstate', onHashChange);
    return () => {
      window.removeEventListener('hashchange', onHashChange);
      window.removeEventListener('popstate', onHashChange);
    };
  }, [key, defaultValue]);

  const setHashValue = useCallback((newValue: string) => {
    setValue(newValue);
    isUpdatingRef.current = true;
    const params = parseHash();
    if (newValue === defaultValue) {
      params.delete(key);
    } else {
      params.set(key, newValue);
    }
    writeHash(params);
    queueMicrotask(() => { isUpdatingRef.current = false; });
  }, [key, defaultValue]);

  return [value, setHashValue];
}
