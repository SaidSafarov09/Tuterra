# Tuterra - Система управления уроками

## Установка и настройка

### Локальная разработка

1. Установите зависимости:
```bash
npm install
```

2. Для локальной разработки с SQLite создайте файл `.env.local`:
```bash
cp .env.example .env.local
```

Затем отредактируйте `.env.local`, установив:
```
DATABASE_URL="file:./dev.db"
```

3. Синхронизируйте базу данных:
```bash
npx prisma db push --accept-data-loss
```

4. Запустите приложение:
```bash
npm run dev
```

### Продакшен (Vercel)

Для деплоя на Vercel:

1. Укажите переменные окружения в настройках Vercel:
   - `DATABASE_URL`: PostgreSQL URL от Prisma
   - `JWT_SECRET`: JWT секретный ключ
   - `NEXT_PUBLIC_APP_URL`: URL вашего приложения
   - `YANDEX_CLIENT_ID`, `YANDEX_CLIENT_SECRET`: для OAuth
   - `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`: для OAuth

2. При билде на Vercel автоматически применяются миграции

## Переменные окружения для Vercel

Для корректной работы на Vercel укажите следующие переменные в настройках проекта:

- `DATABASE_URL` - URL для подключения к PostgreSQL базе данных
- `JWT_SECRET` - секретный ключ для генерации JWT токенов
- `NEXT_PUBLIC_APP_URL` - публичный URL приложения
- `YANDEX_CLIENT_ID`, `YANDEX_CLIENT_SECRET` - для аутентификации через Яндекс
- `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` - для аутентификации через Google

## Особенности реализации

Проект использует PostgreSQL в продакшене. Ключевые особенности:

- Поле `daysOfWeek` в модели `LessonSeries` хранится как строка JSON и обрабатывается как массив в приложении
- Все компоненты и API-маршруты корректно обрабатывают это поле
- Для продакшена используется PostgreSQL из-за его надежности и производительности в многопользовательском режиме
