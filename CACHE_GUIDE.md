# 🚀 Керівництво з роботи з кешем в GitHub Finder

## Що таке кеш?

Кеш — це механізм, що **зберігає результати пошуку**, щоб не звертатися до GitHub API кожного разу.

### Результат:
- ⚡ **Швидше**: повтор пошуку повертає результат миттєво
- 💰 **Дешевше**: менше запитів до GitHub API (обмеження 60 запитів/год без токена)
- 🌐 **Офлайн**: можливо працювати без інтернету, якщо результат вже в кеші

---

## Архітектура кеша

```
┌─────────────────┐
│   User Input    │
│  "React" + repo │
└────────┬────────┘
         │
         ↓
┌─────────────────────────┐
│  app/api/search/route.ts│  ← POST запит від клієнта
└────────┬────────────────┘
         │
         ↓ (page === 1?)
    ┌────────────────────────────────────────┐
    │  Перевіряємо кеш (Redis)               │
    │  Ключ: "gh:repo:react"                 │
    └────────────┬─────────────────────────┘
                 │
         ╔═══════╩═══════╗
         │               │
    ┌────▼────┐     ┌────▼─────┐
    │   HIT   │     │   MISS    │
    │ (є)     │     │ (немає)   │
    │ return  │     │ запит до  │
    │ cached  │     │ GitHub API│
    └────┬────┘     └────┬──────┘
         │               │
         │          ┌────▼─────────────┐
         │          │ Зберігаємо в кеш │
         │          │ (7200 сек = 2 год)│
         │          └────┬─────────────┘
         │               │
         └───────┬───────┘
                 ↓
        ┌────────────────┐
        │  Клієнту відп. │
        │ + header:      │
        │ x-cache: HIT   │
        │ або x-cache:   │
        │    MISS        │
        └────────────────┘
```

---

## Файли, що працюють з кешем

### 1️⃣ **`lib/redis.ts`** — Клієнт Redis (Upstash)

```typescript
// Підключення до Redis (Upstash — хмарний Redis)
export const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});
```

#### Функції:

**`getCacheKey(query, type)`**
```typescript
// Формує унікальний ключ для кеша
getCacheKey('react', 'repo') 
// → "gh:repo:react"
```
- **Чому нижній регістр?** Щоб "React" і "react" були однаковим кешем

**`getCache<T>(query, type)`**
```typescript
// Отримує дані з кеша (або null, якщо немає)
const cached = await getCache<SearchResponse>('react', 'repo');
// → { items: [...], total_count: 100 } або null
```
- **Безпечна**: якщо помилка — повертає `null`, не крашить

**`setCache(query, type, data, ttl)`**
```typescript
// Зберігає дані в кеш на TTL секунд
await setCache('react', 'repo', { items: [...], total_count: 100 }, 7200);
```
- **TTL** = Time To Live (час життя)
- За замовчуванням: **7200 сек = 2 години**
- Після 2 годин записи автоматично видаляються

**`clearAllCache()`**
```typescript
// Очищає ВСІ дані з кеша
await redis.flushdb();
```
- Використовується в `DELETE /api/clear-cache`

---

### 2️⃣ **`app/api/search/route.ts`** — Логіка кешування

```typescript
// Цей код виконується на сервері при POST /api/search
```

**Алгоритм:**

```typescript
// Крок 1: Перевірка, чи це пошук першої сторінки
if (cacheKey) {  // cacheKey існує тільки якщо page === 1
  const cached = await getCache<SearchResponse>(query, type);
  
  if (cached) {  // ЗНАЙШЛИ В КЕШІ ✅
    return cached;  // Повертаємо миттєво + header 'x-cache: HIT'
  }
}

// Крок 2: НЕМАЄ В КЕШІ — запитуємо GitHub
const results = await searchGitHub(query, type, page);

// Крок 3: Зберігаємо результат (тільки для page 1)
if (cacheKey) {
  await setCache(query, type, results);
}

return results;  // + header 'x-cache: MISS'
```

**Чому кешуємо тільки page === 1?**

```
✅ page 1 (перший пошук) → кешуємо
   Причина: результати завжди однакові при тому ж запиті

❌ page 2, 3, ... (infinite scroll) → НЕ кешуємо
   Причина: результати залежать від offset, складно кешувати
```

---

### 3️⃣ **`app/api/clear-cache/route.ts`** — Очистка кеша

```typescript
// DELETE /api/clear-cache
// Видаляє ВСІ записи з Redis
export async function DELETE(request: NextRequest) {
  await clearAllCache();  // → redis.flushdb()
  return { success: true };
}
```

**Коли викликати?**
- Після оновлення GitHub бази даних
- Якщо результати стали неактуальні
- Для тестування

---

## Конфігурація

### **`app/constants/config.ts`**

```typescript
CACHE_TTL_SECONDS: 7200  // 2 години
```

Якщо хочеш змінити час кешування:
```typescript
// Коротше (30 хвилин)
CACHE_TTL_SECONDS: 1800

// Довше (24 години)
CACHE_TTL_SECONDS: 86400
```

---

## Як це працює на практиці

### 📋 Сценарій 1: Перший пошук "React"

```
Клієнт → POST /api/search { query: "React", type: "repo", page: 1 }
                              ↓
                    Кеш перевірка: НЕМАЄ
                              ↓
                    GitHub API запит → 30 результатів
                              ↓
                    Зберігаємо в Redis (ключ: "gh:repo:react")
                              ↓
Клієнт ← { items: [...], total_count: 100 }
         + header 'x-cache: MISS'
```

**Час відповіді:** ~300ms (залежить від GitHub API)

---

### 📋 Сценарій 2: Повторний пошук "React" (протягом 2 годин)

```
Клієнт → POST /api/search { query: "React", type: "repo", page: 1 }
                              ↓
                    Кеш перевірка: ЗНАЙШЛИ! ✅
                              ↓
                    Одразу повертаємо з Redis
                              ↓
Клієнт ← { items: [...], total_count: 100 }
         + header 'x-cache: HIT'
```

**Час відповіді:** ~50ms (миттєво з Redis)

---

### 📋 Сценарій 3: Infinite Scroll (page 2+)

```
Клієнт → POST /api/search { query: "React", type: "repo", page: 2 }
                              ↓
                    page !== 1, тому НЕ перевіряємо кеш
                              ↓
                    GitHub API запит → наступні 30 результатів
                              ↓
                    НЕ зберігаємо в Redis (тільки page 1)
                              ↓
Клієнт ← { items: [...], total_count: 100 }
         + header 'x-cache: SKIP'
```

---

## Налаштування Upstash Redis

### Переменні окруження (`.env.local`)

```bash
UPSTASH_REDIS_REST_URL=https://xxx-xxx-xxx.upstash.io
UPSTASH_REDIS_REST_TOKEN=AAAp...xxx...
```

### Отримати ці значення:

1. Перейти на [upstash.com](https://upstash.com)
2. Логін / Реєстрація
3. Create Database → Redis
4. Скопіювати **REST URL** та **REST Token**
5. Вставити в `.env.local`

**⚠️ Важливо:** Ніколи не комітити `.env.local` в Git!

---

## Моніторинг кеша

### Логи в консолі

```
// MISS — запит до GitHub
Cache MISS for "React" (repo)

// HIT — повернув з Redis
Cache HIT for "React" (repo)

// SKIP — infinite scroll, не кешуємо
Cache SKIP for "React" (repo) page 2
```

### Перевірити дані в Redis

```bash
# В Upstash Dashboard:
# Insights → Commands → переглянути ключі
# Приклад: "gh:repo:react"
```

---

## Проблеми і Рішення

### 🔴 Problem: Результати застарілі (>2 години)

**Рішення:**
```bash
# Очистити кеш
curl -X DELETE http://localhost:3000/api/clear-cache
```

### 🔴 Problem: Кеш занадто великий

**Рішення:** Зменшити TTL в `config.ts`
```typescript
CACHE_TTL_SECONDS: 1800  // 30 хвилин замість 2 годин
```

### 🔴 Problem: Redis помилка ("Connection failed")

**Рішення:**
1. Перевірити `.env.local` (URL та Token правильні?)
2. Перевірити інтернет
3. Перевірити Upstash статус (upstash.com)

---

## Шпаргалка

| Операція | Ключ | TTL | Кешується? |
|---|---|---|---|
| Пошук repo, page 1 | `gh:repo:react` | 7200s | ✅ Так |
| Пошук user, page 1 | `gh:user:john` | 7200s | ✅ Так |
| Infinite scroll, page 2+ | — | — | ❌ Ні |
| Очистка кеша | DELETE /api/clear-cache | — | — |

---

## Чому Upstash, а не локальний Redis?

| Параметр | Upstash | Локальний Redis |
|---|---|---|
| Setup | 1 хвилина (REST API) | Потрібна база на сервері |
| Масштабування | Автоматичне | Вручну |
| Ціна | Free tier: 10k команд/день | Власний сервер |
| Доступ | З будь-якого місця | Тільки локально |
| Надійність | ✅ 99.99% uptime | Залежить від тебе |

---

## Що далі?

- 📊 Додати метрики (скільки HIT/MISS)
- 🔄 Реалізувати cache invalidation (очистка при виборі іншого типу)
- 🎯 Додати support для інших параметрів пошуку (language, stars, тощо)
