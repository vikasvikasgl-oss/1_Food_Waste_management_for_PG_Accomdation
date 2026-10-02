import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import OrderFood from '../OrderFood';
import * as db from '../../utils/db';

vi.mock('../../utils/db', async () => {
  const actual = await vi.importActual('../../utils/db');
  return {
    ...actual,
    getFoodItems: vi.fn(),
    createCartRequest: vi.fn(),
    getMealAttendances: vi.fn()
  };
});

const mockUser: db.User = {
  user_id: 'user-123',
  name: 'Test Resident',
  email: 'resident@test.com',
  role: 'resident'
};

const mockFoodItems: db.FoodItem[] = [
  {
    food_id: 'food-1',
    title: 'Paneer Butter Masala',
    category: 'Main Course',
    quantity_available: 15,
    status: 'available',
    cost_per_kg: 240
  },
  {
    food_id: 'food-2',
    title: 'Veg Biryani',
    category: 'Main Course',
    quantity_available: 0,
    status: 'out_of_stock',
    cost_per_kg: 180
  },
  {
    food_id: 'food-3',
    title: 'Masala Dosa',
    category: 'Breakfast',
    quantity_available: 5,
    status: 'low_stock',
    cost_per_kg: 120
  }
];

describe('OrderFood Component (React Testing Library)', () => {
  const mockShowToast = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(db.getFoodItems).mockResolvedValue(mockFoodItems);
    vi.mocked(db.getMealAttendances).mockResolvedValue([]);
  });

  it('renders loading state initially and then displays food items', async () => {
    render(<OrderFood user={mockUser} showToast={mockShowToast} />);

    expect(screen.getByText(/Loading Fresh Menu/i)).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText('Paneer Butter Masala')).toBeInTheDocument();
      expect(screen.getByText('Veg Biryani')).toBeInTheDocument();
      expect(screen.getByText('Masala Dosa')).toBeInTheDocument();
    });
  });

  it('disables "Add to Request" button for out_of_stock items', async () => {
    render(<OrderFood user={mockUser} showToast={mockShowToast} />);

    await waitFor(() => {
      expect(screen.getByText('Veg Biryani')).toBeInTheDocument();
    });

    const outOfStockButton = screen.getByRole('button', { name: /Out of Stock/i });
    expect(outOfStockButton).toBeDisabled();
  });

  it('allows adding available items to cart and placing an order', async () => {
    render(<OrderFood user={mockUser} showToast={mockShowToast} />);

    await waitFor(() => {
      expect(screen.getByText('Paneer Butter Masala')).toBeInTheDocument();
    });

    const addButtons = screen.getAllByRole('button', { name: /Add to Request/i });
    fireEvent.click(addButtons[0]);

    // Cart items counter should display
    expect(screen.getByText(/1 items/i)).toBeInTheDocument();

    // Place Food Request button is enabled
    const submitBtn = screen.getByRole('button', { name: /Place Food Request/i });
    expect(submitBtn).toBeInTheDocument();

    // Click submit order
    vi.mocked(db.createCartRequest).mockResolvedValueOnce({
      cart_id: 'cart-1',
      user_id: mockUser.user_id,
      user_name: mockUser.name,
      items: [{ food_id: 'food-1', title: 'Paneer Butter Masala', category: 'Main Course', quantity: 1 }],
      status: 'pending',
      date: '2026-10-02',
      frozen: false
    });

    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(db.createCartRequest).toHaveBeenCalledWith(
        mockUser.user_id,
        mockUser.name,
        expect.arrayContaining([
          expect.objectContaining({
            food_id: 'food-1',
            quantity: 1
          })
        ])
      );
      expect(mockShowToast).toHaveBeenCalledWith(
        'Your food request has been submitted successfully!',
        'success'
      );
    });
  });

  it('filters dishes by search term correctly', async () => {
    render(<OrderFood user={mockUser} showToast={mockShowToast} />);

    await waitFor(() => {
      expect(screen.getByText('Paneer Butter Masala')).toBeInTheDocument();
    });

    const searchInput = screen.getByPlaceholderText(/Search food item/i);
    fireEvent.change(searchInput, { target: { value: 'Dosa' } });

    expect(screen.getByText('Masala Dosa')).toBeInTheDocument();
    expect(screen.queryByText('Paneer Butter Masala')).not.toBeInTheDocument();
  });
});
