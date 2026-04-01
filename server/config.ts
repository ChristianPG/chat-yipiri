import dotenv from 'dotenv';

dotenv.config();

export const { AUTH_SECRET, PORT = 3000, DB_URL = '', DB_TOKEN } = process.env;
