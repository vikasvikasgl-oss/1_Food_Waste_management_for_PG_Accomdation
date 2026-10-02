export interface User {
  user_id: string;
  name: string;
  email: string;
  role: 'resident' | 'manager';
  password?: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface FoodItem {
  food_id: string;
  title: string;
  category: string;
  quantity_available: number;
  cost_per_kg?: number;
  status: 'available' | 'low_stock' | 'out_of_stock';
}

export interface CartRequest {
  cart_id: string;
  user_id: string;
  user_name?: string;
  status: 'pending' | 'approved' | 'rejected';
  approved_by?: string;
  frozen: boolean;
  date: string;
  items: CartItemDetail[];
}

export interface CartItemDetail {
  food_id: string;
  title: string;
  category: string;
  quantity: number;
}

export interface CartItem {
  cart_id: string;
  food_id: string;
  quantity: number;
}

export interface Feedback {
  feedback_id: string;
  user_id: string;
  user_name: string;
  target_type: 'food' | 'system' | 'cart';
  target_id: string;
  target_title: string;
  rating: number;
  comment: string;
  resolved: boolean;
  date: string;
}

export interface Complaint {
  complaint_id: string;
  user_id: string;
  user_name: string;
  subject: string;
  priority: 'low' | 'medium' | 'high';
  status: 'open' | 'in_progress' | 'resolved';
  description: string;
  date: string;
}

export interface LogEntry {
  id: string;
  item: string;
  prepared: number;
  consumed: number;
  donated?: number;
  wasted: number;
  date: string;
}

export interface Donation {
  id: string;
  item: string;
  quantity_kg: number;
  recipient_ngo: string;
  ngo_id?: string;
  date: string;
  notes?: string;
  logged_by?: string;
  createdAt?: string;
}

export interface NGO {
  id: string;
  name: string;
  contact_person?: string;
  phone?: string;
  email?: string;
  address?: string;
  active?: boolean;
}

export interface MealAttendance {
  id: string;
  user_id: string;
  user_name?: string;
  date: string; // YYYY-MM-DD
  slot: 'Breakfast' | 'Lunch' | 'Dinner' | 'Snacks' | string;
  attending: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface MealAttendanceSummary {
  date: string;
  slot: string;
  totalResidents: number;
  attendingCount: number;
  skippedCount: number;
  expectedHeadcount: number;
}

// -------------------------------------------------------------
// JWT Token Storage & Authenticated Fetch Helper
// -------------------------------------------------------------

const TOKEN_KEY = 'hostel_jwt_token';

export const getAuthToken = (): string | null => {
  return localStorage.getItem(TOKEN_KEY);
};

export const setAuthToken = (token: string | null): void => {
  if (token) {
    localStorage.setItem(TOKEN_KEY, token);
  } else {
    localStorage.removeItem(TOKEN_KEY);
  }
};

const handleResponse = async (res: Response) => {
  if (!res.ok) {
    let errorMsg = `Request failed with status ${res.status}`;
    try {
      const data = await res.json();
      if (data && data.error) {
        errorMsg = data.error;
      }
    } catch {
      const errText = await res.text().catch(() => '');
      if (errText) errorMsg = errText;
    }
    throw new Error(errorMsg);
  }
  return res.json();
};

export const getApiUrl = (endpoint: string): string => {
  const envUrl = typeof import.meta !== 'undefined' && import.meta.env?.VITE_API_URL
    ? String(import.meta.env.VITE_API_URL).trim()
    : '';

  if (!envUrl) {
    return endpoint;
  }

  const base = envUrl.replace(/\/+$/, '');
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;

  if (base.endsWith('/api') && cleanEndpoint.startsWith('/api')) {
    return `${base}${cleanEndpoint.slice(4)}`;
  }
  return `${base}${cleanEndpoint}`;
};

export const authFetch = async (url: string, options: RequestInit = {}): Promise<Response> => {
  const token = getAuthToken();
  const headers = new Headers(options.headers || {});
  
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const targetUrl = getApiUrl(url);

  return fetch(targetUrl, {
    ...options,
    headers
  });
};

export const seedDatabase = (): void => {
  console.log('Client-side seedDatabase is handled by backend server.');
};

// -------------------------------------------------------------
// Authentication & User Operations
// -------------------------------------------------------------

export const loginUser = async (email: string, password: string): Promise<AuthResponse> => {
  const res = await authFetch('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });
  const data: AuthResponse = await handleResponse(res);
  if (data.token) {
    setAuthToken(data.token);
  }
  return data;
};

export const registerUser = async (user: Omit<User, 'user_id'> & { password?: string }): Promise<AuthResponse> => {
  const res = await authFetch('/api/users', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(user)
  });
  const data: AuthResponse = await handleResponse(res);
  if (data.token) {
    setAuthToken(data.token);
  }
  return data;
};

export const getUsers = async (): Promise<User[]> => {
  const res = await authFetch('/api/users');
  return handleResponse(res);
};

// -------------------------------------------------------------
// FoodItem Operations
// -------------------------------------------------------------

export const getFoodItems = async (): Promise<FoodItem[]> => {
  const res = await authFetch('/api/food-items');
  return handleResponse(res);
};

export const saveFoodItem = async (item: Omit<FoodItem, 'food_id'>): Promise<FoodItem> => {
  const res = await authFetch('/api/food-items', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(item)
  });
  return handleResponse(res);
};

export const updateFoodItem = async (updatedItem: FoodItem): Promise<void> => {
  const res = await authFetch(`/api/food-items/${updatedItem.food_id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(updatedItem)
  });
  await handleResponse(res);
};

export const deleteFoodItem = async (food_id: string): Promise<void> => {
  const res = await authFetch(`/api/food-items/${food_id}`, {
    method: 'DELETE'
  });
  await handleResponse(res);
};

// -------------------------------------------------------------
// CartRequest Operations
// -------------------------------------------------------------

export const getCartRequests = async (): Promise<CartRequest[]> => {
  const res = await authFetch('/api/cart-requests');
  return handleResponse(res);
};

export const createCartRequest = async (user_id: string, user_name: string, items: CartItemDetail[]): Promise<CartRequest> => {
  const res = await authFetch('/api/cart-requests', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ user_id, user_name, items })
  });
  return handleResponse(res);
};

export const updateCartRequestStatus = async (cart_id: string, status: 'approved' | 'rejected', managerName: string): Promise<void> => {
  const res = await authFetch(`/api/cart-requests/${cart_id}/status`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status, approved_by: managerName })
  });
  await handleResponse(res);
};

export const toggleCartRequestFrozen = async (cart_id: string, frozen: boolean): Promise<void> => {
  const res = await authFetch(`/api/cart-requests/${cart_id}/frozen`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ frozen })
  });
  await handleResponse(res);
};

// -------------------------------------------------------------
// Feedback Operations
// -------------------------------------------------------------

export const getFeedbacks = async (): Promise<Feedback[]> => {
  const res = await authFetch('/api/feedbacks');
  return handleResponse(res);
};

export const createFeedback = async (feedback: Omit<Feedback, 'feedback_id' | 'date' | 'resolved'>): Promise<Feedback> => {
  const res = await authFetch('/api/feedbacks', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(feedback)
  });
  return handleResponse(res);
};

export const resolveFeedback = async (feedback_id: string): Promise<void> => {
  const res = await authFetch(`/api/feedbacks/${feedback_id}/resolve`, {
    method: 'PUT'
  });
  await handleResponse(res);
};

// -------------------------------------------------------------
// Complaint Operations
// -------------------------------------------------------------

export const getComplaints = async (): Promise<Complaint[]> => {
  const res = await authFetch('/api/complaints');
  return handleResponse(res);
};

export const createComplaint = async (complaint: Omit<Complaint, 'complaint_id' | 'date' | 'status'>): Promise<Complaint> => {
  const res = await authFetch('/api/complaints', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(complaint)
  });
  return handleResponse(res);
};

export const updateComplaintStatus = async (complaint_id: string, status: 'open' | 'in_progress' | 'resolved'): Promise<void> => {
  const res = await authFetch(`/api/complaints/${complaint_id}/status`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status })
  });
  await handleResponse(res);
};

export const updateComplaintPriority = async (complaint_id: string, priority: 'low' | 'medium' | 'high'): Promise<void> => {
  const res = await authFetch(`/api/complaints/${complaint_id}/priority`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ priority })
  });
  await handleResponse(res);
};

// -------------------------------------------------------------
// Daily Waste Logs Operations
// -------------------------------------------------------------

export const getLogs = async (): Promise<LogEntry[]> => {
  const res = await authFetch('/api/logs');
  return handleResponse(res);
};

export const saveLogEntry = async (log: Omit<LogEntry, 'id' | 'wasted'>): Promise<LogEntry> => {
  const res = await authFetch('/api/logs', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(log)
  });
  return handleResponse(res);
};

export const deleteLogEntry = async (id: string): Promise<void> => {
  const res = await authFetch(`/api/logs/${id}`, {
    method: 'DELETE'
  });
  await handleResponse(res);
};

// -------------------------------------------------------------
// Meal Attendance & Headcount Operations
// -------------------------------------------------------------

export const getMealAttendances = async (params?: { date?: string; slot?: string; user_id?: string }): Promise<MealAttendance[]> => {
  const query = new URLSearchParams();
  if (params?.date) query.append('date', params.date);
  if (params?.slot) query.append('slot', params.slot);
  if (params?.user_id) query.append('user_id', params.user_id);
  
  const url = `/api/meal-attendance${query.toString() ? `?${query.toString()}` : ''}`;
  const res = await authFetch(url);
  return handleResponse(res);
};

export const saveMealAttendance = async (attendance: { date: string; slot: string; attending: boolean }): Promise<MealAttendance> => {
  const res = await authFetch('/api/meal-attendance', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(attendance)
  });
  return handleResponse(res);
};

export const getMealAttendanceSummary = async (date?: string, slot?: string): Promise<MealAttendanceSummary> => {
  const query = new URLSearchParams();
  if (date) query.append('date', date);
  if (slot) query.append('slot', slot);
  
  const url = `/api/meal-attendance/summary${query.toString() ? `?${query.toString()}` : ''}`;
  const res = await authFetch(url);
  return handleResponse(res);
};

// -------------------------------------------------------------
// Surplus Food Donations & NGO Operations
// -------------------------------------------------------------

export const getDonations = async (): Promise<Donation[]> => {
  const res = await authFetch('/api/donations');
  return handleResponse(res);
};

export const createDonation = async (donation: Omit<Donation, 'id'>): Promise<Donation> => {
  const res = await authFetch('/api/donations', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(donation)
  });
  return handleResponse(res);
};

export const deleteDonation = async (id: string): Promise<void> => {
  const res = await authFetch(`/api/donations/${id}`, {
    method: 'DELETE'
  });
  await handleResponse(res);
};

export const getNGOs = async (): Promise<NGO[]> => {
  const res = await authFetch('/api/ngos');
  return handleResponse(res);
};

export const createNGO = async (ngo: Omit<NGO, 'id' | 'active'>): Promise<NGO> => {
  const res = await authFetch('/api/ngos', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(ngo)
  });
  return handleResponse(res);
};

export const deleteNGO = async (id: string): Promise<void> => {
  const res = await authFetch(`/api/ngos/${id}`, {
    method: 'DELETE'
  });
  await handleResponse(res);
};

// -------------------------------------------------------------
// Notifications Operations
// -------------------------------------------------------------

export interface InAppNotification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: 'cart_approved' | 'cart_rejected' | 'complaint_status' | 'new_menu' | 'leaderboard' | 'system';
  read: boolean;
  link?: string;
  createdAt: string;
}

export const getNotifications = async (): Promise<InAppNotification[]> => {
  const res = await authFetch('/api/notifications');
  return handleResponse(res);
};

export const markNotificationRead = async (id: string): Promise<InAppNotification> => {
  const res = await authFetch(`/api/notifications/${id}/read`, {
    method: 'PUT'
  });
  return handleResponse(res);
};

export const markAllNotificationsRead = async (): Promise<{ success: boolean }> => {
  const res = await authFetch('/api/notifications/read-all', {
    method: 'PUT'
  });
  return handleResponse(res);
};

export const deleteNotification = async (id: string): Promise<void> => {
  const res = await authFetch(`/api/notifications/${id}`, {
    method: 'DELETE'
  });
  await handleResponse(res);
};

// -------------------------------------------------------------
// Zero Waste Hero Leaderboard Operations
// -------------------------------------------------------------

export interface LeaderboardEntry {
  user_id: string;
  name: string;
  email: string;
  score: number;
  meals_skipped: number;
  meals_attended: number;
  approved_carts: number;
  rejected_carts: number;
  total_carts: number;
  reliability_rate: number;
  feedbacks_count: number;
  food_saved_kg: number;
  co2_saved_kg: number;
  rank: number;
  tier: 'Platinum' | 'Gold' | 'Silver' | 'Bronze';
  badge: string;
}

export const getLeaderboard = async (): Promise<LeaderboardEntry[]> => {
  const res = await authFetch('/api/leaderboard');
  return handleResponse(res);
};

// -------------------------------------------------------------
// Dish Quality & Waste Correlation Analytics Operations
// -------------------------------------------------------------

export interface DishQualityComment {
  user_name: string;
  rating: number;
  comment: string;
  date: string;
}

export interface DishQualityItem {
  food_id: string;
  title: string;
  category: string;
  quantity_available: number;
  cost_per_kg: number;
  status: 'available' | 'low_stock' | 'out_of_stock';
  average_rating: number;
  review_count: number;
  prepared_kg: number;
  consumed_kg: number;
  wasted_kg: number;
  waste_percent: number;
  flag_review_recipe: boolean;
  rating_tier: 'Excellent' | 'Good' | 'Needs Improvement' | 'Poor' | 'Unrated';
  recent_comments?: DishQualityComment[];
}

export interface DishQualityAnalytics {
  dishes: DishQualityItem[];
  top3Best: DishQualityItem[];
  top3Worst: DishQualityItem[];
  reviewRecipeDishes: DishQualityItem[];
  correlationSummary: {
    lowRatedWasteAvg: number;
    highRatedWasteAvg: number;
    ratioMultiplier: string;
    insightText: string;
  };
}

export const getDishQualityAnalytics = async (): Promise<DishQualityAnalytics> => {
  const res = await authFetch('/api/analytics/dish-quality');
  return handleResponse(res);
};


