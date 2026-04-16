import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';

describe('App (e2e)', () => {
  let app: INestApplication<App>;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api');
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('POST /api/auth/login without credentials returns 400', () => {
    return request(app.getHttpServer())
      .post('/api/auth/login')
      .send({})
      .expect(400);
  });

  it('POST /api/auth/login with bad credentials returns 401', () => {
    return request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ email: 'nobody@test.com', password: 'wrong' })
      .expect(401);
  });

  it('GET /api/auth/me without token returns 401', () => {
    return request(app.getHttpServer()).get('/api/auth/me').expect(401);
  });
});
