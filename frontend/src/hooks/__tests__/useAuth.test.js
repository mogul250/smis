import { renderHook, act } from '@testing-library/react'
import { AuthProvider } from '../../context/AuthContext'
import { useAuth } from '../useAuth'

// Mock the API service
jest.mock('../../services/api', () => ({
  authAPI: {
    login: jest.fn(),
    logout: jest.fn(),
    refreshToken: jest.fn(),
    getCurrentUser: jest.fn(),
  },
}))

const wrapper = ({ children }) => <AuthProvider>{children}</AuthProvider>

describe('useAuth Hook', () => {
  beforeEach(() => {
    localStorage.clear()
    jest.clearAllMocks()
  })

  it('provides initial auth state', () => {
    const { result } = renderHook(() => useAuth(), { wrapper })

    expect(result.current.user).toBeNull()
    expect(result.current.token).toBeNull()
    expect(result.current.isAuthenticated).toBe(false)
    expect(result.current.loading).toBe(true)
  })

  it('provides login function', () => {
    const { result } = renderHook(() => useAuth(), { wrapper })

    expect(typeof result.current.login).toBe('function')
  })

  it('provides logout function', () => {
    const { result } = renderHook(() => useAuth(), { wrapper })

    expect(typeof result.current.logout).toBe('function')
  })

  it('provides refreshToken function', () => {
    const { result } = renderHook(() => useAuth(), { wrapper })

    expect(typeof result.current.refreshToken).toBe('function')
  })

  it('loads user from localStorage on mount', async () => {
    const mockUser = { id: 1, name: 'Test User', role: 'student' }
    const mockToken = 'mock-token'

    localStorage.setItem('user', JSON.stringify(mockUser))
    localStorage.setItem('token', mockToken)

    const { result } = renderHook(() => useAuth(), { wrapper })

    // Wait for the effect to run
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0))
    })

    expect(result.current.user).toEqual(mockUser)
    expect(result.current.token).toBe(mockToken)
    expect(result.current.isAuthenticated).toBe(true)
    expect(result.current.loading).toBe(false)
  })

  it('handles login success', async () => {
    const { authAPI } = require('../../services/apiService')
    const mockResponse = {
      user: { id: 1, name: 'Test User', role: 'student' },
      token: 'new-token',
    }

    authAPI.login.mockResolvedValue(mockResponse)

    const { result } = renderHook(() => useAuth(), { wrapper })

    await act(async () => {
      await result.current.login('test@example.com', 'password', 'student')
    })

    expect(authAPI.login).toHaveBeenCalledWith({
      email: 'test@example.com',
      password: 'password',
      userType: 'student',
    })

    expect(result.current.user).toEqual(mockResponse.user)
    expect(result.current.token).toBe(mockResponse.token)
    expect(result.current.isAuthenticated).toBe(true)
    expect(localStorage.getItem('user')).toBe(JSON.stringify(mockResponse.user))
    expect(localStorage.getItem('token')).toBe(mockResponse.token)
  })

  it('handles login failure', async () => {
    const { authAPI } = require('../../services/apiService')
    const mockError = new Error('Invalid credentials')

    authAPI.login.mockRejectedValue(mockError)

    const { result } = renderHook(() => useAuth(), { wrapper })

    await expect(
      act(async () => {
        await result.current.login('test@example.com', 'wrong-password', 'student')
      })
    ).rejects.toThrow('Invalid credentials')

    expect(result.current.user).toBeNull()
    expect(result.current.token).toBeNull()
    expect(result.current.isAuthenticated).toBe(false)
  })

  it('handles logout', async () => {
    const { authAPI } = require('../../services/apiService')
    
    // Set up initial authenticated state
    const mockUser = { id: 1, name: 'Test User', role: 'student' }
    const mockToken = 'mock-token'
    localStorage.setItem('user', JSON.stringify(mockUser))
    localStorage.setItem('token', mockToken)

    authAPI.logout.mockResolvedValue()

    const { result } = renderHook(() => useAuth(), { wrapper })

    // Wait for initial load
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0))
    })

    // Perform logout
    await act(async () => {
      await result.current.logout()
    })

    expect(authAPI.logout).toHaveBeenCalled()
    expect(result.current.user).toBeNull()
    expect(result.current.token).toBeNull()
    expect(result.current.isAuthenticated).toBe(false)
    expect(localStorage.getItem('user')).toBeNull()
    expect(localStorage.getItem('token')).toBeNull()
  })

  it('handles token refresh', async () => {
    const { authAPI } = require('../../services/apiService')
    const mockResponse = {
      user: { id: 1, name: 'Test User', role: 'student' },
      token: 'refreshed-token',
    }

    authAPI.refreshToken.mockResolvedValue(mockResponse)

    const { result } = renderHook(() => useAuth(), { wrapper })

    await act(async () => {
      await result.current.refreshToken()
    })

    expect(authAPI.refreshToken).toHaveBeenCalled()
    expect(result.current.user).toEqual(mockResponse.user)
    expect(result.current.token).toBe(mockResponse.token)
    expect(localStorage.getItem('user')).toBe(JSON.stringify(mockResponse.user))
    expect(localStorage.getItem('token')).toBe(mockResponse.token)
  })

  it('handles token refresh failure', async () => {
    const { authAPI } = require('../../services/apiService')
    const mockError = new Error('Token expired')

    authAPI.refreshToken.mockRejectedValue(mockError)

    const { result } = renderHook(() => useAuth(), { wrapper })

    await act(async () => {
      try {
        await result.current.refreshToken()
      } catch (error) {
        // Expected to fail
      }
    })

    expect(result.current.user).toBeNull()
    expect(result.current.token).toBeNull()
    expect(result.current.isAuthenticated).toBe(false)
    expect(localStorage.getItem('user')).toBeNull()
    expect(localStorage.getItem('token')).toBeNull()
  })

  it('handles invalid JSON in localStorage gracefully', async () => {
    localStorage.setItem('user', 'invalid-json')
    localStorage.setItem('token', 'some-token')

    const { result } = renderHook(() => useAuth(), { wrapper })

    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0))
    })

    expect(result.current.user).toBeNull()
    expect(result.current.token).toBeNull()
    expect(result.current.isAuthenticated).toBe(false)
    expect(result.current.loading).toBe(false)
  })
})
