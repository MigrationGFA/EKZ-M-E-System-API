import * as bcrypt from 'bcrypt';
import { DataSource } from 'typeorm';
import { logStats, makeStats, query, type Seeder } from './helpers.js';

const SEED_USERS = [
  {
    email: 'admin@ekz.com',
    name: 'Adebola Johnson',
    password: 'Admin123!',
    role: 'admin',
  },
];

export const seedUsers: Seeder = async (ds: DataSource) => {
  const stats = makeStats();
  for (const user of SEED_USERS) {
    const exists = await query<{ id: string }>(
      ds,
      `SELECT id FROM users WHERE email = $1`,
      [user.email],
    );
    if (exists.length > 0) {
      stats.skipped += 1;
      continue;
    }
    const hash = await bcrypt.hash(user.password, 10);
    await ds.query(
      `INSERT INTO users (email, name, password_hash, role, is_default_password)
       VALUES ($1, $2, $3, $4, true)`,
      [user.email, user.name, hash, user.role],
    );
    stats.inserted += 1;
  }
  logStats('users', stats);
};
