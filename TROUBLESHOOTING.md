# Решение проблем деплоя

## Проблема: "next: not found" на Render

### Причина
Next.js не установлен в продакшен зависимостях клиента.

### Решение 1: Переместить Next.js в dependencies
```json
// client/package.json
{
  "dependencies": {
    "next": "15.5.0",
    "react": "19.1.0",
    "react-dom": "19.1.0",
    "socket.io-client": "^4.8.1"
  }
}
```

### Решение 2: Использовать npm ci
```yaml
# render.yaml
buildCommand: |
  npm install
  cd client
  npm ci
  npm run build
  cd ..
```

## Проблема: "ENOENT: no such file or directory, stat '/opt/render/project/src/client/out/index.html'"

### Причина
Клиент не собрался или папка out не создалась.

### Решение
Сервер автоматически использует fallback на старый HTML файл из `public/`.

### Проверка
1. Посмотрите логи сборки в Render
2. Убедитесь, что команда `npm run build` выполнилась успешно
3. Проверьте, что в логах есть "Build completed successfully"

## Проблема: WebSocket не подключается

### Причина
CORS настройки или неправильный URL сервера.

### Решение
Проверьте CORS настройки в `server.js`:
```javascript
const io = socketIo(server, {
  cors: {
    origin: ["https://your-app.onrender.com", "http://localhost:3000"],
    methods: ["GET", "POST"],
    credentials: true
  }
});
```

## Проблема: Клиент не собирается

### Решение 1: Проверить next.config.js
```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  trailingSlash: true,
  images: {
    unoptimized: true
  }
}

module.exports = nextConfig
```

### Решение 2: Убрать turbopack
```json
// client/package.json
{
  "scripts": {
    "build": "next build"
  }
}
```

### Решение 3: Использовать альтернативную сборку
```yaml
# render.yaml
buildCommand: |
  npm install
  cd client
  npm install --production=false
  npm run build
  cd ..
```

## Проблема: Порт не слушается

### Причина
Сервер не слушает на правильном порту.

### Решение
Убедитесь, что в `server.js`:
```javascript
const PORT = process.env.PORT || 10000;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
});
```

## Проблема: Статические файлы не загружаются

### Решение
Проверьте, что сервер правильно раздает файлы:
```javascript
// server.js
const clientPath = path.join(__dirname, 'client/out');
const publicPath = path.join(__dirname, 'public');

if (fs.existsSync(clientPath)) {
  app.use(express.static(clientPath));
} else {
  app.use(express.static(publicPath));
}
```

## Альтернативный подход: Деплой без сборки клиента

Если сборка клиента не работает, можно использовать только старый HTML файл:

### 1. Упростить render.yaml
```yaml
services:
  - type: web
    name: node-video-chat
    env: node
    buildCommand: npm install
    startCommand: npm start
    envVars:
      - key: PORT
        value: 9788
      - key: NODE_ENV
        value: production
```

### 2. Обновить server.js
```javascript
// Раздавать только старые файлы
app.use(express.static(path.join(__dirname, 'public')));
```

## Проверка работоспособности

### 1. Health Check
```bash
curl https://your-app.onrender.com/health
```

### 2. Главная страница
```bash
curl -I https://your-app.onrender.com/
```

### 3. WebSocket
Откройте DevTools → Console и проверьте подключение.

## Логи для отладки

### Render Logs
- Build Logs: показывают процесс сборки
- Runtime Logs: показывают работу сервера

### Локальная отладка
```bash
# Сборка
npm run build

# Запуск
npm start

# Проверка
curl http://localhost:10000/health
```

## Контакты для поддержки

Если проблемы не решаются:
1. Проверьте логи Render
2. Убедитесь, что все файлы в репозитории
3. Попробуйте локальную сборку
4. Обратитесь к документации Render 