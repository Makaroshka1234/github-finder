# 📋 План рефакторингу GitHub Finder

## 🎯 Огляд

Цей документ містить рекомендації щодо декомпозиції компонентів та винесення функцій для покращення читабельності, тестабельності та maintainability коду.

---

## 1️⃣ ДЕКОМПОЗИЦІЯ КОМПОНЕНТІВ

### 📦 ResultCard.tsx → 3 компоненти

**Поточна проблема:**
- Файл `/app/components/Cards/ResultCard.tsx` містить два різні UI для Repository та User
- Логіка прихована в IIFE паттернах (строки 23-56 та 61-105)
- Складно тестувати і розвивати незалежно

**Пропозиція:**

```
app/components/Cards/
├── RepositoryCard.tsx (новий) - Repository rendering
├── UserCard.tsx (новий) - User rendering
├── ResultCard.tsx (переписаний) - Slim wrapper
└── index.ts
```

**ResultCard.tsx (новий, спрощений):**
```tsx
export function ResultCard({ item }: ResultCardProps) {
  if (isRepository(item)) {
    return <RepositoryCard repository={item} />;
  }
  return <UserCard user={item} />;
}
```

**RepositoryCard.tsx (новий):**
- Виділити UI репозиторію (аватар, назва, опис, stars, forks, language)
- Вхідні props: `repository: Repository`

**UserCard.tsx (новий):**
- Виділити UI користувача (аватар, логін, біо, локація, repos, followers)
- Вхідні props: `user: User`

**Переваги:**
✅ Кожен компонент має одну відповідальність
✅ Легше тестувати
✅可獨立розвивати стилі та логіку
✅ Можна переиспользувати окремо

---

### 📄 page.tsx → 4 компоненти

**Поточна проблема:**
- `app/page.tsx` змішує header, footer, input section та результати (96 рядків)
- Сложно читати логіку сторінки
- Невозможно переиспользувати header/footer на інших сторінках

**Пропозиція:**

```
app/components/Layout/
├── Header.tsx (новий)
├── Footer.tsx (новий)
├── SearchSection.tsx (новий)
└── index.ts
```

**Header.tsx:**
```tsx
export function Header() {
  return (
    <header className="bg-white shadow-sm sticky top-0 z-10">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex items-center justify-center gap-4 mb-2">
          
          <h1 className="text-3xl font-bold text-gray-900">🔍 GitHub Search</h1>
        </div>
        <p className="text-center text-gray-600">Find repositories and users on GitHub</p>
      </div>
    </header>
  );
}
```

**SearchSection.tsx:**
```tsx
export function SearchSection() {
  return (
    <div className="bg-white p-6 rounded-lg shadow-sm">
      <div className="flex flex-col md:flex-row gap-4 items-start md:items-end">
        <div className="flex-1 w-full">
          <SearchBar />
        </div>
        <div className="w-full md:w-auto">
          <TypeSelector />
        </div>
      </div>
    </div>
  );
}
```

**Footer.tsx:**
```tsx
export function Footer() {
  return (
    <footer className="bg-white border-t border-gray-200 mt-12">
      <div className="max-w-7xl mx-auto px-4 py-6 text-center text-sm text-gray-600">
        <p>Powered by GitHub API | Built with Next.js & React</p>
      </div>
    </footer>
  );
}
```

**page.tsx (спрощений):**
```tsx
export default function Home() {
  const query = useSearchStore((state) => state.query);
  // ... інші selectors
  
  const showInputOnly = query.trim().length < 3;

  return (
    <div className="min-h-screen bg-linear-to-br from-gray-50 to-gray-100 flex flex-col">
      <Header />
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 py-12">
        {showInputOnly ? (
          <div className="flex items-center justify-center min-h-[60vh]">
            <div className="w-full max-w-2xl">
              <SearchSection />
            </div>
          </div>
        ) : (
          <div className="space-y-8">
            <SearchSection />
            <ResultsGrid {...props} />
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
```

**Переваги:**
✅ page.tsx зменшується з 96 на ~35 рядків
✅ Header/Footer можна переиспользувати
✅ Легко змінювати layout без зміни логіки

---

### 🎨 ResultsGrid.tsx → 5 компонентів

**Поточна проблема:**
- Компонент обробляє: grid, infinite scroll, 3 типи UI стану, та результати
- 97 рядків змішаної логіки
- IntersectionObserver логіка не переиспользувана

**Пропозиція:**

```
app/components/Results/
├── ResultsGrid.tsx (переписаний - обгортка)
├── ResultsHeader.tsx (новий)
├── ResultsError.tsx (новий)
├── ResultsEmpty.tsx (новий)
└── index.ts
```

**ResultsError.tsx:**
```tsx
interface ResultsErrorProps {
  error: string;
}

export function ResultsError({ error }: ResultsErrorProps) {
  return (
    <div className="p-8 text-center">
      <h2 className="text-2xl font-bold text-red-600 mb-2">❌ Error</h2>
      <p className="text-gray-600">{error}</p>
    </div>
  );
}
```

**ResultsEmpty.tsx:**
```tsx
interface ResultsEmptyProps {
  searchType: SearchType;
}

export function ResultsEmpty({ searchType }: ResultsEmptyProps) {
  return (
    <div className="p-8 text-center">
      <h2 className="text-2xl font-bold text-gray-700 mb-2">
        No {searchType === 'repo' ? 'repositories' : 'users'} found
      </h2>
      <p className="text-gray-500">Try a different search query</p>
    </div>
  );
}
```

**ResultsHeader.tsx:**
```tsx
interface ResultsHeaderProps {
  totalCount: number;
}

export function ResultsHeader({ totalCount }: ResultsHeaderProps) {
  return (
    <div className="mb-6">
      <p className="text-gray-600">
        Found <span className="font-semibold">{totalCount.toLocaleString()}</span>{' '}
        result{totalCount !== 1 ? 's' : ''}
      </p>
    </div>
  );
}
```

**ResultsGrid.tsx (спрощений):**
```tsx
export function ResultsGrid({
  allResults,
  isLoading,
  isLoadingMore,
  error,
  searchType,
  query,
  totalCount,
  currentPage,
  loadMore,
}: ResultsGridProps) {
  const observerTarget = useRef<HTMLDivElement>(null);
  
  useInfiniteScroll({
    targetRef: observerTarget,
    isLoading: isLoadingMore,
    hasMore: totalCount > allResults.length,
    onLoad: () => loadMore(query, searchType, currentPage + 1),
  });

  if (isLoading) return <LoadingSkeletons />;
  if (error) return <ResultsError error={error} />;
  if (query.trim().length < 3) return null;
  if (allResults.length === 0) return <ResultsEmpty searchType={searchType} />;

  return (
    <div>
      <ResultsHeader totalCount={totalCount} />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {allResults.map((item) => (
          <div key={item.id}>
            <ResultCard item={item} />
          </div>
        ))}
      </div>
      {isLoadingMore && <LoadingSkeletons />}
      <div ref={observerTarget} />
    </div>
  );
}
```

**Переваги:**
✅ Grid фокусується тільки на layout
✅ Кожен стан має свій компонент
✅ Легко тестувати UI стани окремо

---

## 2️⃣ ФУНКЦІЇ ДЛЯ ВИНЕСЕННЯ

### 🪝 useInfiniteScroll() - новий hook

**Поточна проблема:**
- IntersectionObserver логіка в ResultsGrid (строки 33-47)
- Не переиспользувана
- Важко тестувати

**Локація:** `app/hooks/useInfiniteScroll.ts`

```tsx
interface UseInfiniteScrollOptions {
  targetRef: React.RefObject<HTMLDivElement>;
  isLoading: boolean;
  hasMore: boolean;
  onLoad: () => void;
}

export function useInfiniteScroll({
  targetRef,
  isLoading,
  hasMore,
  onLoad,
}: UseInfiniteScrollOptions) {
  useEffect(() => {
    if (!targetRef.current || isLoading || !hasMore) return;

    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        onLoad();
      }
    });

    observer.observe(targetRef.current);
    return () => observer.disconnect();
  }, [isLoading, hasMore, onLoad, targetRef]);
}
```

**Використання:**
```tsx
const observerTarget = useRef<HTMLDivElement>(null);

useInfiniteScroll({
  targetRef: observerTarget,
  isLoading: isLoadingMore,
  hasMore: totalCount > allResults.length,
  onLoad: () => loadMore(query, searchType, currentPage + 1),
});
```

---

### 🔄 performSearch() - декомпозиція

**Поточна проблема:**
- 59-рядкова функція в `app/hooks/useSearch.ts`
- Змішує логіку initial та paginated пошуків
- Важко читати error handling

**Пропозиція:** Розділити на helper функції

```tsx
// lib/search-helpers.ts

export function isInitialSearch(page: number): boolean {
  return page === 1;
}

export function handleSearchSuccess(
  data: SearchResponse,
  page: number,
  setters: {
    setResults: (r: any[]) => void;
    setAllResults: (r: any[]) => void;
    appendResults: (r: any[]) => void;
    setCurrentPage: (p: number) => void;
    setTotalCount: (t: number) => void;
  }
) {
  const isInitial = isInitialSearch(page);
  
  if (isInitial) {
    setters.setResults(data.items || []);
    setters.setAllResults(data.items || []);
    setters.setCurrentPage(1);
  } else {
    setters.appendResults(data.items || []);
    setters.setCurrentPage(page);
  }
  
  setters.setTotalCount(data.total_count || 0);
}

export function handleSearchError(
  error: string,
  page: number,
  setters: {
    setResults: (r: any[]) => void;
    setAllResults: (r: any[]) => void;
    setError: (e: string | null) => void;
    setTotalCount: (t: number) => void;
  }
) {
  const isInitial = isInitialSearch(page);
  
  setters.setError(error);
  if (isInitial) {
    setters.setResults([]);
    setters.setAllResults([]);
  }
  setters.setTotalCount(0);
}
```

**Використання в useSearch.ts:**
```tsx
const handleSearchSuccess = (data, page) => {
  handleSearchSuccess(data, page, { setResults, setAllResults, appendResults, ... });
};

const handleSearchError = (error, page) => {
  handleSearchError(error, page, { setResults, setAllResults, setError, ... });
};
```

---

### 🌐 enrichUserData() - винесення логіки

**Поточна проблема:**
- `lib/github.ts` (строки 56-87) містить Promise.all з fetch всередині
- Заголовки дублюються (строки 39-40 vs 65-67)
- Велика функція без helper'ів

**Пропозиція:**

```tsx
// lib/github-helpers.ts

const GITHUB_HEADERS = {
  Authorization: `Bearer ${GITHUB_TOKEN}`,
  Accept: 'application/vnd.github.v3+json',
};

export async function fetchUserDetails(login: string): Promise<any> {
  try {
    const response = await fetch(`${GITHUB_API_BASE}/users/${login}`, {
      method: 'GET',
      headers: GITHUB_HEADERS,
    });
    
    if (!response.ok) return null;
    
    const fullUser = await response.json();
    return {
      public_repos: fullUser.public_repos,
      followers: fullUser.followers,
      bio: fullUser.bio,
      location: fullUser.location,
    };
  } catch (error) {
    console.error(`Failed to fetch user details for ${login}:`, error);
    return null;
  }
}

export async function enrichUsersData(users: any[]): Promise<any[]> {
  const enrichedItems = await Promise.all(
    users.map(async (user) => {
      const details = await fetchUserDetails(user.login);
      return details ? { ...user, ...details } : user;
    })
  );
  return enrichedItems;
}
```

**Використання в github.ts:**
```tsx
if (type === 'user' && data.items.length > 0) {
  data.items = await enrichUsersData(data.items);
}
```

---

### ✅ validateSearchInput() - винесення валідації

**Поточна проблема:**
- Валідація вбудована в route handler (строки 17-31)
- Не переиспользувана
- Важко тестувати

**Локація:** `lib/validation.ts`

```tsx
export interface ValidationResult {
  ok: boolean;
  error?: { message: string; status: number };
}

export function validateSearchRequest(body: any): ValidationResult {
  const { query, type, page = 1 } = body;

  if (typeof query !== 'string' || query.trim().length < 3) {
    return {
      ok: false,
      error: {
        message: 'Query must be a string with at least 3 characters',
        status: 400,
      },
    };
  }

  if (type !== 'user' && type !== 'repo') {
    return {
      ok: false,
      error: {
        message: "Type must be 'user' or 'repo'",
        status: 400,
      },
    };
  }

  if (!Number.isInteger(page) || page < 1) {
    return {
      ok: false,
      error: {
        message: 'Page must be a positive integer',
        status: 400,
      },
    };
  }

  return { ok: true };
}
```

**Використання в route.ts:**
```tsx
const validation = validateSearchRequest(body);
if (!validation.ok) {
  return NextResponse.json({ error: validation.error.message }, { status: validation.error.status });
}
```

---

## 3️⃣ КОНСТАНТИ ДЛЯ ЦЕНТРАЛІЗАЦІЇ

### 📁 app/constants/config.ts

```ts
// Search & API Configuration
export const SEARCH_CONFIG = {
  RESULTS_PER_PAGE: 9,
  DEBOUNCE_MS: 500,
  MIN_QUERY_LENGTH: 3,
  CACHE_TTL_SECONDS: 7200, // 2 hours
  GITHUB_API_BASE: 'https://api.github.com',
} as const;

export const LOADING_STATES = {
  SKELETON_COUNT: 3,
} as const;
```

**Використання:**
```tsx
// Замість: per_page: '9'
url.searchParams.set('per_page', String(SEARCH_CONFIG.RESULTS_PER_PAGE));

// Замість: debounce(performSearch, 500)
const debouncedSearchRef = useRef(debounce(performSearch, SEARCH_CONFIG.DEBOUNCE_MS));

// Замість: query.trim().length < 3
if (query.trim().length < SEARCH_CONFIG.MIN_QUERY_LENGTH) {
```

---

### 📁 app/constants/ui.ts

```ts
export const EMOJIS = {
  SEARCH: '🔍',
  STAR: '⭐',
  FORK: '🍴',
  LOCATION: '📍',
  SAVE: '💾',
  ERROR: '❌',
} as const;

export const GRID_LAYOUT = 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4';

export const CARD_STYLES = {
  BASE: 'block p-4 border border-gray-200 rounded-lg hover:shadow-lg hover:border-blue-300 transition-all duration-200',
  USER: 'block p-6 border border-gray-200 rounded-lg text-center hover:shadow-lg hover:border-blue-300 transition-all duration-200',
} as const;

export const UI_MESSAGES = {
  NO_RESULTS: (type: 'user' | 'repo') => 
    `No ${type === 'repo' ? 'repositories' : 'users'} found`,
  TRY_AGAIN: 'Try a different search query',
  ERROR_TITLE: 'Error',
  POWERED_BY: 'Powered by GitHub API | Built with Next.js & React',
} as const;

export const TEXT_COLORS = {
  GRAY_600: 'text-gray-600',
  GRAY_700: 'text-gray-700',
  GRAY_900: 'text-gray-900',
  RED_600: 'text-red-600',
} as const;
```

**Використання:**
```tsx
// Замість: <span>⭐ {count}</span>
<span>{EMOJIS.STAR} {count}</span>

// Замість: className="grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
<div className={GRID_LAYOUT}>

// Замість: No {type} found
<h2>{UI_MESSAGES.NO_RESULTS(searchType)}</h2>
```

---

## 4️⃣ ПОКРАЩЕННЯ ТИПІЗАЦІЇ

### ❌ Замінити `any[]` на `SearchResult[]`

**Файли для змін:**

1. **app/types/search.ts**
```ts
- results: any[] → results: SearchResult[]
- items: any[] → items: SearchResult[]
```

2. **app/components/Results/ResultsGrid.tsx**
```ts
- allResults: any[] → allResults: SearchResult[]
```

3. **app/api/search/route.ts**
```ts
- items: any[] → items: SearchResult[]
```

4. **lib/github.ts**
```ts
- data.items.map(async (user: any) => ...) 
  → data.items.map(async (user: Repository | User) => ...)
```

---

## 📊 ПРІОРИТЕТ РЕФАКТОРИНГУ

### 🔴 Критичні (зробити першим)

1. **ResultCard → 3 компоненти** (45 хв)
   - Окремі RepositoryCard та UserCard
   - Очистити логіку
   
2. **Централізувати константи** (30 хв)
   - Створити `app/constants/`
   - Замінити magic strings

3. **Заміна `any[]` на `SearchResult[]`** (30 хв)
   - TypeScript type safety
   - IDE intellisense

### 🟡 Важливі (зробити другим)

4. **page.tsx → 4 компоненти** (60 хв)
   - Header, Footer, SearchSection
   - Спрощення page.tsx

5. **ResultsGrid → 5 компонентів** (45 хв)
   - ResultsError, ResultsEmpty, ResultsHeader
   - Винесення IntersectionObserver

### 🟢 Nice-to-have (зробити останнім)

6. **useInfiniteScroll() hook** (30 хв)
7. **performSearch() декомпозиція** (30 хв)
8. **enrichUserData() винесення** (20 хв)
9. **validateSearchInput() винесення** (20 хв)

---

## ✅ КОНТРОЛЬНИЙ СПИСОК

- [ ] Видалити ResultCard, створити RepositoryCard + UserCard
- [ ] Створити Header, Footer, SearchSection компоненти
- [ ] Створити ResultsError, ResultsEmpty, ResultsHeader компоненти
- [ ] Винести IntersectionObserver логіку в useInfiniteScroll()
- [ ] Створити app/constants/config.ts та ui.ts
- [ ] Замінити всі `any[]` на `SearchResult[]`
- [ ] Винести validateSearchRequest() в lib/validation.ts
- [ ] Винести fetchUserDetails() в lib/github-helpers.ts
- [ ] Розділити performSearch() на helper функції
- [ ] Оновити всі import paths
- [ ] Тестування перед deployment

---

## 📝 Примітки

- Всі зміни повинні бути backward-compatible
- Запустити `npx tsc --noEmit` після кожної групи змін
- Переконатися що всі tests проходять (якщо є)
- Переглянути на `npm run dev` перед push'ом
