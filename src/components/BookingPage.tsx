import React, { useState } from 'react';
import { useNavigate, useLocation, useMatch } from 'react-router-dom';
import { Calendar, Clock, DollarSign, ArrowLeft } from 'lucide-react';
import { createBooking, getCurrentUser } from '../lib/supabase';

type Developer = {
  id: string;
  full_name: string;
  hourly_rate: number;
  profile_picture: string;
  expertise?: string[];
};

export default function BookingPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const developer = location.state?.developer as Developer;
  const isDeveloperDashboard = useMatch('/developer/dashboard/*');
  const [bookingDate, setBookingDate] = useState('');
  const [selectedHour, setSelectedHour] = useState('12');
  const [selectedMinute, setSelectedMinute] = useState('00');
  const [selectedPeriod, setSelectedPeriod] = useState<'AM' | 'PM'>('AM');
  const [duration, setDuration] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [projectDetails, setProjectDetails] = useState<{
    title: string;
    description: string;
    requirements: string;
    goals: string;
    meet_link: string;
  }>({
    title: '',
    description: '',
    requirements: '',
    goals: '',
    meet_link: ''
  });

  if (!developer) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Developer not found</h2>
          <button
            onClick={() => navigate('/customer/dashboard')}
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <ArrowLeft className="h-5 w-5 mr-2" />
            Return to Dashboard
          </button>
        </div>
      </div>
    );
  }

  const totalCost = developer.hourly_rate * duration;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');
    let success = false;

    try {
      const user = await getCurrentUser();
      if (!user) throw new Error('Please log in again to continue.');

      // Convert 12-hour to 24-hour format for database
      let hour = parseInt(selectedHour);
      if (selectedPeriod === 'PM' && hour !== 12) hour += 12;
      if (selectedPeriod === 'AM' && hour === 12) hour = 0;
      
      const timeString = `${hour.toString().padStart(2, '0')}:${selectedMinute}`;
      const bookingDateTime = new Date(`${bookingDate}T${timeString}`);
      
      // Validate booking time is in the future
      if (bookingDateTime <= new Date()) {
        throw new Error('Please select a future date and time for the booking.');
      }

      const booking = await createBooking({
        customer_id: user.id,
        developer_id: developer.id,
        project_details: projectDetails,
        booking_time: bookingDateTime.toISOString(),
        duration: `${duration} hours`,
        amount: totalCost,
        status: 'upcoming' as const,
        payment_status: 'pending' as const,
        call_status: null,
        call_link: `https://meet.devcall.com/${Math.random().toString(36).substring(7)}`
      });

      if (booking) {
        success = true;
        alert('Booking confirmed! You will receive a confirmation email shortly.');
        navigate('/customer/dashboard', { state: { tab: 'bookings' } });
      }
    } catch (error) {
      console.error('Booking error:', error);
      if (error instanceof Error) {
        setError(error.message);
      } else {
        setError('Failed to create booking. Please try again.');
      }
    } finally {
      setIsSubmitting(false);
      if (!success) {
        // Stay on the page if booking failed
        return;
      }
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-6 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <button
          onClick={() => navigate(isDeveloperDashboard ? '/developer/dashboard' : '/customer/dashboard', { state: { tab: 'bookings' } })}
          className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 mb-6"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Dashboard
        </button>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-lg">
            <p className="text-red-600">{error}</p>
          </div>
        )}

        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          {/* Developer Profile Header */}
          <div className="p-6 bg-blue-50 border-b border-blue-100">
            <div className="flex flex-col sm:flex-row sm:items-center space-y-4 sm:space-y-0 sm:space-x-6">
              <img
                src={developer.profile_picture}
                alt={developer.full_name}
                className="w-24 h-24 rounded-full object-cover border-4 border-white shadow-sm"
              />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{developer.full_name}</h1>
                <div className="flex flex-wrap gap-2 mt-2">
                  {(developer.expertise || []).map((skill) => (
                    <span
                      key={skill}
                      className="px-2 py-1 bg-blue-100 text-blue-600 text-sm rounded-full"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
                <p className="mt-2 text-lg font-semibold text-blue-600">
                  ${developer.hourly_rate}/hour
                </p>
              </div>
            </div>
          </div>

          {/* Booking Form */}
          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Date
                </label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                  <input
                    type="date"
                    required
                    value={bookingDate}
                    onChange={(e) => setBookingDate(e.target.value)}
                    min={new Date().toISOString().split('T')[0]}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Time
                  <span className="ml-2 text-gray-500">(IST)</span>
                </label>
                <div className="flex items-center space-x-2">
                  <Clock className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                  <div className="relative flex-1">
                    <select
                      value={selectedHour}
                      onChange={(e) => setSelectedHour(e.target.value)}
                      className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 appearance-none bg-white"
                    >
                      {Array.from({ length: 12 }, (_, i) => (i + 1).toString().padStart(2, '0')).map(hour => (
                        <option key={hour} value={hour}>{hour}</option>
                      ))}
                    </select>
                  </div>
                  <span className="text-gray-600">:</span>
                  <select
                    value={selectedMinute}
                    onChange={(e) => setSelectedMinute(e.target.value)}
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 appearance-none bg-white"
                  >
                    {Array.from({ length: 12 }, (_, i) => (i * 5).toString().padStart(2, '0')).map(minute => (
                      <option key={minute} value={minute}>{minute}</option>
                    ))}
                  </select>
                  <select
                    value={selectedPeriod}
                    onChange={(e) => setSelectedPeriod(e.target.value as 'AM' | 'PM')}
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 appearance-none bg-white"
                  >
                    <option value="AM">AM</option>
                    <option value="PM">PM</option>
                  </select>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Duration (hours)
              </label>
              <div className="relative">
                <Clock className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                <input
                  type="number"
                  required
                  min="0.5"
                  max="4"
                  step="0.5"
                  value={duration}
                  onChange={(e) => setDuration(Number(e.target.value))}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <p className="mt-1 text-sm text-gray-500">
                Minimum 30 minutes, maximum 4 hours per session
              </p>
            </div>

            {/* Project Details */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">Project Details</h3>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Project Title
                </label>
                <input
                  type="text"
                  required
                  value={projectDetails.title}
                  onChange={(e) => setProjectDetails(prev => ({ ...prev, title: e.target.value }))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="e.g., E-commerce Website Development"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Project Description
                </label>
                <textarea
                  required
                  value={projectDetails.description}
                  onChange={(e) => setProjectDetails(prev => ({ ...prev, description: e.target.value }))}
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Describe your project in detail..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Technical Requirements
                </label>
                <textarea
                  required
                  value={projectDetails.requirements}
                  onChange={(e) => setProjectDetails(prev => ({ ...prev, requirements: e.target.value }))}
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="List any specific technical requirements or technologies needed..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Project Goals
                </label>
                <textarea
                  required
                  value={projectDetails.goals}
                  onChange={(e) => setProjectDetails(prev => ({ ...prev, goals: e.target.value }))}
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="What are the main goals you want to achieve in this session?"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Google Meet Link
                </label>
                <div className="relative">
                  <input
                    type="url"
                    required
                    value={projectDetails.meet_link}
                    onChange={(e) => setProjectDetails(prev => ({ ...prev, meet_link: e.target.value }))}
                    placeholder="https://meet.google.com/xxx-xxxx-xxx"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <p className="mt-1 text-sm text-gray-500">
                  Add your Google Meet link for the session. This is required to confirm the booking.
                </p>
              </div>
            </div>

            {/* Cost Summary */}
            <div className="bg-gray-50 p-6 rounded-lg">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Cost Summary</h3>
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-gray-600">
                    {duration} hour{duration !== 1 ? 's' : ''} × ${developer.hourlyRate}/hour
                  </p>
                </div>
                <div className="flex items-center">
                  <DollarSign className="h-5 w-5 text-gray-400 mr-1" />
                  <span className="text-xl font-bold text-gray-900">{totalCost.toFixed(2)}</span>
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row sm:space-x-4 space-y-4 sm:space-y-0">
              <button
                type="button"
                disabled={isSubmitting}
                onClick={() => navigate('/customer/dashboard')}
                className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                {isSubmitting ? 'Creating Booking...' : 'Confirm Booking'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}