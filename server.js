const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

// Раздача статических файлов
app.use(express.static(path.join(__dirname, 'public')));

// Обработка WebSocket соединений
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  // Пересылка сигнальных данных между пользователями
  socket.on('signal', (data) => {
    socket.broadcast.emit('signal', data);
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});