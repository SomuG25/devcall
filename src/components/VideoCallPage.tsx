import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, useMatch } from 'react-router-dom';
import { ArrowLeft, Video, Clock, User, ExternalLink, Building, DollarSign, CreditCard } from 'lucide-react';
import { getCurrentUser, getCustomerProfile } from '../lib/supabase';

type CallProps = {
  id: number;
  developerName: string;
  time: string;
  duration: string;
  project_details: {
    title: string;
    description: string;
    requirements: string;
    goals: string;
    meet_link: string;
  };
};

export default function VideoCallPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const booking = location.state?.booking as CallProps;
  const isDeveloperDashboard = useMatch('/developer/dashboard/*');
  const [customerName, setCustomerName] = useState('');
  const [customerOrg, setCustomerOrg] = useState('');
  const [timeLeft, setTimeLeft] = useState<string>('');
  const [isTimeUp, setIsTimeUp] = useState(false);
  const [showPaymentPrompt, setShowPaymentPrompt] = useState(false);
  const [isPaymentProcessing, setIsPaymentProcessing] = useState(false);

  useEffect(() => {
    const loadCustomerInfo = async () => {
      try {
        const user = await getCurrentUser();
        if (user) {
          const profile = await getCustomerProfile(user.id);
          setCustomerName(profile.full_name || '');
          setCustomerOrg(profile.organization || '');
        }
      } catch (error) {
        console.error('Error loading customer info:', error);
      }
    };

    loadCustomerInfo();
  }, []);

  useEffect(() => {
    if (!booking) return;

    const calculateTimeLeft = () => {
      const bookingTime = new Date(booking.time).getTime();
      const now = new Date().getTime();
      const difference = bookingTime - now;

      if (difference <= 0) {
        setIsTimeUp(true);
        return '00:00:00';
      }

      const hours = Math.floor(difference / (1000 * 60 * 60));
      const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((difference % (1000 * 60)) / 1000);

      return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    };

    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);

    setTimeLeft(calculateTimeLeft());

    return () => clearInterval(timer);
  }, [booking]);

  const handlePayment = async () => {
    setIsPaymentProcessing(true);
    try {
      navigate('/payment', { 
        state: { 
          booking: {
            ...booking,
            status: 'completed',
            payment_status: 'pending_payment'
          }
        }
      });
    } catch (error) {
      console.error('Payment error:', error);
      alert('Payment initiation failed. Please try again.');
    } finally {
      setIsPaymentProcessing(false);
    }
  };

  if (!booking) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Call details not found</h2>
          <button
            onClick={() => navigate(isDeveloperDashboard ? '/developer/dashboard' : '/customer/dashboard', { state: { tab: 'bookings' } })}
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <ArrowLeft className="h-5 w-5 mr-2" />
            {isDeveloperDashboard ? 'Return to Developer Dashboard' : 'Return to Customer Dashboard'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-6 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        <button
          onClick={() => navigate(isDeveloperDashboard ? '/developer/dashboard' : '/customer/dashboard', { state: { tab: 'bookings' } })}
          className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 mb-6"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          {isDeveloperDashboard ? 'Back to Developer Dashboard' : 'Back to Customer Dashboard'}
        </button>

        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="p-6 bg-blue-50 border-b border-blue-100">
            <h1 className="text-2xl font-bold text-gray-900">Video Call Session</h1>
            <p className="text-gray-600 mt-2">Session with {booking.developerName}</p>
          </div>

          <div className="p-6 space-y-6">
            {/* Participants Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div className="p-4 bg-blue-50 rounded-lg">
                <h3 className="font-semibold text-gray-900 mb-2">Developer</h3>
                <div className="flex items-start space-x-3">
                  <User className="h-5 w-5 text-blue-600 mt-0.5" />
                  <div>
                    <p className="font-medium">{booking.developerName}</p>
                  </div>
                </div>
              </div>
              <div className="p-4 bg-blue-50 rounded-lg">
                <h3 className="font-semibold text-gray-900 mb-2">Customer</h3>
                <div className="space-y-2">
                  <div className="flex items-start space-x-3">
                    <User className="h-5 w-5 text-blue-600 mt-0.5" />
                    <div>
                      <p className="font-medium">{customerName}</p>
                    </div>
                  </div>
                  {customerOrg && (
                    <div className="flex items-start space-x-3">
                      <Building className="h-5 w-5 text-blue-600 mt-0.5" />
                      <div>
                        <p className="font-medium">{customerOrg}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Timer Section */}
            <div className="text-center py-8 bg-gray-50 rounded-xl">
              <h2 className="text-xl font-semibold mb-4">Time Until Meeting</h2>
              <div className="text-4xl font-bold font-mono">
                {isTimeUp ? (
                  <span className="text-green-600">Meeting Time!</span>
                ) : (
                  <span className="text-blue-600">{timeLeft}</span>
                )}
              </div>
            </div>

            {/* Payment Prompt */}
            {!isDeveloperDashboard && showPaymentPrompt && (
              <div className="mt-8 p-6 bg-green-50 rounded-xl border border-green-100">
                <div className="flex items-start space-x-4">
                  <div className="p-2 bg-green-100 rounded-full">
                    <DollarSign className="h-6 w-6 text-green-600" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900">Complete Your Payment</h3>
                    <p className="mt-1 text-gray-600">
                      Your session with {booking.developerName} is complete. Please process the payment to finalize the booking.
                    </p>
                    <button
                      onClick={handlePayment}
                      disabled={isPaymentProcessing}
                      className="mt-4 inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                    >
                      <CreditCard className="h-5 w-5 mr-2" />
                      {isPaymentProcessing ? 'Processing...' : 'Pay Now'}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Project Details */}
            <div className="space-y-6 bg-white rounded-xl">
              <div className="border-b border-gray-200 pb-6">
                <h3 className="text-lg font-semibold mb-4">Project Details</h3>
                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium text-gray-900">Title</h4>
                    <p className="text-gray-600">{booking.project_details?.title}</p>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900">Description</h4>
                    <p className="text-gray-600">{booking.project_details?.description}</p>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900">Requirements</h4>
                    <p className="text-gray-600">{booking.project_details?.requirements}</p>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900">Goals</h4>
                    <p className="text-gray-600">{booking.project_details?.goals}</p>
                  </div>
                </div>
              </div>

              {/* Meeting Details */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Meeting Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-2 text-gray-600 mb-1">
                      <Clock className="h-5 w-5" />
                      <span>Time</span>
                    </div>
                    <p className="font-medium">
                      {new Date(booking.time).toLocaleString('en-US', {
                        timeZone: 'Asia/Kolkata',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: 'numeric',
                        minute: 'numeric',
                        hour12: true
                      })} IST
                    </p>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-2 text-gray-600 mb-1">
                      <Clock className="h-5 w-5" />
                      <span>Duration</span>
                    </div>
                    <p className="font-medium">{booking.duration}</p>
                  </div>
                </div>
              </div>

              {/* Join Button */}
              <div className="mt-8 text-center">
                <div className="mb-4">
                  <h3 className="text-lg font-semibold mb-2">Ready to Join?</h3>
                  <p className="text-gray-600">Click below to join your video call session</p>
                </div>
                <a
                  href={booking.project_details?.meet_link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Video className="h-5 w-5 mr-2" />
                  Join Google Meet
                  <ExternalLink className="h-4 w-4 ml-2" />
                </a>
              </div>
            </div>

            {/* Guidelines */}
            <div className="border-t border-gray-200 pt-6">
              <h3 className="font-semibold mb-4">Quick Guidelines</h3>
              <ul className="space-y-2 text-gray-600">
                <li>• Ensure your camera and microphone are working</li>
                <li>• Join from a quiet environment</li>
                <li>• Have your project requirements and questions ready</li>
                <li>• Test your internet connection</li>
                <li>• Be on time - the meeting link will be active at the scheduled time</li>
                {!isDeveloperDashboard && (
                  <li>• Payment will be required after session completion</li>
                )}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}