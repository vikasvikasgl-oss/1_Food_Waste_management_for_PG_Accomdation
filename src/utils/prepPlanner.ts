import type { FoodItem, CartRequest, LogEntry, MealAttendance } from './db';

export interface ItemPrepRecommendation {
  food_id: string;
  title: string;
  category: string;
  quantity_available: number;
  status: 'available' | 'low_stock' | 'out_of_stock';
  weekday: string;
  historicalWeekdayAvg: number;
  approvedCartCount: number;
  approvedCartDemand: number;
  rawBlendedDemand: number;
  headcountAdjustmentFactor: number; // e.g. 0.85 when 15% skip meals
  totalResidents: number;
  skippedCount: number;
  expectedHeadcount: number;
  blendedDemand: number;
  safetyBufferKg: number;
  recommendedPrepQty: number;
  predictedWasteKg: number;
  confidenceScore: number; // 0-100%
}

export interface WasteComparisonDataPoint {
  date: string;
  item: string;
  actualPrepared: number;
  actualConsumed: number;
  actualWaste: number;
  predictedPrep: number;
  predictedWaste: number;
}

const WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

/**
 * Gets the day name (e.g. "Monday") for a given YYYY-MM-DD or ISO date string
 */
export const getWeekdayFromDate = (dateStr: string): string => {
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return 'Monday';
  return WEEKDAYS[d.getDay()];
};

/**
 * Maps a food category to its primary meal slot
 */
export const inferMealSlotFromCategory = (category: string): 'Breakfast' | 'Lunch' | 'Dinner' | 'Snacks' => {
  const cat = category.toLowerCase().trim();
  if (cat.includes('breakfast') || cat.includes('morning')) return 'Breakfast';
  if (cat.includes('snack') || cat.includes('dessert') || cat.includes('beverage')) return 'Snacks';
  if (cat.includes('dinner') || cat.includes('night')) return 'Dinner';
  return 'Lunch'; // default to lunch for main course / side dishes
};

/**
 * Filters logs within the last N weeks (default 8 weeks) relative to target date
 */
export const filterRecentLogs = (
  logs: LogEntry[], 
  weeks: number = 8, 
  referenceDateStr?: string
): LogEntry[] => {
  if (!logs || logs.length === 0) return [];
  const refTime = referenceDateStr ? new Date(referenceDateStr).getTime() : Date.now();
  const validRefTime = isNaN(refTime) ? Date.now() : refTime;
  const cutoffTime = validRefTime - weeks * 7 * 24 * 3600 * 1000;
  
  return logs.filter(log => {
    const logTime = new Date(log.date).getTime();
    if (isNaN(logTime)) return true;
    return logTime <= validRefTime && logTime >= cutoffTime;
  });
};

/**
 * Computes the historical average consumed quantity for an item on a specific weekday
 */
export const computeWeekdayAverage = (
  itemTitle: string,
  targetWeekday: string,
  recentLogs: LogEntry[]
): number => {
  const normalizedTitle = itemTitle.trim().toLowerCase();
  
  // 1. Logs for this specific item on this specific weekday
  const matchingWeekdayLogs = recentLogs.filter(log => {
    return (
      log.item.trim().toLowerCase() === normalizedTitle &&
      getWeekdayFromDate(log.date) === targetWeekday
    );
  });

  if (matchingWeekdayLogs.length > 0) {
    const sum = matchingWeekdayLogs.reduce((acc, log) => acc + log.consumed, 0);
    return Math.round((sum / matchingWeekdayLogs.length) * 10) / 10;
  }

  // 2. Fallback to average across all days for this item if no weekday match
  const allItemLogs = recentLogs.filter(
    log => log.item.trim().toLowerCase() === normalizedTitle
  );
  if (allItemLogs.length > 0) {
    const sum = allItemLogs.reduce((acc, log) => acc + log.consumed, 0);
    return Math.round((sum / allItemLogs.length) * 10) / 10;
  }

  return 0;
};

/**
 * Computes approved cart demand and count for a food item on a given target date
 */
export const computeApprovedCartDemand = (
  foodId: string,
  itemTitle: string,
  targetDate: string,
  cartRequests: CartRequest[]
): { count: number; totalQuantity: number } => {
  const normalizedTitle = itemTitle.trim().toLowerCase();
  
  // Find approved carts for this target date (or active approved carts)
  const approvedCarts = cartRequests.filter(cart => {
    const isApproved = cart.status === 'approved';
    const matchesDate = !targetDate || cart.date === targetDate;
    return isApproved && matchesDate;
  });

  let count = 0;
  let totalQuantity = 0;

  for (const cart of approvedCarts) {
    for (const item of cart.items) {
      if (
        item.food_id === foodId ||
        item.title.trim().toLowerCase() === normalizedTitle
      ) {
        count += 1;
        totalQuantity += item.quantity;
      }
    }
  }

  return { count, totalQuantity };
};

/**
 * Computes expected headcount and adjustment ratio for a specific date and slot from MealAttendance
 */
export const computeHeadcountAdjustment = (
  mealAttendances: MealAttendance[] = [],
  targetDate: string,
  slot?: string,
  totalResidents: number = 50
): {
  totalResidents: number;
  skippedCount: number;
  expectedHeadcount: number;
  headcountAdjustmentFactor: number;
} => {
  if (!mealAttendances || mealAttendances.length === 0) {
    return {
      totalResidents,
      skippedCount: 0,
      expectedHeadcount: totalResidents,
      headcountAdjustmentFactor: 1.0
    };
  }

  // Filter records matching target date and slot (if provided)
  const matchingRecords = mealAttendances.filter(att => {
    const matchesDate = !targetDate || att.date === targetDate;
    const matchesSlot = !slot || att.slot.toLowerCase() === slot.toLowerCase();
    return matchesDate && matchesSlot;
  });

  const skippedCount = matchingRecords.filter(att => att.attending === false).length;
  const effectiveCapacity = Math.max(totalResidents, 1);
  const expectedHeadcount = Math.max(1, effectiveCapacity - skippedCount);
  const headcountAdjustmentFactor = Math.max(0.1, expectedHeadcount / effectiveCapacity);

  return {
    totalResidents: effectiveCapacity,
    skippedCount,
    expectedHeadcount,
    headcountAdjustmentFactor: Math.round(headcountAdjustmentFactor * 100) / 100
  };
};

/**
 * Computes Smart Prep Planner recommendations for all inventory food items
 * incorporating historical weekday consumption, approved cart demand,
 * skipped meal attendance headcount adjustments, and a safety buffer.
 */
export const computeSmartPrepRecommendations = (
  foodItems: FoodItem[],
  logs: LogEntry[],
  cartRequests: CartRequest[],
  targetDate: string = new Date().toISOString().split('T')[0],
  bufferPercent: number = 0.10, // 10% safety buffer
  mealAttendances: MealAttendance[] = [],
  totalResidents: number = 50,
  targetSlot?: string
): ItemPrepRecommendation[] => {
  const recentLogs = filterRecentLogs(logs, 8, targetDate);
  const targetWeekday = getWeekdayFromDate(targetDate);

  return foodItems.map(food => {
    const historicalWeekdayAvg = computeWeekdayAverage(food.title, targetWeekday, recentLogs);
    const { count: approvedCartCount, totalQuantity: approvedCartDemand } = computeApprovedCartDemand(
      food.food_id,
      food.title,
      targetDate,
      cartRequests
    );

    // Baseline demand calculation before attendance adjustments
    let rawBlendedDemand = 0;
    if (approvedCartDemand > 0 && historicalWeekdayAvg > 0) {
      rawBlendedDemand = 0.6 * approvedCartDemand + 0.4 * historicalWeekdayAvg;
    } else if (approvedCartDemand > 0) {
      rawBlendedDemand = approvedCartDemand;
    } else if (historicalWeekdayAvg > 0) {
      rawBlendedDemand = historicalWeekdayAvg;
    } else {
      // Fallback baseline if no logs: standard minimum batch
      rawBlendedDemand = food.quantity_available > 0 ? Math.min(food.quantity_available, 20) : 15;
    }

    // Determine relevant slot for this item (or use explicitly passed targetSlot)
    const itemSlot = targetSlot || inferMealSlotFromCategory(food.category);

    // Compute headcount adjustment based on skipped meal attendance for this slot
    const {
      totalResidents: effResidents,
      skippedCount,
      expectedHeadcount,
      headcountAdjustmentFactor
    } = computeHeadcountAdjustment(mealAttendances, targetDate, itemSlot, totalResidents);

    // Scale blended demand by attendance headcount ratio
    const blendedDemand = Math.round(rawBlendedDemand * headcountAdjustmentFactor * 10) / 10;

    // Safety buffer calculation
    const safetyBufferKg = Math.round(blendedDemand * bufferPercent * 10) / 10;
    const recommendedPrepQty = Math.round((blendedDemand + safetyBufferKg) * 10) / 10;

    // Predicted Waste: difference between recommended prep (including buffer) and adjusted consumption
    const predictedWasteKg = Math.round(Math.max(0, recommendedPrepQty - blendedDemand) * 10) / 10;

    // Confidence score based on historical data points and attendance inputs
    const itemLogsCount = recentLogs.filter(
      l => l.item.trim().toLowerCase() === food.title.trim().toLowerCase()
    ).length;
    let confidence = 40 + itemLogsCount * 12 + (approvedCartCount > 0 ? 25 : 0);
    if (mealAttendances.length > 0) confidence += 10;
    const confidenceScore = Math.min(100, confidence);

    return {
      food_id: food.food_id,
      title: food.title,
      category: food.category,
      quantity_available: food.quantity_available,
      status: food.status,
      weekday: targetWeekday,
      historicalWeekdayAvg,
      approvedCartCount,
      approvedCartDemand,
      rawBlendedDemand: Math.round(rawBlendedDemand * 10) / 10,
      headcountAdjustmentFactor,
      totalResidents: effResidents,
      skippedCount,
      expectedHeadcount,
      blendedDemand,
      safetyBufferKg,
      recommendedPrepQty,
      predictedWasteKg,
      confidenceScore
    };
  });
};

/**
 * Computes historical vs predicted waste data points for Recharts visualization
 */
export const computeWasteComparisonHistory = (
  logs: LogEntry[]
): WasteComparisonDataPoint[] => {
  if (!logs || logs.length === 0) return [];

  // Sort logs chronologically
  const sorted = [...logs].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  return sorted.slice(-14).map(log => {
    // Smart predicted prep modeled with safety buffer
    const predictedPrep = Math.round(log.consumed * 1.10 * 10) / 10;
    const predictedWaste = Math.round(Math.max(0, predictedPrep - log.consumed) * 10) / 10;

    return {
      date: log.date,
      item: log.item,
      actualPrepared: log.prepared,
      actualConsumed: log.consumed,
      actualWaste: log.wasted,
      predictedPrep,
      predictedWaste
    };
  });
};
