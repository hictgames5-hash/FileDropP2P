const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: "*" },
  maxHttpBufferSize: 1e8 // Permite arquivos de até 100 MB
});

const clients = {};

io.on('connection', (socket) => {
  // Registra o ID de 5 dígitos do dispositivo
  socket.on('register-id', (id) => {
    clients[id] = socket.id;
    socket.myId = id;
  });

  // Transmite o arquivo direto do remetente para o destinatário
  socket.on('send-files', (data) => {
    const targetSocketId = clients[data.targetId];
    if (targetSocketId) {
      io.to(targetSocketId).emit('receive-files', data);
      socket.emit('send-status', { success: true, targetId: data.targetId });
    } else {
      socket.emit('send-status', { success: false, error: 'Dispositivo destino não encontrado ou offline.' });
    }
  });

  socket.on('disconnect', () => {
    if (socket.myId) {
      delete clients[socket.myId];
    }
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Servidor FileDrop rodando na porta ${PORT}`));
