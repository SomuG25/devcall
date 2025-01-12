import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, Routes, Route, useLocation } from 'react-router-dom';
import { Video, User, Calendar, LogOut, VideoIcon, Menu, X, Search, Filter, Star, CheckCircle, XCircle, CreditCard, Building, Save, Upload } from 'lucide-react';
import BookingPage from '../components/BookingPage';
import { getAvailableDevelopers, subscribeToDevelopers, type DeveloperUpdate, getCustomerBookings, getCurrentUser, subscribeToBookingCancellations, getCustomerProfile, updateCustomerProfile } from '../lib/supabase';

type Developer = {
  id: string;
  full_name: string;
  bio: string;
  hourly_rate: number;
  profile_picture: string;
  is_available: boolean;
  skills: Array<{
    years_of_experience: number;
    skill: {
      name: string;
    };
  }>;
};

const defaultProfilePicture = "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=150&q=80";

type Booking = {
  id: string;
  developer: {
    full_name: string;
    profile_picture: string;
  };
  booking_time: string;
  duration: string;
  status: string;
  call_status: string | null;
  payment_status: string;
  amount: number;
  call_link: string;
};

export default function CustomerDashboard() {
  const navigate = useNavigate();
  const location = useLocation();
  const [activeTab, setActiveTab] = useState<'browse' | 'bookings' | 'profile'>(
    location.state?.tab || 'browse'
  );
  const [currentView, setCurrentView] = useState(activeTab);

  // Update currentView when activeTab changes
  useEffect(() => {
    setCurrentView(activeTab);
  }, [activeTab]);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedExpertise, setSelectedExpertise] = useState<string[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [developers, setDevelopers] = useState<Developer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingBookings, setIsLoadingBookings] = useState(true);
  const [bookingsError, setBookingsError] = useState('');
  const [error, setError] = useState('');
  const [showCancellationNotification, setShowCancellationNotification] = useState(false);
  const [cancelledBooking, setCancelledBooking] = useState<Booking | null>(null);
  const [profile, setProfile] = useState({
    name: '',
    organization: '',
    profilePicture: ''
  });
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isProfileLoading, setIsProfileLoading] = useState(true);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [profileError, setProfileError] = useState('');

  // Load bookings
  useEffect(() => {
    const loadBookings = async () => {
      try {
        setIsLoadingBookings(true);
        setBookingsError('');
        const user = await getCurrentUser();
        if (user) {
          const data = await getCustomerBookings(user.id);
          setBookings(data);

          // Subscribe to booking cancellations
          const cancellationChannel = subscribeToBookingCancellations(user.id, (booking) => {
            setBookings(prev => prev.map(b => 
              b.id === booking.id ? booking : b
            ));
            setCancelledBooking(booking);
            setShowCancellationNotification(true);
            
            // Auto-hide notification after 5 seconds
            setTimeout(() => {
              setShowCancellationNotification(false);
              setCancelledBooking(null);
            }, 5000);
          });

          return () => {
            cancellationChannel.unsubscribe();
          };
        }
      } catch (err) {
        console.error('Error loading bookings:', err);
        setBookingsError(err instanceof Error ? err.message : 'Failed to load bookings. Please refresh the page to try again.');
      } finally {
        setIsLoadingBookings(false);
      }
    };

    loadBookings();
  }, []);

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const user = await getCurrentUser();
        if (user) {
          const profileData = await getCustomerProfile(user.id);
          setProfile({
            name: profileData.full_name || '',
            organization: profileData.organization || '',
            profilePicture: profileData.profile_picture || defaultProfilePicture
          });
        }
      } catch (error) {
        console.error('Error loading profile:', error);
        setProfileError('Failed to load profile');
      } finally {
        setIsProfileLoading(false);
      }
    };

    loadProfile();
  }, []);

  const handleProfilePictureChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfile(prev => ({
          ...prev,
          profilePicture: reader.result as string
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleProfileSave = async () => {
    try {
      const user = await getCurrentUser();
      if (!user) throw new Error('No user found');

      await updateCustomerProfile(user.id, {
        full_name: profile.name,
        organization: profile.organization
      });

      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (error) {
      console.error('Error saving profile:', error);
      setProfileError('Failed to save profile changes');
    }
  };

  const handleLogout = () => {
    navigate('/');
  };

  useEffect(() => {
    const fetchDevelopers = async () => {
      try {
        setIsLoading(true);
        setError('');
        // Initial fetch of developers
        const data = await getAvailableDevelopers();
        setDevelopers(data);

        // Subscribe to real-time updates
        const channel = subscribeToDevelopers((update) => {
          setDevelopers(prevDevelopers => {
            switch (update.type) {
              case 'INSERT':
                // Only add if developer is available
                if (update.profile.is_available) {
                  return [...prevDevelopers, update.profile];
                }
                return prevDevelopers;

              case 'UPDATE':
                return prevDevelopers.map(dev => 
                  dev.id === update.profile.id ? update.profile : dev
                ).filter(dev => dev.is_available);

              case 'DELETE':
                return prevDevelopers.filter(dev => dev.id !== update.profile.id);

              default:
                return prevDevelopers;
            }
          });
        });

        // Cleanup subscription
        return () => {
          channel.unsubscribe();
        };
      } catch (err) {
        console.error('Error fetching developers:', err);
        setError(err instanceof Error ? err.message : 'Failed to load developers. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchDevelopers();
  }, []);

  const handleJoinCall = (booking: Booking) => {
    navigate('/call', { state: { booking } });
  };

  const handleCallCompletion = (bookingId: string, status: 'completed' | 'failed') => {
    setBookings(prevBookings =>
      prevBookings.map(booking => {
        if (booking.id === bookingId) {
          return {
            ...booking,
            call_status: status,
            status: 'completed',
            payment_status: status === 'completed' ? 'pending_payment' : 'cancelled'
          };
        }
        return booking;
      })
    );
  };

  const handlePayment = (bookingId: string) => {
    const booking = bookings.find(b => b.id === bookingId);
    if (!booking) return;
    
    navigate('/payment', { 
      state: { 
        booking: {
          id: booking.id,
          developerName: booking.developer.full_name,
          developer: {
            id: booking.developer.id,
            profile_picture: booking.developer.profile_picture,
            location: booking.developer.location
          },
          amount: booking.amount,
          duration: booking.duration,
          time: booking.booking_time,
          project_details: booking.project_details
        } 
      }
    });
  };

  const filteredDevelopers = developers.filter(developer => {
    if (!developer) return false;

    const searchLower = searchQuery.toLowerCase();
    const nameMatch = (developer.full_name || '').toLowerCase().includes(searchLower);
    const skillsMatch = (developer.skills || []).some(s => 
      (s?.skill?.name || '').toLowerCase().includes(searchLower)
    );
    
    const matchesExpertise = selectedExpertise.length === 0 ||
      (developer.skills || []).some(s => selectedExpertise.includes(s?.skill?.name || ''));
    
    return (nameMatch || skillsMatch) && matchesExpertise;
  });

  const allExpertise = Array.from(new Set(developers.flatMap(dev => 
    (dev.skills || []).map(s => s?.skill?.name).filter(Boolean)
  )));

  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('.filter-dropdown') && !target.closest('.filter-button')) {
        setIsFilterOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col md:flex-row">
      {/* Mobile Header */}
      <div className="md:hidden bg-white border-b">
        <div className="flex items-center justify-between p-4">
          <Link to="/" className="flex items-center space-x-2">
            <Video className="h-6 w-6 text-blue-600" />
            <span className="text-xl font-bold text-blue-600">DevCall</span>
          </Link>
          <button
            onClick={() => setActiveTab('profile')}
            className={`w-full flex items-center space-x-2 px-4 py-2 rounded-lg ${
              activeTab === 'profile'
                ? 'bg-blue-50 text-blue-600'
                : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            <User className="h-5 w-5" />
            <span>Profile</span>
          </button>

          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="p-2 text-gray-600 hover:text-blue-600"
          >
            {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>

      {/* Sidebar */}
      <div className={`
        ${isMobileMenuOpen ? 'block' : 'hidden'}
        md:block bg-white border-r md:w-64 z-10
        ${isMobileMenuOpen ? 'absolute inset-x-0 top-[73px]' : 'relative'}
      `}>
        <div className="p-6">
          <Link to="/" className="hidden md:flex items-center space-x-2 mb-8">
            <Video className="h-8 w-8 text-blue-600" />
            <span className="text-2xl font-bold text-blue-600">DevCall</span>
          </Link>

          <nav className="space-y-1">
            <button
              onClick={() => setActiveTab('browse')}
              className={`w-full flex items-center space-x-2 px-4 py-2 rounded-lg ${
                activeTab === 'browse'
                  ? 'bg-blue-50 text-blue-600'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <Search className="h-5 w-5" />
              <span>Browse Developers</span>
            </button>

            <button
              onClick={() => setActiveTab('bookings')}
              className={`w-full flex items-center space-x-2 px-4 py-2 rounded-lg ${
                activeTab === 'bookings'
                  ? 'bg-blue-50 text-blue-600'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <Calendar className="h-5 w-5" />
              <span>My Bookings</span>
            </button>

            <button
              onClick={() => setActiveTab('profile')}
              className={`w-full flex items-center space-x-2 px-4 py-2 rounded-lg ${
                activeTab === 'profile'
                  ? 'bg-blue-50 text-blue-600'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <User className="h-5 w-5" />
              <span>Profile</span>
            </button>

            <button
              onClick={handleLogout}
              className="w-full flex items-center space-x-2 px-4 py-2 text-gray-600 hover:bg-gray-50 rounded-lg"
            >
              <LogOut className="h-5 w-5" />
              <span>Logout</span>
            </button>
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 p-6">
        {/* Cancellation Notification */}
        {showCancellationNotification && cancelledBooking && (
          <div className="fixed top-4 right-4 bg-white p-4 rounded-lg shadow-lg border-l-4 border-red-600 max-w-md animate-slide-in">
            <h3 className="font-semibold text-red-600">Meeting Cancelled</h3>
            <p className="text-gray-600 mt-1">
              Your meeting with {cancelledBooking.developer?.full_name} scheduled for{' '}
              {new Date(cancelledBooking.booking_time).toLocaleString()} has been cancelled.
            </p>
          </div>
        )}

        <Routes>
          <Route
            path="/"
            element={currentView === 'profile' ? (
              <div className="space-y-6 max-w-3xl mx-auto">
                <div className="flex items-center justify-between">
                  <h1 className="text-2xl font-bold text-gray-900">Profile Settings</h1>
                  {saveSuccess && (
                    <div className="flex items-center text-green-600">
                      <CheckCircle className="h-5 w-5 mr-2" />
                      <span>Changes saved successfully!</span>
                    </div>
                  )}
                </div>

                {isProfileLoading ? (
                  <div className="text-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600">Loading profile...</p>
                  </div>
                ) : (
                  <div className="bg-white p-6 rounded-xl shadow-sm space-y-6">
                    {/* Profile Picture */}
                    <div className="flex flex-col items-center space-y-4">
                      <div className="relative">
                        <img
                          src={profile.profilePicture || defaultProfilePicture}
                          alt="Profile"
                          className="w-32 h-32 rounded-full object-cover border-4 border-white shadow-lg"
                        />
                        <button
                          onClick={() => fileInputRef.current?.click()}
                          className="absolute bottom-0 right-0 p-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 shadow-lg"
                        >
                          <Upload className="h-4 w-4" />
                        </button>
                        <input
                          type="file"
                          ref={fileInputRef}
                          onChange={handleProfilePictureChange}
                          accept="image/*"
                          className="hidden"
                        />
                      </div>
                      <p className="text-sm text-gray-500">Click the button to upload a new profile picture</p>
                    </div>

                    {profileError && (
                      <div className="p-4 bg-red-50 text-red-600 rounded-lg">
                        {profileError}
                      </div>
                    )}

                    <div className="space-y-4">
                      <h2 className="text-lg font-semibold text-gray-900">Basic Information</h2>
                      <div className="grid grid-cols-1 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Full Name
                          </label>
                          <input
                            type="text"
                            value={profile.name}
                            onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            placeholder="Enter your full name"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Organization
                          </label>
                          <div className="relative">
                            <Building className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                            <input
                              type="text"
                              value={profile.organization}
                              onChange={(e) => setProfile({ ...profile, organization: e.target.value })}
                              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                              placeholder="Enter your organization name"
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={handleProfileSave}
                      className="w-full sm:w-auto px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center justify-center space-x-2"
                    >
                      <Save className="h-5 w-5" />
                      <span>Save Changes</span>
                    </button>
                  </div>
                )}
              </div>
            ) : currentView === 'browse' ? (
                <div className="space-y-6">
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <h1 className="text-2xl font-bold text-gray-900">Browse Developers</h1>
                    <div className="flex flex-col sm:flex-row gap-4">
                      {/* Search Input */}
                      <div className="relative">
                        <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                        <input
                          type="text"
                          placeholder="Search developers..."
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="pl-10 pr-4 py-2 w-full sm:w-64 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>

                      {/* Filter Dropdown */}
                      <div className="relative filter-dropdown">
                        <button
                          onClick={() => setIsFilterOpen(!isFilterOpen)}
                          className="filter-button inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                        >
                          <Filter className="h-5 w-5 mr-2 text-gray-400" />
                          <span>Filter by Expertise</span>
                          {selectedExpertise.length > 0 && (
                            <span className="ml-2 bg-blue-100 text-blue-600 px-2 py-0.5 rounded-full text-sm">
                              {selectedExpertise.length}
                            </span>
                          )}
                        </button>
                        {isFilterOpen && (
                          <div className="absolute right-0 mt-2 w-64 bg-white border border-gray-200 rounded-lg shadow-lg z-20">
                            <div className="p-2">
                              {allExpertise.map((expertise) => (
                                <label
                                  key={expertise}
                                  className="flex items-center p-2 hover:bg-gray-50 rounded cursor-pointer"
                                >
                                  <input
                                    type="checkbox"
                                    checked={selectedExpertise.includes(expertise)}
                                    onChange={(e) => {
                                      if (e.target.checked) {
                                        setSelectedExpertise([...selectedExpertise, expertise]);
                                      } else {
                                        setSelectedExpertise(
                                          selectedExpertise.filter((skill) => skill !== expertise)
                                        );
                                      }
                                    }}
                                    className="mr-2"
                                  />
                                  {expertise}
                                </label>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  {isLoading && (
                    <div className="text-center py-12">
                      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                      <p className="mt-4 text-gray-600">Loading developers...</p>
                    </div>
                  )}

                  {error && (
                    <div className="text-center py-12">
                      <p className="text-red-600">{error}</p>
                    </div>
                  )}

                  {/* Developer Grid */}
                  {!isLoading && !error && <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredDevelopers.map((developer) => (
                      <div
                        key={developer.id}
                        className={`bg-white p-6 rounded-xl shadow-sm hover:shadow-md transition-all duration-200 ${
                          developer.is_available === false ? 'opacity-75' : ''
                        }`}
                      >
                        <div className="flex items-start space-x-4">
                          <img
                            src={developer.profile_picture || defaultProfilePicture}
                            alt={developer.full_name}
                            className="w-16 h-16 rounded-full object-cover"
                            onError={(e) => {
                              const img = e.target as HTMLImageElement;
                              img.src = defaultProfilePicture;
                            }}
                          />
                          <div className="flex-1">
                            <h3 className="text-lg font-semibold">{developer.full_name}</h3>
                            {developer.bio && (
                              <p className="text-sm text-gray-600 mt-1 line-clamp-2">{developer.bio}</p>
                            )}
                          </div>
                        </div>

                        <div className="mt-4">
                          <div className="flex flex-wrap gap-2 mb-4">
                            {(developer.skills || []).map((skill, index) => (
                              <span
                                key={`${skill?.skill?.name || 'unknown'}-${index}`}
                                className="px-2 py-1 bg-blue-50 text-blue-600 text-sm rounded-full"
                              >
                                {skill?.skill?.name || 'Unknown'} ({skill?.years_of_experience || 0}y)
                              </span>
                            ))}
                          </div>

                          <div className="flex items-center justify-between">
                            <span className="text-lg font-semibold text-gray-900">
                              ${developer.hourly_rate}/hour
                            </span>
                            <button
                              onClick={() => navigate('book', { 
                                state: { 
                                  developer: {
                                    ...developer,
                                    profile_picture: developer.profile_picture || defaultProfilePicture
                                  }
                                } 
                              })}
                              disabled={developer.is_available === false}
                              className={`px-4 py-2 rounded-lg ${
                                developer.is_available
                                  ? 'bg-blue-600 text-white hover:bg-blue-700'
                                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                              }`}
                            >
                              {developer.is_available ? 'Book Now' : 'Unavailable'}
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>}
                </div>
              ) : (
                <div className="space-y-6">
                  <h1 className="text-2xl font-bold text-gray-900">My Bookings</h1>
                  {isLoadingBookings ? (
                    <div className="text-center py-12">
                      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                      <p className="mt-4 text-gray-600">Loading bookings...</p>
                    </div>
                  ) : bookings.length === 0 ? (
                    <div className="text-center py-12">
                      <p className="text-gray-600">No bookings yet</p>
                    </div>
                  ) : bookingsError ? (
                    <div className="text-center py-12">
                      <p className="text-red-600">{bookingsError}</p>
                    </div>
                  ) : (
                  <div className="space-y-4">
                    {bookings.map((booking) => (
                      <div
                        key={booking.id}
                        className="bg-white p-6 rounded-xl shadow-sm hover:shadow-md transition-all duration-200"
                      >
                        <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                          <div className="flex-grow">
                            <h3 className="text-lg font-semibold">{booking.developer.full_name}</h3>
                            <p className="text-gray-600">
                              {new Date(booking.booking_time).toLocaleString('en-US', {
                                timeZone: 'Asia/Kolkata',
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric',
                                hour: 'numeric',
                                minute: 'numeric',
                                hour12: true
                              })} IST • {booking.duration}
                            </p>
                            <div className="flex flex-wrap gap-2 mt-2">
                              <span className={`inline-block px-2 py-1 rounded-full text-sm ${
                                booking.status === 'upcoming'
                                  ? 'bg-green-50 text-green-600'
                                  : 'bg-gray-50 text-gray-600'
                              }`}>
                                {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                              </span>
                              
                              <span className={`inline-block px-2 py-1 rounded-full text-sm ${
                                booking.payment_status === 'paid'
                                  ? 'bg-green-50 text-green-600'
                                  : booking.payment_status === 'pending_payment'
                                  ? 'bg-yellow-50 text-yellow-600'
                                  : 'bg-gray-50 text-gray-600'
                              }`}>
                                {booking.payment_status.split('_').map(word => 
                                  word.charAt(0).toUpperCase() + word.slice(1)
                                ).join(' ')}
                              </span>

                              {booking.call_status && (
                                <span className={`inline-block px-2 py-1 rounded-full text-sm ${
                                  booking.call_status === 'completed'
                                    ? 'bg-blue-50 text-blue-600'
                                    : 'bg-red-50 text-red-600'
                                }`}>
                                  Call {booking.call_status}
                                </span>
                              )}
                            </div>
                          </div>
                          
                          <div className="mt-4 md:mt-0 flex flex-col sm:flex-row gap-2">
                            {booking.status === 'upcoming' && (
                             <>
                               <button 
                                 onClick={() => navigate('/call', { 
                                   state: { 
                                     booking: {
                                       id: booking.id,
                                       developerName: booking.developer.full_name,
                                       time: booking.booking_time,
                                       duration: booking.duration,
                                       project_details: booking.project_details
                                     }
                                   }
                                 })}
                                 className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200"
                               >
                                 <VideoIcon className="h-5 w-5 mr-2" />
                                 Join Meeting
                               </button>
                               <button
                                 onClick={() => handlePayment(booking.id)}
                                 className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors duration-200"
                               >
                                 <CreditCard className="h-5 w-5 mr-2" />
                                 Make Payment (${booking.amount})
                               </button>
                             </>
                            )}

                            {(booking.payment_status === 'pending_payment' || booking.status === 'completed') && (
                              <button
                                onClick={() => handlePayment(booking.id)}
                                className={`inline-flex items-center px-4 py-2 rounded-lg transition-colors duration-200 ${
                                  booking.payment_status === 'pending_payment'
                                    ? 'bg-green-600 text-white hover:bg-green-700'
                                    : 'bg-blue-600 text-white hover:bg-blue-700'
                                }`}
                              >
                                <CreditCard className="h-5 w-5 mr-2" />
                                {booking.payment_status === 'pending_payment' 
                                  ? `Pay Now ($${booking.amount})`
                                  : `Make Payment ($${booking.amount})`
                                }
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>)}
                </div>
              )
            }
          />
          <Route path="book" element={<BookingPage />} />
          <Route
            path="profile"
            element={
              <div className="space-y-6 max-w-3xl mx-auto">
                <div className="flex items-center justify-between">
                  <h1 className="text-2xl font-bold text-gray-900">Profile Settings</h1>
                  {saveSuccess && (
                    <div className="flex items-center text-green-600">
                      <CheckCircle className="h-5 w-5 mr-2" />
                      <span>Changes saved successfully!</span>
                    </div>
                  )}
                </div>

                {isProfileLoading ? (
                  <div className="text-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600">Loading profile...</p>
                  </div>
                ) : (
                  <div className="bg-white p-6 rounded-xl shadow-sm space-y-6">
                    {/* Profile Picture */}
                    <div className="flex flex-col items-center space-y-4">
                      <div className="relative">
                        <img
                          src={profile.profilePicture || defaultProfilePicture}
                          alt="Profile"
                          className="w-32 h-32 rounded-full object-cover border-4 border-white shadow-lg"
                        />
                        <button
                          onClick={() => fileInputRef.current?.click()}
                          className="absolute bottom-0 right-0 p-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 shadow-lg"
                        >
                          <Upload className="h-4 w-4" />
                        </button>
                        <input
                          type="file"
                          ref={fileInputRef}
                          onChange={handleProfilePictureChange}
                          accept="image/*"
                          className="hidden"
                        />
                      </div>
                      <p className="text-sm text-gray-500">Click the button to upload a new profile picture</p>
                    </div>

                    {profileError && (
                      <div className="p-4 bg-red-50 text-red-600 rounded-lg">
                        {profileError}
                      </div>
                    )}

                    <div className="space-y-4">
                      <h2 className="text-lg font-semibold text-gray-900">Basic Information</h2>
                      <div className="grid grid-cols-1 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Full Name
                          </label>
                          <input
                            type="text"
                            value={profile.name}
                            onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            placeholder="Enter your full name"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Organization
                          </label>
                          <div className="relative">
                            <Building className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                            <input
                              type="text"
                              value={profile.organization}
                              onChange={(e) => setProfile({ ...profile, organization: e.target.value })}
                              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                              placeholder="Enter your organization name"
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={handleProfileSave}
                      className="w-full sm:w-auto px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center justify-center space-x-2"
                    >
                      <Save className="h-5 w-5" />
                      <span>Save Changes</span>
                    </button>
                  </div>
                )}
              </div>
            }
          />
        </Routes>
      </div>
    </div>
  );
}