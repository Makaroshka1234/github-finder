'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export interface BackNavigation {
  label: string;
  onClick?: () => void;
  href?: string;
}

const DEFAULT_NAVIGATION: BackNavigation = { label: 'Back to search', href: '/' };

/**
 * Повертає інформацію про навігацію назад: динамічний текст, і механізм
 * (router.back() або Link).
 *
 * Джерело переходу читається з query-параметра `?from=`, який картка сама
 * дописує у своє посилання (див. CardLayout.tsx) — усвідомлено, а не вгадано.
 * document.referrer тут не годиться: <Link> робить клієнтську навігацію
 * через History API без реального завантаження документа, тож браузер
 * ніколи не оновлює referrer для внутрішніх переходів.
 *
 * useEffect, а не useMemo з `typeof window` усередині: useMemo рахує значення
 * синхронно під час рендеру, включно з першим клієнтським рендером у процесі
 * гідратації — на клієнті window вже існує, тож компонент одразу видав би
 * інший результат, ніж те, що SSR встиг покласти в HTML (hydration mismatch,
 * рівно той антипатерн "typeof window !== 'undefined'" з офіційного попередження
 * Next.js). useEffect запускається лише після монтування, вже після звірки
 * з SSR-розміткою, тож перший рендер завжди повертає DEFAULT_NAVIGATION.
 *
 * Метод:
 * - ?from=favorites → router.back() (зберігає скрол та стан улюблених)
 * - ?from=search → router.back() (зберігає скрол і підвантажені сторінки пошуку)
 * - параметра немає (прямий заход, F5, вставлений лінк) → <Link href="/"> (фолбек)
 */
export function useBackNavigation(): BackNavigation {
  const router = useRouter();
  // pathname у deps: гарантує перерахунок для кожної нової detail-сторінки
  const pathname = usePathname();
  const [state, setState] = useState<BackNavigation>(DEFAULT_NAVIGATION);

  useEffect(() => {
    const from = new URLSearchParams(window.location.search).get('from');

    /* eslint-disable react-hooks/set-state-in-effect -- навмисно: `from` доступний
       лише на клієнті, це стандартний no-mismatch патерн гідратації (SSR рендерить
       DEFAULT_NAVIGATION, ефект підміняє стан вже після звірки з розміткою) */
    if (from === 'favorites') {
      setState({ label: 'Back to favorites', onClick: () => router.back() });
    } else if (from === 'search') {
      setState({ label: 'Back to search', onClick: () => router.back() });
    } else {
      // Немає `from` — сторінку відкрито не з нашої картки, історії могло й не бути
      setState(DEFAULT_NAVIGATION);
    }
    /* eslint-enable react-hooks/set-state-in-effect */
  }, [router, pathname]);

  return state;
}
