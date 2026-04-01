import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { LoginForm } from '../../components/auth/LoginForm';

const {
  mockSignIn,
  mockSignOut,
  mockSignUp,
  mockSignInWithGoogle,
  mockConsumePendingOAuthErrorCode,
} = vi.hoisted(() => ({
  mockSignIn: vi.fn(),
  mockSignOut: vi.fn(),
  mockSignUp: vi.fn(),
  mockSignInWithGoogle: vi.fn(),
  mockConsumePendingOAuthErrorCode: vi.fn(),
}));

vi.mock('../../context/AuthContext', async () => {
  const actual = await vi.importActual('../../context/AuthContext');
  return {
    ...actual,
    useAuth: () => ({
      user: null,
      loading: false,
      signIn: mockSignIn,
      signUp: mockSignUp,
      signOut: mockSignOut,
    }),
  };
});

vi.mock('../../services/supabaseService', () => ({
  signInWithGoogle: mockSignInWithGoogle,
  consumePendingOAuthErrorCode: mockConsumePendingOAuthErrorCode,
}));

const renderLoginForm = (initialPath = '/login') =>
  render(
    <MemoryRouter initialEntries={[initialPath]}>
      <Routes>
        <Route path="/login" element={<LoginForm />} />
      </Routes>
    </MemoryRouter>
  );

describe('LoginForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockConsumePendingOAuthErrorCode.mockReturnValue(null);
  });

  it('shows no-account message from URL error param', async () => {
    renderLoginForm('/login?error=no_account');

    expect(
      await screen.findByText(/No account exists for this login\. Please sign up first\./i)
    ).toBeInTheDocument();
  });

  it('shows pending auth error from storage fallback', async () => {
    mockConsumePendingOAuthErrorCode.mockReturnValue('no_account');

    renderLoginForm('/login');

    expect(
      await screen.findByText(/No account exists for this login\. Please sign up first\./i)
    ).toBeInTheDocument();
  });
});
