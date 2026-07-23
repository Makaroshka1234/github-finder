import { QueryClient } from '@tanstack/react-query';

// На сервері: нов QueryClient для кожного запиту (немає утечок даних між users)
// На клієнті: один QueryClient для всієї сесії браузера
let browserQueryClient: QueryClient | undefined;

function makeBrowserQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 60 * 1000,     // 1 хв — дані застарівають
        gcTime: 10 * 60 * 1000,   // 10 хв — очищуються з памʼяті
      },
    },
  });
}

export function getQueryClient() {
  if (typeof window === 'undefined') {
    // Server: нов інстанс кожен раз
    return new QueryClient({
      defaultOptions: {
        queries: {
          staleTime: 0,   // на сервері миттєво застарівають
          gcTime: 0,      // не зберігаємо в памʼяті
        },
      },
    });
  }
  // Browser: lazy singleton
  if (!browserQueryClient) {
    browserQueryClient = makeBrowserQueryClient();
  }
  return browserQueryClient;
}
