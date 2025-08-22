const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');
const fs = require('fs');

const app = express();
const server = http.createServer(app);

// Важно: правильная настройка CORS для Socket.io
const io = socketIo(server, {
  cors: {
    origin: ["https://node-app-video-test.onrender.com", "http://localhost:3000", "http://localhost:10000"],
    methods: ["GET", "POST"],
    credentials: true
  },
  transports: ['websocket', 'polling']
});

// Определяем путь к статическим файлам
const clientPath = path.join(__dirname, 'client/out');
const publicPath = path.join(__dirname, 'public');

// Проверяем, существует ли собранный клиент
if (fs.existsSync(clientPath)) {
  console.log('Serving built client from:', clientPath);
  app.use(express.static(clientPath));
} else {
  console.log('Built client not found, serving from public directory:', publicPath);
  app.use(express.static(publicPath));
}

// Health check endpoint должен быть перед fallback
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', message: 'Server is running' });
});

// Fallback для SPA - все маршруты ведут к index.html
app.get('*', (req, res) => {
  if (fs.existsSync(clientPath)) {
    res.sendFile(path.join(clientPath, 'index.html'));
  } else {
    res.sendFile(path.join(publicPath, 'index.html'));
  }
});

// Обработка WebSocket соединений
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  socket.on('signal', (data) => {
    console.log('Signal received from', socket.id, 'type:', data.type);
    socket.broadcast.emit('signal', data);
  });

  socket.on('disconnect', (reason) => {
    console.log('User disconnected:', socket.id, 'Reason:', reason);
  });

  // Отправляем подтверждение подключения
  socket.emit('connected', { id: socket.id });
});

const PORT = process.env.PORT || 10000;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
});