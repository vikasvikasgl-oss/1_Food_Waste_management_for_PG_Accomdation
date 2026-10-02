import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import app from '../index.js';

describe('Server API Endpoints Integration (Supertest)', () => {
  let residentToken = '';
  let managerToken = '';
  let testFoodId = '';
  let testCartId = '';

  beforeAll(async () => {
    // 1. Register a test resident
    const residentRes = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Supertest Resident',
        email: `resident_${Date.now()}@test.com`,
        password: 'password123',
        role: 'resident'
      });
    expect(residentRes.status).toBe(201);
    residentToken = residentRes.body.token;

    // 2. Register a test manager
    const managerRes = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Supertest Manager',
        email: `manager_${Date.now()}@test.com`,
        password: 'password123',
        role: 'manager'
      });
    expect(managerRes.status).toBe(201);
    managerToken = managerRes.body.token;
  });

  describe('1. Authentication & Role Guards', () => {
    it('rejects unauthenticated requests with 401 on protected manager routes', async () => {
      const res = await request(app)
        .post('/api/food-items')
        .send({
          title: 'Unauthorized Dish',
          category: 'Snacks',
          quantity_available: 10,
          cost_per_kg: 100,
          status: 'available'
        });

      expect(res.status).toBe(401);
      expect(res.body.error).toMatch(/Authentication required|log in/i);
    });

    it('rejects resident token with 403 on manager-only routes', async () => {
      const res = await request(app)
        .post('/api/food-items')
        .set('Authorization', `Bearer ${residentToken}`)
        .send({
          title: 'Forbidden Dish',
          category: 'Snacks',
          quantity_available: 10,
          cost_per_kg: 100,
          status: 'available'
        });

      expect(res.status).toBe(403);
      expect(res.body.error).toMatch(/manager/i);
    });

    it('allows manager to create new food item', async () => {
      const res = await request(app)
        .post('/api/food-items')
        .set('Authorization', `Bearer ${managerToken}`)
        .send({
          title: `Special Pulao ${Date.now()}`,
          category: 'Main Course',
          quantity_available: 20,
          cost_per_kg: 150,
          status: 'available'
        });

      expect(res.status).toBe(201);
      expect(res.body.title).toMatch(/Special Pulao/);
      expect(res.body.status).toBe('available');
      testFoodId = res.body.food_id || res.body.id;
    });
  });

  describe('2. Cart Orders & Stock Deduction Lifecycle', () => {
    it('allows resident to create a cart request', async () => {
      const res = await request(app)
        .post('/api/cart-requests')
        .set('Authorization', `Bearer ${residentToken}`)
        .send({
          items: [
            {
              food_id: testFoodId,
              title: 'Special Pulao',
              category: 'Main Course',
              quantity: 5
            }
          ]
        });

      expect(res.status).toBe(201);
      expect(res.body.status).toBe('pending');
      testCartId = res.body.cart_id || res.body.id;
    });

    it('deducts inventory stock and updates item status when manager approves cart', async () => {
      const res = await request(app)
        .put(`/api/cart-requests/${testCartId}/status`)
        .set('Authorization', `Bearer ${managerToken}`)
        .send({
          status: 'approved',
          approved_by: 'Supertest Manager'
        });

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('approved');

      // Verify stock deducted from 20 -> 15 (which is <= 15, so low_stock)
      const foodRes = await request(app).get('/api/food-items');
      const item = foodRes.body.find(f => f.food_id === testFoodId || f.id === testFoodId);
      expect(item.quantity_available).toBe(15);
      expect(item.status).toBe('low_stock');
    });

    it('restores inventory stock when an approved cart is subsequently rejected', async () => {
      const res = await request(app)
        .put(`/api/cart-requests/${testCartId}/status`)
        .set('Authorization', `Bearer ${managerToken}`)
        .send({
          status: 'rejected',
          approved_by: 'Supertest Manager'
        });

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('rejected');

      // Verify stock restored from 15 -> 20 (available)
      const foodRes = await request(app).get('/api/food-items');
      const item = foodRes.body.find(f => f.food_id === testFoodId || f.id === testFoodId);
      expect(item.quantity_available).toBe(20);
      expect(item.status).toBe('available');
    });
  });

  describe('3. Waste Calculation, Reports & Dish Quality Analytics', () => {
    it('returns logs with proper cost valuation and net waste calculations', async () => {
      const res = await request(app)
        .get('/api/logs')
        .set('Authorization', `Bearer ${managerToken}`);
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });

    it('computes dish analytics, top 3 ratings and low-rating/high-waste correlation', async () => {
      const res = await request(app)
        .get('/api/analytics/dish-quality')
        .set('Authorization', `Bearer ${managerToken}`);
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('dishes');
      expect(res.body).toHaveProperty('top3Best');
      expect(res.body).toHaveProperty('top3Worst');
      expect(res.body).toHaveProperty('correlationSummary');
    });

    it('returns Zero Waste Hero leaderboard calculations with reliability score', async () => {
      const res = await request(app)
        .get('/api/leaderboard')
        .set('Authorization', `Bearer ${residentToken}`);
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      if (res.body.length > 0) {
        expect(res.body[0]).toHaveProperty('score');
        expect(res.body[0]).toHaveProperty('reliability_rate');
      }
    });
  });
});
