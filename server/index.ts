import express from 'express';
import { createServer } from 'node:http';
import { Server } from 'socket.io';
import { type ResultSet } from '@libsql/client';
import dbClient from './db-client.ts';
import { PORT } from './config.ts';

const app = express();
const server = createServer(app);
const io = new Server(server, {
  connectionStateRecovery: {},
});

io.on('connection', async socket => {
  console.log('User connected');

  socket.on('disconnect', () => {
    console.log('User disconnected');
  });

  socket.on('chat message', async message => {
    let result: ResultSet;
    try {
      result = await dbClient.execute({
        sql: 'INSERT INTO messages (content) VALUES (:message)',
        args: { message },
      });
    } catch (error) {
      console.error(error);
      return;
    }

    io.emit('chat message', message, result.lastInsertRowid?.toString());
  });

  // NOTE: Recover messages after disconnection
  if (!socket.recovered) {
    try {
      const results = await dbClient.execute({
        sql: 'SELECT id, content FROM messages WHERE id > ?',
        args: [socket.handshake.auth.serverOffset ?? 0],
      });

      results.rows.forEach(row => {
        socket.emit('chat message', row.content, row.id?.toString());
      });
    } catch (error) {
      console.error(error);
    }
  }
});

app.get('/', (_req, res) => {
  res.sendFile(process.cwd() + '/client/index.html');
});

server.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}`);
});
