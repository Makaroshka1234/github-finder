'use client';

import { useEffect, useState } from 'react';

/**
 * Дебаунсить саме *значення*, а не виклик.
 *
 * Для TanStack це ідіоматичніше за debounce навколо фетчера: затримане значення
 * йде в queryKey, тож зміна ключа сама запускає запит — не потрібен ані
 * useEffect-тригер, ані ref з debounced-функцією, ані .cancel() у клінапі.
 */
export function useDebouncedValue<T>(value: T, delayMs: number): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(timer);
  }, [value, delayMs]);

  return debounced;
}
