import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { useRouter } from 'next/router'
import Login from '../login'
import { AuthProvider } from '../../context/AuthContext'

// Mock the useAuth hook
const mockLogin = jest.fn()
const mockUseAuth = {
  user: null,
  isAuthenticated: false,
  loading: false,
  login: mockLogin,
}

jest.mock('../../hooks/useAuth', () => ({
  useAuth: () => mockUseAuth,
}))

// Mock Next.js router
const mockPush = jest.fn()
jest.mock('next/router', () => ({
  useRouter: () => ({
    push: mockPush,
    query: {},
  }),
}))

const wrapper = ({ children }) => <AuthProvider>{children}</AuthProvider>

describe('Login Page', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockUseAuth.user = null
    mockUseAuth.isAuthenticated = false
    mockUseAuth.loading = false
  })

  it('renders login form', () => {
    render(<Login />, { wrapper })

    expect(screen.getByText('Welcome to SMIS')).toBeInTheDocument()
    expect(screen.getByText('School Management Information System')).toBeInTheDocument()
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/user type/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument()
  })

  it('shows all user type options', () => {
    render(<Login />, { wrapper })

    const userTypeSelect = screen.getByLabelText(/user type/i)
    expect(userTypeSelect).toBeInTheDocument()

    // Check if options are present
    expect(screen.getByDisplayValue('Student')).toBeInTheDocument()
  })

  it('handles form input changes', async () => {
    render(<Login />, { wrapper })

    const emailInput = screen.getByLabelText(/email/i)
    const passwordInput = screen.getByLabelText(/password/i)
    const userTypeSelect = screen.getByLabelText(/user type/i)

    fireEvent.change(emailInput, { target: { value: 'test@example.com' } })
    fireEvent.change(passwordInput, { target: { value: 'password123' } })
    fireEvent.change(userTypeSelect, { target: { value: 'teacher' } })

    expect(emailInput.value).toBe('test@example.com')
    expect(passwordInput.value).toBe('password123')
    expect(userTypeSelect.value).toBe('teacher')
  })

  it('validates required fields', async () => {
    render(<Login />, { wrapper })

    const submitButton = screen.getByRole('button', { name: /sign in/i })
    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(screen.getByText('Email is required')).toBeInTheDocument()
      expect(screen.getByText('Password is required')).toBeInTheDocument()
    })

    expect(mockLogin).not.toHaveBeenCalled()
  })

  it('validates email format', async () => {
    render(<Login />, { wrapper })

    const emailInput = screen.getByLabelText(/email/i)
    const passwordInput = screen.getByLabelText(/password/i)
    const submitButton = screen.getByRole('button', { name: /sign in/i })

    fireEvent.change(emailInput, { target: { value: 'invalid-email' } })
    fireEvent.change(passwordInput, { target: { value: 'password123' } })
    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(screen.getByText('Please enter a valid email address')).toBeInTheDocument()
    })

    expect(mockLogin).not.toHaveBeenCalled()
  })

  it('submits form with valid data', async () => {
    mockLogin.mockResolvedValue()

    render(<Login />, { wrapper })

    const emailInput = screen.getByLabelText(/email/i)
    const passwordInput = screen.getByLabelText(/password/i)
    const userTypeSelect = screen.getByLabelText(/user type/i)
    const submitButton = screen.getByRole('button', { name: /sign in/i })

    fireEvent.change(emailInput, { target: { value: 'test@example.com' } })
    fireEvent.change(passwordInput, { target: { value: 'password123' } })
    fireEvent.change(userTypeSelect, { target: { value: 'teacher' } })
    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith('test@example.com', 'password123', 'teacher')
    })
  })

  it('shows loading state during login', async () => {
    mockLogin.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 1000)))

    render(<Login />, { wrapper })

    const emailInput = screen.getByLabelText(/email/i)
    const passwordInput = screen.getByLabelText(/password/i)
    const submitButton = screen.getByRole('button', { name: /sign in/i })

    fireEvent.change(emailInput, { target: { value: 'test@example.com' } })
    fireEvent.change(passwordInput, { target: { value: 'password123' } })
    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(screen.getByText('Signing in...')).toBeInTheDocument()
      expect(submitButton).toBeDisabled()
    })
  })

  it('handles login error', async () => {
    const errorMessage = 'Invalid credentials'
    mockLogin.mockRejectedValue(new Error(errorMessage))

    render(<Login />, { wrapper })

    const emailInput = screen.getByLabelText(/email/i)
    const passwordInput = screen.getByLabelText(/password/i)
    const submitButton = screen.getByRole('button', { name: /sign in/i })

    fireEvent.change(emailInput, { target: { value: 'test@example.com' } })
    fireEvent.change(passwordInput, { target: { value: 'wrongpassword' } })
    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(screen.getByText(errorMessage)).toBeInTheDocument()
    })
  })

  it('redirects authenticated users', () => {
    mockUseAuth.isAuthenticated = true
    mockUseAuth.user = { role: 'student' }

    render(<Login />, { wrapper })

    expect(mockPush).toHaveBeenCalledWith('/student')
  })

  it('redirects to appropriate dashboard after login', async () => {
    mockLogin.mockResolvedValue()
    mockUseAuth.isAuthenticated = true
    mockUseAuth.user = { role: 'teacher' }

    render(<Login />, { wrapper })

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/teacher')
    })
  })

  it('handles keyboard navigation', () => {
    render(<Login />, { wrapper })

    const emailInput = screen.getByLabelText(/email/i)
    const passwordInput = screen.getByLabelText(/password/i)
    const userTypeSelect = screen.getByLabelText(/user type/i)
    const submitButton = screen.getByRole('button', { name: /sign in/i })

    // Tab through form elements
    emailInput.focus()
    expect(emailInput).toHaveFocus()

    fireEvent.keyDown(emailInput, { key: 'Tab' })
    expect(passwordInput).toHaveFocus()

    fireEvent.keyDown(passwordInput, { key: 'Tab' })
    expect(userTypeSelect).toHaveFocus()

    fireEvent.keyDown(userTypeSelect, { key: 'Tab' })
    expect(submitButton).toHaveFocus()
  })

  it('has proper accessibility attributes', () => {
    render(<Login />, { wrapper })

    const form = screen.getByRole('form')
    expect(form).toBeInTheDocument()

    const emailInput = screen.getByLabelText(/email/i)
    expect(emailInput).toHaveAttribute('type', 'email')
    expect(emailInput).toHaveAttribute('required')

    const passwordInput = screen.getByLabelText(/password/i)
    expect(passwordInput).toHaveAttribute('type', 'password')
    expect(passwordInput).toHaveAttribute('required')

    const submitButton = screen.getByRole('button', { name: /sign in/i })
    expect(submitButton).toHaveAttribute('type', 'submit')
  })
})
