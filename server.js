const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');

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

// Раздача статических файлов из собранного клиента
const clientPath = path.join(__dirname, 'client/out');
app.use(express.static(clientPath));

// Health check endpoint должен быть перед fallback
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', message: 'Server is running' });
});

// Fallback для SPA - все маршруты ведут к index.html
app.get('*', (req, res) => {
  res.sendFile(path.join(clientPath, 'index.html'));
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