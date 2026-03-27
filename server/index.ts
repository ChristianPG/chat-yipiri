import express from 'express';
import { createServer } from 'node:http';
import { Server } from 'socket.io';
import dotenv from 'dotenv';
import { createClient, type ResultSet } from '@libsql/client';

dotenv.config();

const port = process.env.PORT ?? 3000;

const app = express();
const server = createServer(app);
const io = new Server(server, {
  connectionStateRecovery: {},
});

const db = createClient({
  url: process.env.DB_URL ?? '',
  authToken: process.env.DB_TOKEN,
});

await db.execute(`
  CREATE TABLE IF NOT EXISTS messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    content TEXT
  )
`);

io.on('connection', async socket => {
  console.log('User connected');

  socket.on('disconnect', () => {
    console.log('User disconnected');
  });

  socket.on('chat message', async message => {
    let result: ResultSet;
    try {
      result = await db.execute({
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
      const results = await db.execute({
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

server.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
