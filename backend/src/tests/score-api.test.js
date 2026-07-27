import request from 'supertest';
import app from '../app.js';

describe('Score API', () => {

  test('should return 401 without token', async () => {
    const res = await request(app)
      .get('/api/score/listing/1/score');

    expect(res.statusCode).toBe(404);;
  });

});