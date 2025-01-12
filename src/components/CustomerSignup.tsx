import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Video, ArrowLeft } from 'lucide-react';
import { signUp } from '../lib/supabase';

export default function CustomerSignup() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      if (password !== confirmPassword) {
        throw new Error('Passwords do not match');
      }

      await signUp(email, password, 'customer');
      alert('Account created successfully! Please check your email to verify your account.');
      navigate('/customer-login');
    } catch (err) {
      if (err instanceof Error) {
        if (err.message.includes('user_already_exists')) {
          setError('An account with this email already exists. Please login instead.');
        } else {
          setError(err.message);
        }
      } else {
        setError('An error occurred during signup. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <Link to="/" className="flex items-center space-x-2 w-fit">
            <Video className="h-8 w-8 text-blue-600" />
            <span className="text-2xl font-bold text-blue-600">DevCall</span>
          </Link>
        </div>
      </header>

      <div className="flex-grow flex items-center justify-center px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full">
          <div className="bg-white p-8 rounded-xl shadow-sm">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl font-bold text-gray-900">Customer Signup</h2>
              <Link
                to="/customer-login"
                className="flex items-center text-sm text-blue-600 hover:text-blue-700"
              >
                <ArrowLeft className="h-4 w-4 mr-1" />
                Back to Login
              </Link>
            </div>
            
            {error && (
              <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-lg text-sm">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
                  placeholder="you@example.com"
                />
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                  Password
                </label>
                <input
                  id="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
                  placeholder="••••••••"
                  minLength={8}
                />
              </div>

              <div>
                <label htmlFor="confirm-password" className="block text-sm font-medium text-gray-700 mb-2">
                  Confirm Password
                </label>
                <input
                  id="confirm-password"
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
                  placeholder="••••••••"
                  minLength={8}
                />
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? 'Creating Account...' : 'Create Account'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}