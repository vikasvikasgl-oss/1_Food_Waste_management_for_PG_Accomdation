import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import ApproveCarts from '../ApproveCarts';
import * as db from '../../utils/db';

vi.mock('../../utils/db', async () => {
  const actual = await vi.importActual<typeof db>('../../utils/db');
  return {
    ...actual,
    getCartRequests: vi.fn(),
    updateCartRequestStatus: vi.fn(),
    toggleCartRequestFrozen: vi.fn()
  };
});

const mockManager: db.User = {
  user_id: 'manager-1',
  name: 'Chief Mess Manager',
  email: 'manager@test.com',
  role: 'manager'
};

const mockCarts: db.CartRequest[] = [
  {
    cart_id: 'cart-12345678',
    user_id: 'res-1',
    user_name: 'Aarav Kumar',
    items: [
      { food_id: 'food-1', title: 'Paneer Butter Masala', category: 'Main Course', quantity: 2 }
    ],
    status: 'pending',
    date: '2026-10-02',
    frozen: false
  },
  {
    cart_id: 'cart-87654321',
    user_id: 'res-2',
    user_name: 'Priya Sharma',
    items: [
      { food_id: 'food-3', title: 'Masala Dosa', category: 'Breakfast', quantity: 3 }
    ],
    status: 'approved',
    date: '2026-10-02',
    approved_by: 'Chief Mess Manager',
    frozen: true
  }
];

describe('ApproveCarts Component (React Testing Library)', () => {
  const mockShowToast = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(db.getCartRequests).mockResolvedValue(mockCarts);
  });

  it('renders cart requests and filter tabs properly', async () => {
    render(<ApproveCarts user={mockManager} showToast={mockShowToast} />);

    expect(screen.getByText(/Loading Cart Requests/i)).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText('Aarav Kumar')).toBeInTheDocument();
      expect(screen.getByText('Priya Sharma')).toBeInTheDocument();
    });

    expect(screen.getByRole('button', { name: /all Carts/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /pending Carts/i })).toBeInTheDocument();
  });

  it('allows manager to approve a pending cart request', async () => {
    render(<ApproveCarts user={mockManager} showToast={mockShowToast} />);

    await waitFor(() => {
      expect(screen.getByText('Aarav Kumar')).toBeInTheDocument();
    });

    vi.mocked(db.updateCartRequestStatus).mockResolvedValueOnce(undefined as any);

    const approveBtn = screen.getByRole('button', { name: /✓ Approve/i });
    fireEvent.click(approveBtn);

    await waitFor(() => {
      expect(db.updateCartRequestStatus).toHaveBeenCalledWith(
        'cart-12345678',
        'approved',
        mockManager.name
      );
      expect(mockShowToast).toHaveBeenCalledWith(
        expect.stringContaining('approved successfully!'),
        'success'
      );
    });
  });

  it('allows manager to freeze/unfreeze requests', async () => {
    render(<ApproveCarts user={mockManager} showToast={mockShowToast} />);

    await waitFor(() => {
      expect(screen.getByText('Aarav Kumar')).toBeInTheDocument();
    });

    vi.mocked(db.toggleCartRequestFrozen).mockResolvedValueOnce(undefined as any);

    const freezeBtn = screen.getByRole('button', { name: /🔒 Freeze Request/i });
    fireEvent.click(freezeBtn);

    await waitFor(() => {
      expect(db.toggleCartRequestFrozen).toHaveBeenCalledWith('cart-12345678', true);
      expect(mockShowToast).toHaveBeenCalledWith(
        expect.stringContaining('FROZEN'),
        'success'
      );
    });
  });

  it('filters by status when clicking tabs', async () => {
    render(<ApproveCarts user={mockManager} showToast={mockShowToast} />);

    await waitFor(() => {
      expect(screen.getByText('Aarav Kumar')).toBeInTheDocument();
      expect(screen.getByText('Priya Sharma')).toBeInTheDocument();
    });

    const pendingTab = screen.getByRole('button', { name: /pending Carts/i });
    fireEvent.click(pendingTab);

    expect(screen.getByText('Aarav Kumar')).toBeInTheDocument();
  });
});
