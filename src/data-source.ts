import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';

dotenv.config();

const url = process.env.DATABASE_URL;

export default new DataSource({
  type: 'postgres',
  url,
  entities: [__dirname + '/**/*.entity{.ts,.js}'],
  migrations: [__dirname + '/database/migrations/*{.ts,.js}'],
  synchronize: false,
});
