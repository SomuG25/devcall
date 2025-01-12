import React from 'react';
import { useNavigate, useLocation, useMatch } from 'react-router-dom';
import { ArrowLeft, Wallet, Shield, CheckCircle, Copy, User, Building, Clock } from 'lucide-react';
import { getDeveloperProfile, validateAndUpdatePayment } from '../lib/supabase';

type PaymentProps = {
  id: number;
  developerName: string;
  developer: {
    wallet_address: string;
    hourly_rate: number;
    bio: string;
    location: string;
    profile_picture: string;
  };
  amount: number;
  duration: string;
  time: string;
  project_details: {
    title: string;
    description: string;
    requirements: string;
    goals: string;
  };
};

export default function PaymentPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [booking, setBooking] = React.useState<PaymentProps | null>(location.state?.booking);
  const isDeveloperDashboard = useMatch('/developer/dashboard/*');
  const [copied, setCopied] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState('');
  const [txHash, setTxHash] = React.useState('');
  const [isValidating, setIsValidating] = React.useState(false);
  const [validationError, setValidationError] = React.useState('');

  React.useEffect(() => {
    const loadDeveloperInfo = async () => {
      if (!booking) return;
      
      try {
        setIsLoading(true);
        const developerData = await getDeveloperProfile(booking.developer.id);
        
        if (developerData) {
          setBooking(prev => ({
            ...prev!,
            developer: {
              ...prev!.developer,
              wallet_address: developerData.wallet_address,
              hourly_rate: developerData.hourly_rate,
              bio: developerData.bio,
              location: developerData.location,
              profile_picture: developerData.profile_picture
            }
          }));
        }
      } catch (err) {
        console.error('Error loading developer info:', err);
        setError('Failed to load developer information');
      } finally {
        setIsLoading(false);
      }
    };

    loadDeveloperInfo();
  }, []);

  const handleCopyAddress = async () => {
    if (!booking.developer.wallet_address) {
      alert('Developer wallet address not available');
      return;
    }

    try {
      await navigator.clipboard.writeText(booking.developer.wallet_address);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  if (!booking) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Booking not found</h2>
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

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading payment details...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-red-600 mb-4">{error}</h2>
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

  const handlePaymentValidation = async () => {
    if (!txHash.trim()) {
      setValidationError('Please enter the transaction hash');
      return;
    }

    setIsValidating(true);
    setValidationError('');

    try {
      const result = await validateAndUpdatePayment(booking.id, txHash.trim());
      if (result.payment_validated) {
        alert('Payment verified successfully! You can now close this page.');
        navigate('/customer/dashboard', { state: { tab: 'bookings' } });
      } else {
        setValidationError('Payment validation failed. Please check the transaction hash and try again.');
      }
    } catch (err) {
      console.error('Validation error:', err);
      setValidationError(
        err instanceof Error 
          ? err.message 
          : 'Failed to validate payment. Please check the transaction hash and try again.'
      );
    } finally {
      setIsValidating(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-6 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        <button
          onClick={() => navigate(isDeveloperDashboard ? '/developer/dashboard' : '/customer/dashboard', { state: { tab: 'bookings' } })}
          className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 mb-6"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Dashboard
        </button>

        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="p-6 bg-blue-50 border-b border-blue-100">
            <h1 className="text-2xl font-bold text-gray-900">Complete Your Payment</h1>
            <div className="mt-4 flex items-center space-x-4">
              <img
                src={booking.developer.profile_picture}
                alt={booking.developerName}
                className="w-16 h-16 rounded-full object-cover border-4 border-white"
              />
              <div>
                <h2 className="text-xl font-semibold">{booking.developerName}</h2>
                <p className="text-gray-600">{booking.developer.location}</p>
              </div>
            </div>
          </div>

          <div className="p-6 space-y-6">
            {/* Developer Info */}
            <div className="border-b border-gray-200 pb-6">
              <h2 className="text-lg font-semibold mb-4">Developer Information</h2>
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium text-gray-900">Bio</h4>
                  <p className="text-gray-600">{booking.developer.bio}</p>
                </div>
                <div className="flex items-center space-x-2">
                  <Building className="h-5 w-5 text-gray-400" />
                  <span className="text-gray-600">{booking.developer.location}</span>
                </div>
              </div>
            </div>

            {/* Booking Details */}
            <div className="border-b border-gray-200 pb-6">
              <h2 className="text-lg font-semibold mb-4">Session Details</h2>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">Date & Time</span>
                  <span className="font-medium">{new Date(booking.time).toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Project</span>
                  <span className="font-medium">{booking.project_details?.title}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Description</span>
                  <span className="font-medium">{booking.project_details?.description}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Duration</span>
                  <span className="font-medium">{booking.duration}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Developer</span>
                  <span className="font-medium">{booking.developerName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Rate</span>
                  <span className="font-medium">${booking.developer.hourly_rate}/hour</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Requirements</span>
                  <span className="font-medium">{booking.project_details?.requirements}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Goals</span>
                  <span className="font-medium">{booking.project_details?.goals}</span>
                </div>
              </div>
            </div>

            {/* Developer's Wallet */}
            <div className="border-b border-gray-200 pb-6">
              <h2 className="text-lg font-semibold mb-4">Developer's Wallet</h2>
              <div className="bg-gray-50 p-4 rounded-lg space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    {booking.developer.wallet_address ? (
                      <>
                        <Wallet className="h-5 w-5 text-gray-400" />
                        <span className="font-mono text-sm">{booking.developer.wallet_address}</span>
                      </>
                    ) : (
                      <span className="text-red-600">Wallet address not available</span>
                    )}
                  </div>
                  <button
                    onClick={handleCopyAddress}
                    disabled={!booking.developer.wallet_address}
                    className="p-2 text-blue-600 hover:text-blue-700 rounded-lg flex items-center space-x-1"
                  >
                    <Copy className="h-4 w-4" />
                    <span className="text-sm">{copied ? 'Copied!' : 'Copy'}</span>
                  </button>
                </div>
                {booking.developer.wallet_address && (
                  <div className="text-sm text-gray-500">
                    Send the exact amount in USDT to this wallet address to complete your payment
                  </div>
                )}
              </div>
            </div>

            {/* Payment Summary */}
            <div className="border-b border-gray-200 pb-6">
              <h2 className="text-lg font-semibold mb-4">Payment Summary</h2>
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="space-y-2">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-600">Session Cost</span>
                    <span className="font-medium">${booking.amount}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-600">Platform Fee</span>
                    <span className="font-medium">$0</span>
                  </div>
                  <div className="pt-2 mt-2 border-t border-gray-200">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-900 font-medium">Total Amount (USDT)</span>
                      <span className="text-2xl font-bold text-gray-900">${booking.amount}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Payment Instructions */}
            <div className="space-y-4">
              <h2 className="text-lg font-semibold">Payment Instructions</h2>
              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center">
                    1
                  </div>
                  <p className="text-gray-600">
                    Copy the developer's wallet address shown above
                  </p>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center">
                    2
                  </div>
                  <p className="text-gray-600">
                    Send exactly ${booking.amount} USDT to the wallet address
                  </p>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center">
                    3
                  </div>
                  <p className="text-gray-600 flex-1">
                    After sending, click "I've Sent Payment" below to notify the developer
                  </p>
                </div>
              </div>

              <div className="mt-4 p-4 bg-yellow-50 rounded-lg">
                <div className="flex items-start space-x-3">
                  <Shield className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-yellow-800">
                    <p className="font-medium">Important:</p>
                    <ul className="mt-1 space-y-1">
                      <li>• Send only USDT (Tether) on the specified network</li>
                      <li>• Double-check the wallet address before sending</li>
                      <li>• Keep your transaction hash for reference</li>
                    </ul>
                  </div>
                </div>
              </div>
              
              {/* Transaction Hash Input */}
              <div className="mt-6 space-y-4">
                <div>
                  <label htmlFor="txHash" className="block text-sm font-medium text-gray-700 mb-2">
                    Transaction Hash
                  </label>
                  <input
                    id="txHash"
                    type="text"
                    value={txHash}
                    onChange={(e) => setTxHash(e.target.value)}
                    placeholder="Enter your transaction hash"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                  {validationError && (
                    <p className="mt-2 text-sm text-red-600">{validationError}</p>
                  )}
                </div>

                <p className="text-sm text-gray-500">
                  Please enter the transaction hash from your crypto wallet after sending the payment.
                  This helps us verify your payment quickly.
                </p>
              </div>

            </div>

            {/* Payment Button */}
            <div className="flex flex-col space-y-4">
              <button
                onClick={handlePaymentValidation}
                disabled={isValidating}
                className="w-full py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center justify-center space-x-2"
              >
                <CheckCircle className="h-5 w-5" />
                <span>{isValidating ? 'Validating Payment...' : "Verify Payment"}</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}