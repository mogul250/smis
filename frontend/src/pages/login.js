import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useAuth } from '../hooks/useAuth';
import { FiUser, FiLock, FiEye, FiEyeOff, FiArrowLeft, FiAlertCircle, FiBookOpen } from 'react-icons/fi';
import Button from '../components/common/Button';
import Input from '../components/common/Input';
import Alert from '../components/common/Alert';

const LoginPage = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    userType: 'staff' // 'staff' or 'student'
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { login, isAuthenticated, error, clearError } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isAuthenticated) {
      router.push('/dashboard');
    }
  }, [isAuthenticated, router]);

  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => {
        clearError();
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [error, clearError]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const result = await login(
        { email: formData.email, password: formData.password },
        formData.userType === 'student'
      );

      if (result.success) {
        router.push('/dashboard');
      }
    } catch (err) {
      console.error('Login error:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <Head>
        <title>Sign In - SMIS</title>
        <meta name="description" content="Sign in to your SMIS account to access the school management system" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <div className="min-h-screen flex">
        {/* Left Column - Branding Section */}
        <div className="hidden lg:flex lg:w-1/2 bg-primary-blue relative overflow-hidden">
          {/* Background Pattern */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-20 left-10 w-32 h-32 border-2 border-white rounded-full"></div>
            <div className="absolute top-40 right-20 w-24 h-24 border-2 border-white rounded-full"></div>
            <div className="absolute bottom-32 left-20 w-40 h-40 border-2 border-white rounded-full"></div>
            <div className="absolute bottom-20 right-10 w-28 h-28 border-2 border-white rounded-full"></div>
          </div>
          
          <div className="relative z-10 flex flex-col justify-center px-12 text-white">
            {/* Logo */}
            {/* <div className="mb-8">
              <div className="w-16 h-16 bg-white rounded-lg flex items-center justify-center mb-4">
                <FiBookOpen className="w-8 h-8 text-primary-blue" />
              </div>
            </div> */}
            
            {/* Main Message */}
            <h1 className="text-4xl font-bold mb-4">
              Hello! 👋
            </h1>
            
            <p className="text-xl text-blue-100 mb-8 leading-relaxed">
              Streamline your school operations with our comprehensive management system. 
              Get highly productive through automation and save tons of time!
            </p>
            
            {/* Features List */}
            <div className="space-y-3 mb-8">
              <div className="flex items-center">
                <div className="w-2 h-2 bg-white rounded-full mr-3"></div>
                <span className="text-blue-100">Student & Staff Management</span>
              </div>
              <div className="flex items-center">
                <div className="w-2 h-2 bg-white rounded-full mr-3"></div>
                <span className="text-blue-100">Academic Calendar & Timetables</span>
              </div>
              <div className="flex items-center">
                <div className="w-2 h-2 bg-white rounded-full mr-3"></div>
                <span className="text-blue-100">Real-time Analytics & Reports</span>
              </div>
            </div>
            
            {/* Copyright */}
            <div className="text-blue-200 text-sm">
              © 2025 School Management Information System. All rights reserved.
            </div>
          </div>
        </div>

        {/* Right Column - Login Form */}
        <div className="w-full lg:w-1/2 flex items-center justify-center p-8">
          <div className="w-full max-w-md">
            {/* Mobile Header */}
            <div className="lg:hidden text-center mb-8">
              <Link href="/" className="inline-flex items-center text-primary-blue hover:text-primary-light mb-4">
                <FiArrowLeft className="w-4 h-4 mr-2" />
                Back to Home
              </Link>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">SMIS</h1>
            </div>

            {/* Desktop Header */}
            {/* <div className="hidden lg:block mb-8">
              <h1 className="text-2xl font-bold text-gray-900 mb-2">SMIS</h1>
            </div> */}

            <h2 className="text-3xl font-bold text-gray-900 mb-2">Welcome Back!</h2>
            
            <p className="text-gray-600 mb-8">
              Don't have an account?{' '}
              <Link href="/register" className="text-primary-light hover:text-primary-blue underline">
                Create a new account now
              </Link>
              , it's FREE! Takes less than a minute.
            </p>

            {/* Login Form */}
            <div className="space-y-6">
              {error && (
                <Alert variant="error" className="mb-6">
                  <FiAlertCircle className="w-5 h-5 mr-2" />
                  {error}
                </Alert>
              )}

              <form onSubmit={handleSubmit} className="space-y-6">
                {/* User Type Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">Login as</label>
                  <div className="grid grid-cols-2 gap-4">
                    <label className={`relative flex items-center justify-center p-3 border rounded-lg cursor-pointer transition-colors ${
                      formData.userType === 'staff' 
                        ? 'border-primary-blue bg-blue-50 text-primary-blue' 
                        : 'border-gray-300 hover:border-gray-400'
                    }`}>
                      <input
                        type="radio"
                        name="userType"
                        value="staff"
                        checked={formData.userType === 'staff'}
                        onChange={handleChange}
                        className="sr-only"
                      />
                      <div className="text-center">
                        <div className="font-medium">Staff</div>
                        <div className="text-xs text-gray-500">Teachers & Admin</div>
                      </div>
                    </label>
                    <label className={`relative flex items-center justify-center p-3 border rounded-lg cursor-pointer transition-colors ${
                      formData.userType === 'student' 
                        ? 'border-primary-blue bg-blue-50 text-primary-blue' 
                        : 'border-gray-300 hover:border-gray-400'
                    }`}>
                      <input
                        type="radio"
                        name="userType"
                        value="student"
                        checked={formData.userType === 'student'}
                        onChange={handleChange}
                        className="sr-only"
                      />
                      <div className="text-center">
                        <div className="font-medium">Student</div>
                        <div className="text-xs text-gray-500">Student Portal</div>
                      </div>
                    </label>
                  </div>
                </div>

                {/* Email Field */}
                <div>
                  <input
                    name="email"
                    type="email"
                    required
                    value={formData.email}
                    onChange={handleChange}
                    className="w-full py-3 border-0 border-b-2 border-gray-300 focus:border-primary-blue focus:outline-none focus:ring-0 bg-transparent text-gray-900 placeholder-gray-500"
                    placeholder="Enter your email address"
                  />
                </div>

                {/* Password Field */}
                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                    Password
                  </label>
                  <div className="relative">
                    <input
                      id="password"
                      name="password"
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={formData.password}
                      onChange={handleChange}
                      className="w-full py-3 border-0 border-b-2 border-gray-300 focus:border-primary-blue focus:outline-none focus:ring-0 bg-transparent text-gray-900 placeholder-gray-500 pr-10"
                      placeholder="Enter your password"
                    />
                    <button
                      type="button"
                      className="absolute inset-y-0 right-0 flex items-center"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? (
                        <FiEyeOff className="h-5 w-5 text-gray-400" />
                      ) : (
                        <FiEye className="h-5 w-5 text-gray-400" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-gray-900 text-white py-3 px-4 rounded-md font-medium hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {isSubmitting ? 'Signing In...' : 'Login Now'}
                </button>
              </form>

              {/* Footer Links */}
              <div className="text-center">
                <a
                  href="/forgot-password"
                  className="text-sm text-gray-600 hover:text-primary-blue underline"
                >
                  Forget password? Click here
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default LoginPage;