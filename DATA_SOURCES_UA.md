# 📚 Джерела даних: GitHub, GitLab

Цей документ описує, як інтегрувати пошук у двох популярних платформах Git-хостингу та яких нюансів очікувати від кожної. **Включає паралельний пошук по всіх джерелах via `Promise.all`.**

---

## 🔵 GitHub

### API Endpoint
```
GET https://api.github.com/search/repositories
GET https://api.github.com/search/users
```

### Авторизація
- **Personal Access Token (PAT)** — `Authorization: Bearer <token>`
- Забезпечує 30 запитів на годину для аутентифікованих користувачів (без токена: 10/год)
- Token не потрібен для читання public даних, але з ним ліміти вищі

### Пошук — можливості
**Найпотужніший з трьох джерел!**
- Фільтрація по мові: `language:python`
- Фільтрація по кількості зірок: `stars:>1000`
- Фільтрація по даті: `created:>2020-01-01`
- Фільтрація по ліцензії: `license:mit`
- Логічні оператори: `AND`, `OR`, `NOT`

### Пагінація
```
GET /search/repositories?q=...&per_page=9&page=1
```
- Стандартна пагінація (page/per_page)
- Максимум 1000 результатів (100 сторінок × 10 на сторінку)
- Rate limit: 10 запитів на хвилину для search API

### Формат відповіді
```json
{
  "total_count": 1000000,
  "items": [
    {
      "id": 1296269,
      "name": "Hello-World",
      "owner": {
        "login": "octocat",
        "avatar_url": "https://avatars.githubusercontent.com/u/1?"
      },
      "stargazers_count": 80,
      "language": "JavaScript"
    }
  ]
}
```

### Нюанси
- Поле `stargazers_count` — це **кількість зірок**, не збільшується в реальному часі
- Збагачення профілю користувача потребує окремого запиту: `GET /users/{login}` (дає `bio`, `location`, `followers`)
- Видалені репозиторії поза результатами пошуку

### Ліміти
| Параметр | Значення |
|---|---|
| Search API запитів/хвилину | 10 |
| Max результатів на запит | 100 (завжди верне <= 100 даже якщо запросити більше через per_page) |
| Max сторінок | 100 (отже max реальних результатів: 100 × 100 = 10,000; search overall cap: 1000) |

---

## 🟠 GitLab

### API Endpoint
```
GET https://gitlab.com/api/v4/projects
GET https://gitlab.com/api/v4/users
```

### Авторизація
- **Personal Access Token (PAT)** або **OAuth2**
- `Authorization: Bearer <token>` (OAuth2)
- `Private-Token: <token>` (старий формат, deprecated but still works)
- Free tier: 300 запитів на хвилину

### Пошук — можливості
**Обмеженіший за GitHub.**
- Параметр `search` — тільки текстовий пошук по імені проекту, не по опису
- Немає вбудованої фільтрації по мові, зіркам, даті всередині API
- Фільтрація must-be done in-app (витягуєш більше результатів, потім фільтруєш клієнтом)

### Пагінація
```
GET /api/v4/projects?search=...&per_page=9&page=1
```
- Стандартна `page`/`per_page`
- Link headers: `rel="next"`, `rel="prev"` — можна юзати замість номерів сторінок
- Max per_page: 100

### Формат відповіді (проекти)
```json
[
  {
    "id": 7,
    "name": "Flight",
    "name_with_namespace": "Twitter / Flight",
    "star_count": 28,
    "web_url": "https://gitlab.com/twitter/flight",
    "owner": {
      "username": "raymond_smith",
      "avatar_url": "https://..."
    }
  }
]
```

### Формат відповіді (користувачі)
```json
[
  {
    "id": 1,
    "username": "raymond_smith",
    "name": "Raymond Smith",
    "avatar_url": "https://...",
    "bio": "...",
    "location": "...",
    "public_repos": 5,
    "followers": 10
  }
]
```

### Нюанси
- Поле **`star_count`**, не `stargazers_count` — будь обережний при нормалізації
- `owner` може бути або об'єктом, або рядком (залежить від версії API)
- GitLab дозволяє private проекти у пошукових результатах — має сенс фільтрувати `visibility: public` клієнтом
- Функція пошуку слаба порівняно з GitHub — дай користувачеві знати що він шукає скоріш за все по імені проекту

### Ліміти
| Параметр | Значення |
|---|---|
| Requests/хвилину | 300 (на free tier) |
| Max per_page | 100 |

---

## 📊 Порівняльна таблиця

| Функція | GitHub | GitLab |
|---|---|---|
| **Глобальний пошук** | ✅ Повний | ✅ По імені |
| **Фільтрація** | ✅ Потужна | ⚠️ Обмежена |
| **Пошук користувачів** | ✅ Так | ✅ Так |
| **Сортування по популярності** | ✅ stars | ⚠️ star_count |
| **Пагінація** | ✅ Page-based | ✅ Page-based |
| **Rate limit** | 10/хв (search) | 300/хв |
| **Авторизація** | PAT | PAT, OAuth2 |

---

## 🚀 Агрегований пошук (Promise.all)

**Архітектура:**

```typescript
// lib/multi-source-search.ts

export async function searchAllSources(
  query: string,
  type: 'user' | 'repo',
  page: number = 1
) {
  const results = await Promise.all([
    searchGitHub(query, type, page)
      .catch(err => ({ error: 'GitHub', details: err.message, items: [], total_count: 0 })),
    
    searchGitLab(query, type, page)
      .catch(err => ({ error: 'GitLab', details: err.message, items: [], total_count: 0 })),
  ]);

  // Нормалізація + об'єднання
  const allItems = results
    .flatMap(r => 
      (r.items || []).map(item => ({
        ...item,
        source: r.source,  // додати гілку джерела
      }))
    );

  return {
    items: allItems,
    total_count: results.reduce((sum, r) => sum + (r.total_count || 0), 0),
    errors: results.filter(r => r.error),  // деталі про помилки
  };
}
```

### Нюанси паралельного пошуку

**✅ Переваги:**
- Швидкість: три запити паралельно замість послідовно (~300ms замість ~900ms)
- Комплетність: якщо один джерело падає, інші все ще працюють
- UX: результати з усіх джерел у одному списку

**⚠️ Проблеми:**

1. **Rate limiting:** Кожне джерело має свій ліміт. При паралельному пошуку по 10 запитів на хвилину (GitHub) ти вичерпаєш ліміт швидше.
   - **Рішення:** Кешування в Redis (за ключем с джерелом: `{source}:{type}:{query}`)

2. **Несумісні формати:** Дивись нюанси кожного джерела вище.

3. **Несумісні метрики:** Stars GitHub ≠ Stars GitLab
   - **Рішення:** Показувати позначку джерела на кожній карточці
   - **Ще краще:** Дати користувачеві опцію шукати в одному джерелі за раз (SourceSelector)

4. **Різні формати відповідей:**
   - GitHub: `owner` + `stargazers_count`
   - GitLab: `owner` + `star_count`
   - **Рішення:** Нормалізаційна функція для кожного адаптера

### Рекомендована архітектура

```
app/api/search/route.ts (POST)
  ↓
  searchAllSources(query, type, page)
    ↓
    Promise.all([
      searchGitHub(query, type, page),    // lib/github.ts
      searchGitLab(query, type, page),    // lib/gitlab.ts
    ])
    ↓
  normalizeResults() — привести все до одного формату
  ↓
  Кешування в Redis (з джерелом у ключі)
  ↓
  Response { items, total_count, errors }
```

**Альтернатива:** Якщо паралельний пошук дає занадто багато конфліктів:
- Зберегти опцію single-source пошуку
- SourceSelector дає вибір: "All sources" або конкретне джерело
- При "All sources" — паралельний Promise.all
- При конкретному — обичная послідовність

---

## 🔴 Ризики та рекомендації

### Ризик 1: Несумісність нормалізації
**Проблема:** GitHub `stargazers_count` vs GitLab `star_count`
**Рішення:** Нормалізаційна функція + позначка джерела на картках

### Ризик 2: Rate limiting при паралельному пошуку
**Проблема:** Два паралельних запити = вичерпуємо ліміти швидше
**Рішення:** Агресивне кешування (Redis, TTL 3600s), батчування

### Ризик 3: Різні структури даних
**Проблема:** Кожне джерело повертає різні поля
**Рішення:** Common interface, адаптери для кожного джерела

---

## 📝 Env vars

```bash
# GitHub
GITHUB_TOKEN=ghp_...

# GitLab
GITLAB_TOKEN=glpat-...
GITLAB_API_BASE=https://gitlab.com/api/v4
```

---

**Остання редакція:** 20 липня 2026  
**Статус:** Архітектура для Promise.all агрегації
