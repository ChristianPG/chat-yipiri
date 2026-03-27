import express from 'express';
import { createServer } from 'node:http';
import { Server } from 'socket.io';

const port = process.env.PORT ?? 3000;

const app = express();
const server = createServer(app);
const io = new Server(server);

io.on('connection', socket => {
  console.log('User connected');

  socket.on('disconnect', () => {
    console.log('User disconnected');
  });

  socket.on('chat message', msg => {
    console.log('User sent', msg);
    io.emit('chat message', msg);
  });
});

app.get('/', (_req, res) => {
  res.sendFile(process.cwd() + '/client/index.html');
});

server.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
