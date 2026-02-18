import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SignupForm } from '../../components/auth/SignupForm';
import { BrowserRouter } from 'react-router-dom';

// Mock the useAuth hook
const mockSignUp = vi.fn();
const mockSignIn = vi.fn();
const mockSignOut = vi.fn();

vi.mock('../../context/AuthContext', async () => {
  const actual = await vi.importActual('../../context/AuthContext');
  return {
    ...actual,
    useAuth: () => ({
      user: null,
      loading: false,
      signUp: mockSignUp,
      signIn: mockSignIn,
      signOut: mockSignOut,
    }),
  };
});

const renderSignupForm = () => {
  return render(
    <BrowserRouter>
      <SignupForm />
    </BrowserRouter>
  );
};

describe('SignupForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders signup form with all required fields', () => {
    renderSignupForm();
    
    expect(screen.getByText(/create your account/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/you@example.com/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/create a strong password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /create free account/i })).toBeInTheDocument();
  });

  it('validates email format on blur', async () => {
    const user = userEvent.setup();
    renderSignupForm();
    
    const emailInput = screen.getByPlaceholderText(/you@example.com/i);
    await user.type(emailInput, 'invalid-email');
    await user.tab();
    
    await waitFor(() => {
      expect(screen.getByText(/please enter a valid email address/i)).toBeInTheDocument();
    });
  });

  it('accepts valid email format', async () => {
    const user = userEvent.setup();
    renderSignupForm();
    
    const emailInput = screen.getByPlaceholderText(/you@example.com/i);
    await user.type(emailInput, 'test@example.com');
    await user.tab();
    
    await waitFor(() => {
      expect(screen.queryByText(/please enter a valid email address/i)).not.toBeInTheDocument();
    });
  });

  it('shows password requirements', async () => {
    const user = userEvent.setup();
    renderSignupForm();
    
    const passwordInput = screen.getByPlaceholderText(/create a strong password/i);
    await user.type(passwordInput, 'weak');
    
    await waitFor(() => {
      // Password strength indicator should be visible
      expect(screen.getByText(/at least 8 characters/i)).toBeInTheDocument();
      expect(screen.getByText(/one uppercase letter/i)).toBeInTheDocument();
      expect(screen.getByText(/one number/i)).toBeInTheDocument();
    });
  });

  it('submits form with valid credentials', async () => {
    const user = userEvent.setup();
    mockSignUp.mockResolvedValue({ user: { id: '123', email: 'test@example.com' }, error: null });
    
    renderSignupForm();
    
    await user.type(screen.getByPlaceholderText(/you@example.com/i), 'test@example.com');
    await user.type(screen.getByPlaceholderText(/create a strong password/i), 'StrongPass123');
    await user.click(screen.getByRole('button', { name: /create free account/i }));
    
    await waitFor(() => {
      expect(mockSignUp).toHaveBeenCalledWith('test@example.com', 'StrongPass123');
    });
  });

  it('displays error message on signup failure', async () => {
    const user = userEvent.setup();
    const errorMessage = 'User already exists';
    mockSignUp.mockResolvedValue({ user: null, error: { message: errorMessage } });
    
    renderSignupForm();
    
    await user.type(screen.getByPlaceholderText(/you@example.com/i), 'existing@example.com');
    await user.type(screen.getByPlaceholderText(/create a strong password/i), 'StrongPass123');
    await user.click(screen.getByRole('button', { name: /create free account/i }));
    
    await waitFor(() => {
      expect(screen.getByText(new RegExp(errorMessage, 'i'))).toBeInTheDocument();
    });
  });

  it('prevents submission with invalid email', async () => {
    const user = userEvent.setup();
    renderSignupForm();
    
    await user.type(screen.getByPlaceholderText(/you@example.com/i), 'invalid-email');
    await user.type(screen.getByPlaceholderText(/create a strong password/i), 'StrongPass123');
    await user.click(screen.getByRole('button', { name: /create free account/i }));
    
    await waitFor(() => {
      expect(mockSignUp).not.toHaveBeenCalled();
    });
  });

  it('prevents submission with weak password', async () => {
    const user = userEvent.setup();
    renderSignupForm();
    
    await user.type(screen.getByPlaceholderText(/you@example.com/i), 'test@example.com');
    await user.type(screen.getByPlaceholderText(/create a strong password/i), 'weak');
    await user.click(screen.getByRole('button', { name: /create free account/i}));
    
    await waitFor(() => {
      expect(mockSignUp).not.toHaveBeenCalled();
    });
  });

  it('handles rate limit errors', async () => {
    const user = userEvent.setup();
    mockSignUp.mockResolvedValue({ 
      user: null, 
      error: { message: 'Email rate limit exceeded. Please wait 60 seconds.' }
    });
    
    renderSignupForm();
    
    await user.type(screen.getByPlaceholderText(/you@example.com/i), 'test@example.com');
    await user.type(screen.getByPlaceholderText(/create a strong password/i), 'StrongPass123');
    await user.click(screen.getByRole('button', { name: /create free account/i }));
    
    await waitFor(() => {
      expect(screen.getByText(/too many signup emails/i)).toBeInTheDocument();
    });
  });
});
