# Быстрый старт

## Локальная разработка

### 1. Установка зависимостей
```bash
# Установка зависимостей сервера
npm install

# Установка зависимостей клиента
cd client && npm install && cd ..
```

### 2. Запуск в режиме разработки
```bash
# Запуск сервера и клиента одновременно
npm run dev:full
```

Или по отдельности:
```bash
# Только сервер (порт 10000)
npm run dev

# Только клиент (порт 3000)
npm run client
```

### 3. Открытие в браузере
- Клиент: http://localhost:3000
- Сервер: http://localhost:10000

## Продакшен сборка

### 1. Сборка клиента
```bash
cd client && npm run build && cd ..
```

### 2. Запуск сервера
```bash
npm start
```

Сервер будет раздавать собранный клиент на http://localhost:10000

## Деплой на Render.com

1. Подключите репозиторий к Render
2. Выберите "Web Service"
3. Render автоматически использует `render.yaml`
4. Готово! 🚀

## Проверка работы

1. Откройте приложение в браузере
2. Разрешите доступ к камере/микрофону
3. Дождитесь подключения к серверу
4. Нажмите "Start Call"

## Структура проекта

```
test_video_call/
├── server.js              # Express + Socket.IO сервер
├── package.json           # Зависимости сервера
├── render.yaml            # Конфигурация Render
├── client/                # Next.js клиент
│   ├── src/
│   │   ├── app/          # Next.js App Router
│   │   └── components/   # React компоненты
│   ├── out/              # Собранный клиент (после build)
│   └── package.json      # Зависимости клиента
└── README.md             # Подробная документация
```

## Полезные команды

```bash
# Разработка
npm run dev:full          # Сервер + клиент
npm run dev              # Только сервер
npm run client           # Только клиент

# Продакшен
npm run client:build     # Сборка клиента
npm start               # Запуск сервера

# Очистка
rm -rf client/out       # Удалить собранный клиент
rm -rf client/.next     # Удалить кэш Next.js
``` 