import { createClient } from '@libsql/client';
import { DB_TOKEN, DB_URL } from './config.ts';

const dbClient = createClient({
  url: DB_URL,
  authToken: DB_TOKEN,
});

await dbClient.execute(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL
  )
`);

await dbClient.execute(`
  CREATE TABLE IF NOT EXISTS messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    content TEXT NOT NULL
  )
`);

export default dbClient;
