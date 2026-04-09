import { DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';
import * as dotenv from 'dotenv';

dotenv.config();

const dataSource = new DataSource({
  type: 'postgres',
  url: process.env.DATABASE_URL,
  entities: [],
  synchronize: false,
});

const SEED_USERS = [
  {
    email: 'admin@ekz.com',
    name: 'Adebola Johnson',
    password: 'Admin123!',
    role: 'admin',
  },
  {
    email: 'me@ekz.com',
    name: 'Funke Ogunleye',
    password: 'Staff123!',
    role: 'me_staff',
  },
  {
    email: 'prog@ekz.com',
    name: 'Chidi Nwosu',
    password: 'Staff123!',
    role: 'programme_staff',
  },
  {
    email: 'viewer@ekz.com',
    name: 'Bisi Adeyemi',
    password: 'Staff123!',
    role: 'viewer',
  },
];

async function seed() {
  await dataSource.initialize();
  console.log('Connected to database');

  for (const user of SEED_USERS) {
    const exists = await dataSource.query(
      `SELECT id FROM users WHERE email = $1`,
      [user.email],
    );
    if (exists.length > 0) {
      console.log(`User ${user.email} already exists, skipping`);
      continue;
    }

    const hash = await bcrypt.hash(user.password, 10);
    await dataSource.query(
      `INSERT INTO users (email, name, password_hash, role) VALUES ($1, $2, $3, $4)`,
      [user.email, user.name, hash, user.role],
    );
    console.log(`Created user: ${user.email} (${user.role})`);
  }

  await dataSource.destroy();
  console.log('Seed complete');
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
