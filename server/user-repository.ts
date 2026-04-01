import * as argon2 from 'argon2';
import dbClient from './db-client.ts';

// TODO: Add inputs validation with Zod
// TODO: Add error handling for the corresponding cases
export const userRepository = {
  async create(username: string, password: string) {
    const passwordHash = await argon2.hash(password);

    const result = await dbClient.execute({
      sql: 'INSERT INTO users (username, password_hash) VALUES (:username, :password_hash)',
      args: [username, passwordHash],
    });

    return result.lastInsertRowid;
  },

  async login(username: string, password: string) {
    const result = await dbClient.execute({
      sql: 'SELECT username, password_hash FROM users WHERE username = ?',
      args: [username],
    });

    return typeof result.rows[0]?.password_hash === 'string' &&
      (await argon2.verify(result.rows[0].password_hash, password))
      ? result.rows[0].username
      : undefined;
  },
};
