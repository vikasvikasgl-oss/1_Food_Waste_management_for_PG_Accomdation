import { describe, it, expect } from 'vitest';
import {
  getWeekdayFromDate,
  filterRecentLogs,
  computeWeekdayAverage,
  computeApprovedCartDemand,
  computeHeadcountAdjustment,
  computeSmartPrepRecommendations,
  computeWasteComparisonHistory
} from '../prepPlanner';
import type { FoodItem, CartRequest, LogEntry, MealAttendance } from '../db';

describe('Smart Prep Planner Utilities', () => {
  const mockLogs: LogEntry[] = [
    { id: 'l1', item: 'Veg Biryani', prepared: 120, consumed: 100, wasted: 20, date: '2026-06-11' }, // Thursday (1 week before)
    { id: 'l2', item: 'Veg Biryani', prepared: 110, consumed: 90, wasted: 20, date: '2026-06-18' },  // Thursday
    { id: 'l3', item: 'Paneer Butter Masala', prepared: 80, consumed: 75, wasted: 5, date: '2026-06-19' }, // Friday
    { id: 'l4', item: 'Dal Makhani', prepared: 90, consumed: 80, wasted: 10, date: '2026-06-20' }  // Saturday
  ];

  const mockFoodItems: FoodItem[] = [
    { food_id: 'f1', title: 'Veg Biryani', category: 'Main Course', quantity_available: 50, status: 'available' },
    { food_id: 'f2', title: 'Paneer Butter Masala', category: 'Side Dish', quantity_available: 20, status: 'available' },
    { food_id: 'f3', title: 'Aloo Paratha', category: 'Breakfast', quantity_available: 5, status: 'low_stock' }
  ];

  const mockCartRequests: CartRequest[] = [
    {
      cart_id: 'c1',
      user_id: 'u1',
      user_name: 'Student 1',
      status: 'approved',
      approved_by: 'Manager',
      frozen: false,
      date: '2026-06-18',
      items: [
        { food_id: 'f1', title: 'Veg Biryani', category: 'Main Course', quantity: 25 },
        { food_id: 'f2', title: 'Paneer Butter Masala', category: 'Side Dish', quantity: 10 }
      ]
    },
    {
      cart_id: 'c2',
      user_id: 'u2',
      user_name: 'Student 2',
      status: 'approved',
      approved_by: 'Manager',
      frozen: false,
      date: '2026-06-18',
      items: [
        { food_id: 'f1', title: 'Veg Biryani', category: 'Main Course', quantity: 15 }
      ]
    },
    {
      cart_id: 'c3',
      user_id: 'u3',
      user_name: 'Student 3',
      status: 'pending', // Pending should NOT count toward approved demand
      approved_by: '',
      frozen: false,
      date: '2026-06-18',
      items: [
        { food_id: 'f1', title: 'Veg Biryani', category: 'Main Course', quantity: 30 }
      ]
    }
  ];

  const mockAttendances: MealAttendance[] = [
    { id: 'att-1', user_id: 'u-1', date: '2026-06-18', slot: 'Lunch', attending: false },
    { id: 'att-2', user_id: 'u-2', date: '2026-06-18', slot: 'Lunch', attending: false },
    { id: 'att-3', user_id: 'u-3', date: '2026-06-18', slot: 'Lunch', attending: false },
    { id: 'att-4', user_id: 'u-4', date: '2026-06-18', slot: 'Lunch', attending: false },
    { id: 'att-5', user_id: 'u-5', date: '2026-06-18', slot: 'Lunch', attending: false },
    { id: 'att-6', user_id: 'u-6', date: '2026-06-18', slot: 'Lunch', attending: true }
  ];

  describe('getWeekdayFromDate', () => {
    it('returns the correct weekday name for standard dates', () => {
      expect(getWeekdayFromDate('2026-06-18')).toBe('Thursday');
      expect(getWeekdayFromDate('2026-06-19')).toBe('Friday');
      expect(getWeekdayFromDate('2026-06-20')).toBe('Saturday');
    });

    it('handles invalid date strings gracefully', () => {
      expect(getWeekdayFromDate('not-a-valid-date')).toBe('Monday');
    });
  });

  describe('filterRecentLogs', () => {
    it('filters out logs older than the specified window', () => {
      const now = new Date();
      const recentDate = new Date(now.getTime() - 10 * 24 * 3600 * 1000).toISOString().split('T')[0];
      const oldDate = new Date(now.getTime() - 100 * 24 * 3600 * 1000).toISOString().split('T')[0];

      const testLogs: LogEntry[] = [
        { id: '1', item: 'Rice', prepared: 50, consumed: 40, wasted: 10, date: recentDate },
        { id: '2', item: 'Rice', prepared: 50, consumed: 40, wasted: 10, date: oldDate }
      ];

      const filtered = filterRecentLogs(testLogs, 4); // 4 weeks
      expect(filtered.length).toBe(1);
      expect(filtered[0].date).toBe(recentDate);
    });
  });

  describe('computeWeekdayAverage', () => {
    it('computes exact average consumed for matching weekday', () => {
      // Veg Biryani on Thursdays: (100 + 90) / 2 = 95
      const avg = computeWeekdayAverage('Veg Biryani', 'Thursday', mockLogs);
      expect(avg).toBe(95);
    });

    it('falls back to general average if no matching weekday logs exist', () => {
      // Paneer Butter Masala has only Friday log (consumed: 75)
      const avg = computeWeekdayAverage('Paneer Butter Masala', 'Monday', mockLogs);
      expect(avg).toBe(75);
    });

    it('returns 0 if item has no log history at all', () => {
      const avg = computeWeekdayAverage('Aloo Paratha', 'Monday', mockLogs);
      expect(avg).toBe(0);
    });
  });

  describe('computeApprovedCartDemand', () => {
    it('sums only approved carts matching date and item', () => {
      // Veg Biryani on 2026-06-18: c1 has 25, c2 has 15 (c3 is pending, ignored) -> total 40, count 2
      const result = computeApprovedCartDemand('f1', 'Veg Biryani', '2026-06-18', mockCartRequests);
      expect(result.count).toBe(2);
      expect(result.totalQuantity).toBe(40);
    });

    it('returns 0 for items not present in approved carts', () => {
      const result = computeApprovedCartDemand('f3', 'Aloo Paratha', '2026-06-18', mockCartRequests);
      expect(result.count).toBe(0);
      expect(result.totalQuantity).toBe(0);
    });
  });

  describe('computeHeadcountAdjustment', () => {
    it('computes expected headcount and adjustment ratio for skipped meals', () => {
      // 50 baseline residents, 5 skipped for lunch on 2026-06-18 -> 45 expected headcount (0.90 factor)
      const adj = computeHeadcountAdjustment(mockAttendances, '2026-06-18', 'Lunch', 50);
      expect(adj.totalResidents).toBe(50);
      expect(adj.skippedCount).toBe(5);
      expect(adj.expectedHeadcount).toBe(45);
      expect(adj.headcountAdjustmentFactor).toBe(0.9);
    });

    it('returns 1.0 factor when no attendances are marked skipped', () => {
      const adj = computeHeadcountAdjustment([], '2026-06-18', 'Lunch', 50);
      expect(adj.skippedCount).toBe(0);
      expect(adj.expectedHeadcount).toBe(50);
      expect(adj.headcountAdjustmentFactor).toBe(1.0);
    });
  });

  describe('computeSmartPrepRecommendations', () => {
    it('computes blended demand, +10% safety buffer, and predicted waste correctly without attendance skips', () => {
      const recs = computeSmartPrepRecommendations(
        mockFoodItems,
        mockLogs,
        mockCartRequests,
        '2026-06-18',
        0.10,
        [], // no skips
        50
      );

      expect(recs.length).toBe(3);

      const biryaniRec = recs.find(r => r.food_id === 'f1')!;
      expect(biryaniRec).toBeDefined();
      expect(biryaniRec.approvedCartDemand).toBe(40);
      expect(biryaniRec.historicalWeekdayAvg).toBe(95);
      
      // Raw Blended Demand: 0.6 * 40 + 0.4 * 95 = 24 + 38 = 62
      expect(biryaniRec.rawBlendedDemand).toBe(62);
      expect(biryaniRec.blendedDemand).toBe(62);
      
      // Safety Buffer (10%): 62 * 0.10 = 6.2 kg
      expect(biryaniRec.safetyBufferKg).toBe(6.2);
      
      // Recommended Prep: 62 + 6.2 = 68.2 kg
      expect(biryaniRec.recommendedPrepQty).toBe(68.2);
      
      // Predicted Waste: 68.2 - 62 = 6.2 kg
      expect(biryaniRec.predictedWasteKg).toBe(6.2);
    });

    it('adjusts prep recommendations down when residents mark skipped meals', () => {
      // 5 residents skipped out of 50 = 10% reduction (factor 0.90)
      const recs = computeSmartPrepRecommendations(
        mockFoodItems,
        mockLogs,
        mockCartRequests,
        '2026-06-18',
        0.10,
        mockAttendances,
        50,
        'Lunch'
      );

      const biryaniRec = recs.find(r => r.food_id === 'f1')!;
      expect(biryaniRec).toBeDefined();
      expect(biryaniRec.rawBlendedDemand).toBe(62);
      expect(biryaniRec.headcountAdjustmentFactor).toBe(0.9);
      
      // Adjusted blended demand: 62 * 0.9 = 55.8 kg
      expect(biryaniRec.blendedDemand).toBe(55.8);
      
      // Buffer (10%): 55.8 * 0.10 = 5.6 kg
      expect(biryaniRec.safetyBufferKg).toBe(5.6);
      
      // Recommended prep: 55.8 + 5.6 = 61.4 kg (significantly reduced from 68.2 kg!)
      expect(biryaniRec.recommendedPrepQty).toBe(61.4);
    });

    it('handles items with no logs using default baseline', () => {
      const recs = computeSmartPrepRecommendations(
        mockFoodItems,
        mockLogs,
        mockCartRequests,
        '2026-06-18'
      );

      const parathaRec = recs.find(r => r.food_id === 'f3')!;
      expect(parathaRec).toBeDefined();
      expect(parathaRec.recommendedPrepQty).toBeGreaterThan(0);
    });
  });

  describe('computeWasteComparisonHistory', () => {
    it('calculates historical and predicted prep and waste for chart visualization', () => {
      const chartData = computeWasteComparisonHistory(mockLogs);
      expect(chartData.length).toBe(4);
      expect(chartData[0].actualWaste).toBe(20);
      // Predicted prep = 100 * 1.10 = 110 kg, predicted waste = 10 kg
      expect(chartData[0].predictedPrep).toBe(110);
      expect(chartData[0].predictedWaste).toBe(10);
    });
  });
});
