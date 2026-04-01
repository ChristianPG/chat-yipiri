import jwt from 'jsonwebtoken';
import cookieParser from 'cookie-parser';
import express from 'express';
import { createServer } from 'node:http';
import { Server } from 'socket.io';
import { type ResultSet } from '@libsql/client';
import dbClient from './db-client.ts';
import { AUTH_SECRET, PORT } from './config.ts';
import { userRepository } from './user-repository.ts';

const app = express();
const server = createServer(app);
const io = new Server(server, {
  connectionStateRecovery: {},
});

app.use(express.json());
app.use(cookieParser());

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

app.post('/user/create', async (req, res) => {
  const newUserId = await userRepository.create(
    req.body.username,
    req.body.password,
  );

  res.send(`User created with id: ${newUserId}`);
});

app.post('/user/login', async (req, res) => {
  if (!AUTH_SECRET) {
    res.status(500).send('Authentication not available');
    return;
  }

  const username = await userRepository.login(
    req.body.username,
    req.body.password,
  );

  const authToken = jwt.sign({ username }, AUTH_SECRET, { expiresIn: '1h' });

  if (username) {
    res
      .cookie('auth_token', authToken, {
        httpOnly: true,
        secure: true,
        sameSite: 'strict',
        maxAge: 1000 * 60 * 60,
      })
      .send('User successfully authenticated');
  } else {
    res.status(400).send('Information not valid');
  }
});

server.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}`);
});
