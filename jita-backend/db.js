import mysql from 'mysql2/promise';
import { config } from './config/index.js';

export const db = mysql.createPool(config.db);

export default { db };
