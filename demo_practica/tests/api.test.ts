import { describe, expect, it } from 'vitest';
import request from 'supertest';
import { app } from '../src/app.ts';

describe('API de precios', () => {
  it('responde al chequeo de salud', async () => {
    const respuesta = await request(app).get('/salud');
    expect(respuesta.status).toBe(200);
    expect(respuesta.body).toEqual({ estado: 'ok' });
  });

  it('calcula un precio mediante HTTP', async () => {
    const respuesta = await request(app)
      .post('/api/precios/calcular')
      .send({ precio: 1000, descuento: 10 });
    expect(respuesta.status).toBe(200);
    expect(respuesta.body).toEqual({ total: 900 });
  });
});
