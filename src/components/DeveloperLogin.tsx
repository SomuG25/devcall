import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Video } from 'lucide-react';
import { signIn } from '../lib/supabase';

export default function DeveloperLogin() {
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
      const response = await signIn(email, password);
      if (!response?.user) {
        throw new Error('Login failed. Please try again.');
      }
      
      // Check if user has developer role
      const isDeveloper = response.user.roles?.some(r => r.role === 'developer');
      if (!isDeveloper) {
        setError('No developer account found. Please sign up first.');
        return;
      }
      
      navigate('/developer/dashboard');
    } catch (err) {
      if (err instanceof Error) {
        if (err.message.includes('Invalid login credentials')) {
          setError('Invalid email or password');
        } else if (err.message.includes('Email not confirmed')) {
          setError('Please check your email to confirm your account first.');
        } else {
          setError(err.message);
        }
      } else {
        setError('An error occurred during login. Please try again.');
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
            <h2 className="text-2xl font-bold text-gray-900 mb-8">Developer Login</h2>
            
            {error && (
              <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-lg text-sm">
                {error}
              </div>
            )}
            
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="dev-email" className="block text-sm font-medium text-gray-700 mb-2">
                  Email
                </label>
                <input
                  id="dev-email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
                  placeholder="you@example.com"
                />
              </div>

              <div>
                <label htmlFor="dev-password" className="block text-sm font-medium text-gray-700 mb-2">
                  Password
                </label>
                <input
                  id="dev-password"
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
                <Link to="/developer-signup" className="text-blue-600 hover:text-blue-700">
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