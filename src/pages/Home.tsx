import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Video, Github, Twitter, Linkedin, Code, Users } from 'lucide-react';

export default function Home() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-2">
              <Video className="h-8 w-8 text-blue-600" />
              <span className="text-2xl font-bold text-blue-600">DevCall</span>
            </div>
            <div className="flex space-x-4">
              <button 
                onClick={() => navigate('/developer-login')}
                className="px-4 py-2 text-gray-600 hover:text-blue-600 font-medium"
              >
                Dev Login
              </button>
              <button 
                onClick={() => navigate('/customer-login')}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
              >
                Customer Login
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-grow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="text-center">
            <h1 className="text-5xl font-bold text-gray-900 mb-6">
              Instant Video Calls with Top Developers
            </h1>
            <p className="text-xl text-gray-600 mb-12 max-w-3xl mx-auto">
              Book developers in seconds. Pay in crypto. Get started now.
            </p>
            
            <div className="flex flex-col sm:flex-row justify-center gap-6 max-w-lg mx-auto">
              <button 
                onClick={() => navigate('/developer-signup')}
                className="flex-1 group relative px-8 py-4 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all duration-200 flex items-center justify-center space-x-3"
              >
                <Code className="h-5 w-5" />
                <span className="font-semibold">I'm a Developer</span>
              </button>
              <button 
                onClick={() => navigate('/customer-signup')}
                className="flex-1 group relative px-8 py-4 bg-white text-blue-600 border-2 border-blue-600 rounded-xl hover:bg-blue-50 transition-all duration-200 flex items-center justify-center space-x-3"
              >
                <Users className="h-5 w-5" />
                <span className="font-semibold">I'm a Customer</span>
              </button>
            </div>
          </div>

          {/* Feature Grid */}
          <div className="mt-24 grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="p-6 bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow">
              <img 
                src="https://images.unsplash.com/photo-1531482615713-2afd69097998?auto=format&fit=crop&w=800&q=80"
                alt="Quick Booking"
                className="w-full h-48 object-cover rounded-lg mb-4"
              />
              <h3 className="text-xl font-semibold mb-2">Quick Booking</h3>
              <p className="text-gray-600">Connect with developers instantly, no lengthy processes.</p>
            </div>
            <div className="p-6 bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow">
              <img 
                src="https://images.unsplash.com/photo-1526304640581-d334cdbbf45e?auto=format&fit=crop&w=800&q=80"
                alt="Crypto Payments"
                className="w-full h-48 object-cover rounded-lg mb-4"
              />
              <h3 className="text-xl font-semibold mb-2">Crypto Payments</h3>
              <p className="text-gray-600">Secure and fast payments using cryptocurrency.</p>
            </div>
            <div className="p-6 bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow">
              <img 
                src="https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=800&q=80"
                alt="Expert Developers"
                className="w-full h-48 object-cover rounded-lg mb-4"
              />
              <h3 className="text-xl font-semibold mb-2">Expert Developers</h3>
              <p className="text-gray-600">Access to a network of verified professional developers.</p>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-gray-50 border-t">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex space-x-6 mb-4 md:mb-0">
              <a href="#" className="text-gray-600 hover:text-blue-600">About</a>
              <a href="#" className="text-gray-600 hover:text-blue-600">Contact</a>
              <a href="#" className="text-gray-600 hover:text-blue-600">Privacy Policy</a>
            </div>
            <div className="flex space-x-6">
              <a href="#" className="text-gray-600 hover:text-blue-600">
                <Twitter className="h-5 w-5" />
              </a>
              <a href="#" className="text-gray-600 hover:text-blue-600">
                <Linkedin className="h-5 w-5" />
              </a>
              <a href="#" className="text-gray-600 hover:text-blue-600">
                <Github className="h-5 w-5" />
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}