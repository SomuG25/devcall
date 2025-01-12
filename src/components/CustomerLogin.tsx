import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Video, AlertCircle } from 'lucide-react';
import { signIn, addCustomerRole } from '../lib/supabase';

export default function CustomerLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const { user } = await signIn(email, password);
      
      // Check if user has customer role
      const hasCustomerRole = user.roles?.some(r => r.role === 'customer');
      
      if (hasCustomerRole) {
        navigate('/customer/dashboard');
      } else {
        // User exists but doesn't have customer role
        const isDeveloper = user.roles?.some(r => r.role === 'developer');
        
        if (isDeveloper) {
          // Ask if they want to create a customer account
          if (window.confirm('Would you like to create a customer account with your developer email?')) {
            await addCustomerRole(user.id);
            navigate('/customer/dashboard');
          } else {
            navigate('/developer/dashboard');
          }
        } else {
          setError('No customer account found. Please sign up first.');
        }
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'An error occurred during login';
      
      if (message.includes('Invalid login credentials')) {
        setError('Invalid email or password. Please check your credentials or sign up if you don\'t have an account.');
      } else if (message.includes('Email not confirmed')) {
        setError('Please check your email to confirm your account first.');
      } else {
        setError(message);
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
            <h2 className="text-2xl font-bold text-gray-900 mb-8">Customer Login</h2>
            
            {error && (
              <div className="mb-6 p-3 bg-red-50 text-red-600 rounded-lg flex items-start">
                <AlertCircle className="h-5 w-5 mr-2 flex-shrink-0 mt-0.5" />
                <span className="text-sm">{error}</span>
              </div>
            )}
            
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="customer-email" className="block text-sm font-medium text-gray-700 mb-2">
                  Email
                </label>
                <input
                  id="customer-email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
                  placeholder="you@example.com"
                />
              </div>

              <div>
                <label htmlFor="customer-password" className="block text-sm font-medium text-gray-700 mb-2">
                  Password
                </label>
                <input
                  id="customer-password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
                  placeholder="••••••••"
                />
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
              >
                {isLoading ? 'Logging in...' : 'Login'}
              </button>

              <div className="text-center text-sm text-gray-600">
                Don't have an account?{' '}
                <Link to="/customer-signup" className="text-blue-600 hover:text-blue-700">
                  Sign up now
                </Link>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}