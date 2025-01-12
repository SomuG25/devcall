import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { addCustomerRole, getCurrentUser, getDeveloperProfile, updateDeveloperProfile, subscribeToBookings, getDeveloperBookings, subscribeToCallFailures, type CallFailureUpdate, updateBooking, supabase } from '../lib/supabase';
import {
  Video,
  User,
  Calendar,
  Clock,
  LogOut,
  Save,
  Video as VideoIcon,
  DollarSign,
  Wallet,
  Menu,
  X,
  Plus,
  Upload,
  Trash2,
  CheckCircle
} from 'lucide-react';

type Skill = {
  name: string;
  yearsOfExperience: number;
};

type Tab = 'profile' | 'bookings' | 'availability';

export default function DeveloperDashboard() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<Tab>('profile');
  const [isAvailable, setIsAvailable] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [newSkill, setNewSkill] = useState('');
  const [newYearsExp, setNewYearsExp] = useState('');
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [skillError, setSkillError] = useState('');
  const [isProfileLoading, setIsProfileLoading] = useState(true);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showNotification, setShowNotification] = useState(false);
  const [newBooking, setNewBooking] = useState<Booking | null>(null);
  const [showFailureNotification, setShowFailureNotification] = useState(false);
  const [failedCall, setFailedCall] = useState<CallFailureUpdate | null>(null);
  const [isCancelling, setIsCancelling] = useState(false);
  
  // Profile state
  const [profile, setProfile] = useState({
    name: 'John Developer',
    bio: 'Senior Full Stack Developer with 8 years of experience in React, Node.js, and Python.',
    hourlyRate: 150,
    walletAddress: '0x1234...5678',
    profilePicture: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=150&q=80',
    skills: [
      { name: 'React', yearsOfExperience: 5 },
      { name: 'Node.js', yearsOfExperience: 4 },
      { name: 'TypeScript', yearsOfExperience: 3 },
    ] as Skill[],
    education: 'Master in Computer Science',
    location: 'San Francisco, CA',
    languages: ['English', 'Spanish'],
    githubProfile: 'github.com/johndev',
    linkedinProfile: 'linkedin.com/in/johndev'
  });

  // Load profile data
  useEffect(() => {
    const loadData = async () => {
      try {
        const user = await getCurrentUser();
        if (user) {
          // Load profile
          const profileData = await getDeveloperProfile(user.id);
          if (profileData) {
            setProfile({
              name: profileData.full_name || '',
              bio: profileData.bio || '',
              hourlyRate: profileData.hourly_rate || 0,
              walletAddress: profileData.wallet_address || '',
              profilePicture: profileData.profile_picture || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=150&q=80',
              skills: profileData.skills?.map(s => ({
                name: s.skill.name,
                yearsOfExperience: s.years_of_experience
              })) || [],
              education: profileData.education || '',
              location: profileData.location || '',
              languages: ['English'], // Default for now
              githubProfile: profileData.github_profile || '',
              linkedinProfile: profileData.linkedin_profile || '',
            });
            setIsAvailable(profileData.is_available);
          }

          // Load bookings
          const bookingsData = await getDeveloperBookings(user.id);
          setBookings(bookingsData);
          
          // Subscribe to call failures
          const failuresChannel = subscribeToCallFailures(user.id, (failure) => {
            setFailedCall(failure);
            setShowFailureNotification(true);
            
            // Auto-hide notification after 10 seconds
            setTimeout(() => {
              setShowFailureNotification(false);
              setFailedCall(null);
            }, 10000);
          });

          // Subscribe to new bookings
          const channel = subscribeToBookings(user.id, (booking) => {
            setBookings(prev => [...prev, booking]);
            setNewBooking(booking);
            setShowNotification(true);
            
            // Auto-hide notification after 5 seconds
            setTimeout(() => {
              setShowNotification(false);
              setNewBooking(null);
            }, 5000);
          });

          return () => {
            channel.unsubscribe();
            failuresChannel.unsubscribe();
          };
        }
      } catch (error) {
        console.error('Error loading profile:', error);
      } finally {
        setIsProfileLoading(false);
      }
    };

    loadData();
  }, []);

  const handleBecomeCustomer = async () => {
    try {
      await addCustomerRole();
      navigate('/customer-dashboard');
    } catch (error) {
      console.error('Error adding customer role:', error);
    }
  };

  const handleLogout = () => {
    navigate('/');
  };

  const handleProfileSave = async () => {
    try {
      const user = await getCurrentUser();
      if (!user) {
        throw new Error('No user found');
      }

      await updateDeveloperProfile(user.id, {
        full_name: profile.name,
        bio: profile.bio,
        hourly_rate: profile.hourlyRate,
        location: profile.location,
        education: profile.education,
        github_profile: profile.githubProfile,
        linkedin_profile: profile.linkedinProfile,
        wallet_address: profile.walletAddress,
        profile_picture: profile.profilePicture,
        is_available: isAvailable,
      });

      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (error) {
      console.error('Error saving profile:', error);
      alert('Failed to save profile changes. Please try again.');
    }
  };

  const handleAvailabilityToggle = async () => {
    try {
      const user = await getCurrentUser();
      if (!user) {
        throw new Error('No user found');
      }

      await updateDeveloperProfile(user.id, {
        is_available: !isAvailable
      });

      setIsAvailable(!isAvailable);
    } catch (error) {
      console.error('Error updating availability:', error);
      alert('Failed to update availability. Please try again.');
    }
  };

  const handleAddSkill = async () => {
    setSkillError('');
    if (!newSkill || !newYearsExp) {
      setSkillError('Please enter both skill name and years of experience');
      return;
    }
    
    try {
      const user = await getCurrentUser();
      if (!user) throw new Error('No user found');
      
      // First check if skill exists
      let { data: skillData, error: skillError } = await supabase
        .from('skills')
        .select('id, name')
        .ilike('name', newSkill)
        .maybeSingle();
      
      if (!skillData) {
        // Create new skill
        const { data: newSkillData, error: createError } = await supabase
          .from('skills')
          .insert({ name: newSkill.trim() })
          .select()
          .single();

        if (createError) throw createError;
        skillData = newSkillData;
      }

      // Check if developer already has this skill
      const { data: existingSkill } = await supabase
        .from('developer_skills')
        .select()
        .eq('developer_id', user.id)
        .eq('skill_id', skillData.id)
        .maybeSingle();

      if (existingSkill) {
        setSkillError('You have already added this skill');
        return;
      }

      // Add the skill to developer_skills
      const { error: linkError } = await supabase
        .from('developer_skills')
        .insert({
          developer_id: user.id,
          skill_id: skillData.id,
          years_of_experience: parseInt(newYearsExp)
        });

      if (linkError) {
        throw linkError;
      }

      // Update local state
      setProfile(prev => ({
        ...prev,
        skills: [...prev.skills, { 
          name: skillData.name, 
          yearsOfExperience: parseInt(newYearsExp)
        }]
      }));
      setNewSkill('');
      setNewYearsExp('');
    } catch (error) {
      console.error('Error adding skill:', error);
      if (error instanceof Error) {
        setSkillError(error.message);
      } else {
        setSkillError('Failed to add skill. Please try again.');
      }
    }
  };

  const handleRemoveSkill = async (skillName: string) => {
    try {
      const user = await getCurrentUser();
      if (!user) throw new Error('No user found');

      // Find skill by name
      const { data: skillData, error: skillError } = await supabase
        .from('skills')
        .select('id, name')
        .ilike('name', skillName)
        .maybeSingle();

      if (skillError) throw skillError;
      if (!skillData) {
        setSkillError('Skill not found');
        return;
      }

      // Remove from developer_skills
      const { error: deleteError } = await supabase
        .from('developer_skills')
        .delete()
        .eq('developer_id', user.id)
        .eq('skill_id', skillData.id);

      if (deleteError) throw deleteError;

      // Update local state
      setProfile(prev => ({
        ...prev,
        skills: prev.skills.filter(skill => skill.name.toLowerCase() !== skillName.toLowerCase())
      }));
    } catch (error) {
      console.error('Error removing skill:', error);
      if (error instanceof Error) {
        setSkillError(error.message);
      } else {
        setSkillError('Failed to remove skill. Please try again.');
      }
    }
  };

  const handleProfilePictureChange = (event: React.ChangeEvent<HTMLInputElement>) => {
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

  const handleCancelBooking = async (bookingId: string) => {
    if (!window.confirm('Are you sure you want to cancel this booking?')) {
      return;
    }

    setIsCancelling(true);
    try {
      await updateBooking(bookingId, {
        status: 'cancelled',
        payment_status: 'cancelled'
      });

      setBookings(prevBookings =>
        prevBookings.map(booking =>
          booking.id === bookingId
            ? { ...booking, status: 'cancelled', payment_status: 'cancelled' }
            : booking
        )
      );
    } catch (error) {
      console.error('Error cancelling booking:', error);
      alert('Failed to cancel booking. Please try again.');
    } finally {
      setIsCancelling(false);
    }
  };

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
          
          <div className="mb-8 text-center">
            <div className="relative w-32 h-32 mx-auto mb-4">
              <img
                src={profile.profilePicture}
                alt="Profile"
                className="w-full h-full rounded-full object-cover border-4 border-white shadow-lg"
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
            <h2 className="text-lg font-semibold">{profile.name}</h2>
            <p className="text-sm text-gray-600">{profile.location}</p>
          </div>

          <nav className="space-y-1">
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
              onClick={() => setActiveTab('bookings')}
              className={`w-full flex items-center space-x-2 px-4 py-2 rounded-lg ${
                activeTab === 'bookings'
                  ? 'bg-blue-50 text-blue-600'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <Calendar className="h-5 w-5" />
              <span>Bookings</span>
            </button>

            <button
              onClick={() => setActiveTab('availability')}
              className={`w-full flex items-center space-x-2 px-4 py-2 rounded-lg ${
                activeTab === 'availability'
                  ? 'bg-blue-50 text-blue-600'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <Clock className="h-5 w-5" />
              <span>Availability</span>
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
        {/* Notification */}
        {showNotification && newBooking && (
          <div className="fixed top-4 right-4 bg-white p-4 rounded-lg shadow-lg border-l-4 border-blue-600 max-w-md animate-slide-in">
            <h3 className="font-semibold text-gray-900">New Booking!</h3>
            <p className="text-gray-600 mt-1">
              A new session has been booked for{' '}
              {new Date(newBooking.booking_time).toLocaleString()}
            </p>
            <div className="mt-2 text-sm text-gray-500">
              <p><strong>Project:</strong> {newBooking.project_details.title}</p>
            </div>
            <button
              onClick={() => {
                setShowNotification(false);
                setActiveTab('bookings');
              }}
              className="mt-2 text-blue-600 hover:text-blue-700 text-sm font-medium"
            >
              View Details
            </button>
          </div>
        )}

        {/* Failed Call Notification */}
        {showFailureNotification && failedCall && (
          <div className="fixed top-4 right-4 bg-white p-4 rounded-lg shadow-lg border-l-4 border-red-600 max-w-md animate-slide-in">
            <h3 className="font-semibold text-red-600">Call Failed!</h3>
            <div className="mt-2 space-y-1 text-sm text-gray-600">
              <p><strong>Customer:</strong> {failedCall.customer_name}</p>
              <p><strong>Project:</strong> {failedCall.project_title}</p>
              <p><strong>Scheduled Time:</strong> {new Date(failedCall.booking_time).toLocaleString()}</p>
              <p><strong>Failed At:</strong> {new Date(failedCall.failure_time).toLocaleString()}</p>
            </div>
            <button
              onClick={() => {
                setShowFailureNotification(false);
                setActiveTab('bookings');
              }}
              className="mt-3 text-red-600 hover:text-red-700 text-sm font-medium"
            >
              View Details
            </button>
          </div>
        )}

        {activeTab === 'profile' && (
          <div className="space-y-6 max-w-3xl mx-auto">
            {isProfileLoading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-4 text-gray-600">Loading profile...</p>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between">
                  <h1 className="text-2xl font-bold text-gray-900">Profile Settings</h1>
                  {saveSuccess && (
                    <div className="flex items-center text-green-600">
                      <CheckCircle className="h-5 w-5 mr-2" />
                      <span>Changes saved successfully!</span>
                    </div>
                  )}
                </div>

                <div className="bg-white p-6 rounded-xl shadow-sm space-y-6">
                  {/* Basic Information */}
                  <div className="space-y-4">
                    <h2 className="text-lg font-semibold text-gray-900">Basic Information</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Full Name
                        </label>
                        <input
                          type="text"
                          value={profile.name}
                          onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Location
                        </label>
                        <input
                          type="text"
                          value={profile.location}
                          onChange={(e) => setProfile({ ...profile, location: e.target.value })}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Bio
                      </label>
                      <textarea
                        value={profile.bio}
                        onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
                        rows={4}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                  </div>

                  {/* Skills Section */}
                  <div className="space-y-4">
                    <h2 className="text-lg font-semibold text-gray-900">Skills</h2>
                    <div className="flex flex-wrap gap-2">
                      {profile.skills.map((skill) => (
                        <div
                          key={skill.name}
                          className="flex items-center bg-blue-50 text-blue-600 px-3 py-1.5 rounded-full"
                        >
                          <span>{skill.name} ({skill.yearsOfExperience}y)</span>
                          <button
                            onClick={() => handleRemoveSkill(skill.name)}
                            className="ml-2 text-blue-400 hover:text-blue-600"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="Add a skill..."
                        value={newSkill}
                        onChange={(e) => setNewSkill(e.target.value)}
                        className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                      <input
                        type="number"
                        placeholder="Years"
                        value={newYearsExp}
                        onChange={(e) => setNewYearsExp(e.target.value)}
                        className="w-24 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                      <button
                        onClick={handleAddSkill}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                      >
                        <Plus className="h-5 w-5" />
                      </button>
                    </div>
                    {skillError && (
                      <p className="mt-2 text-sm text-red-600">{skillError}</p>
                    )}
                  </div>

                  {/* Professional Information */}
                  <div className="space-y-4">
                    <h2 className="text-lg font-semibold text-gray-900">Professional Information</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Education
                        </label>
                        <input
                          type="text"
                          value={profile.education}
                          onChange={(e) => setProfile({ ...profile, education: e.target.value })}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Hourly Rate (USD)
                        </label>
                        <div className="relative">
                          <DollarSign className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                          <input
                            type="number"
                            value={profile.hourlyRate}
                            onChange={(e) => setProfile({ ...profile, hourlyRate: Number(e.target.value) })}
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Social Profiles */}
                  <div className="space-y-4">
                    <h2 className="text-lg font-semibold text-gray-900">Social Profiles</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          GitHub Profile
                        </label>
                        <input
                          type="text"
                          value={profile.githubProfile}
                          onChange={(e) => setProfile({ ...profile, githubProfile: e.target.value })}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          LinkedIn Profile
                        </label>
                        <input
                          type="text"
                          value={profile.linkedinProfile}
                          onChange={(e) => setProfile({ ...profile, linkedinProfile: e.target.value })}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Payment Information */}
                  <div className="space-y-4">
                    <h2 className="text-lg font-semibold text-gray-900">Payment Information</h2>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Wallet Address
                      </label>
                      <div className="relative">
                        <Wallet className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                        <input
                          type="text"
                          value={profile.walletAddress}
                          onChange={(e) => setProfile({ ...profile, walletAddress: e.target.value })}
                          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
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
              </>
            )}
          </div>
        )}

        {activeTab === 'bookings' && (
          <div className="space-y-6">
            <h1 className="text-2xl font-bold text-gray-900">Upcoming Sessions</h1>
            <div className="space-y-4">
              {bookings.map((booking) => (
                <div
                  key={booking.id}
                  className="bg-white p-6 rounded-xl shadow-sm hover:shadow-md transition-shadow"
                >
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                    <div className="flex-grow">
                      <h3 className="text-lg font-semibold">{booking.customer?.full_name}</h3>
                      <div className="mt-2 bg-gray-50 p-4 rounded-lg space-y-3">
                        <div>
                          <h4 className="font-medium text-gray-900">Project Details</h4>
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
                            : booking.status === 'cancelled'
                            ? 'bg-red-50 text-red-600'
                            : 'bg-gray-50 text-gray-600'
                        }`}>
                          {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                        </span>
                      </div>
                    </div>
                    <div className="mt-4 md:mt-0">
                      {booking.status === 'upcoming' && (
                        <button
                          onClick={() => handleCancelBooking(booking.id)}
                          disabled={isCancelling}
                          className="inline-flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 mr-2"
                        >
                          {isCancelling ? 'Cancelling...' : 'Cancel Meeting'}
                        </button>
                      )}
                      {booking.status === 'upcoming' && (
                        <button
                          onClick={() => navigate('/call', { 
                            state: { 
                              booking: {
                                id: booking.id,
                                developerName: profile.name,
                                time: booking.booking_time,
                                duration: booking.duration,
                                project_details: booking.project_details
                              }
                            }
                          })}
                          className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                        >
                          <VideoIcon className="h-5 w-5 mr-2" />
                          Join Call
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'availability' && (
          <div className="space-y-6">
            <h1 className="text-2xl font-bold text-gray-900">Availability Settings</h1>
            <div className="bg-white p-6 rounded-xl shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-semibold mb-1">Available for Bookings</h2>
                  <p className="text-gray-600">Toggle your availability for new sessions</p>
                </div>
                <button
                  onClick={handleAvailabilityToggle}
                  className={`px-4 py-2 rounded-lg ${
                    isAvailable
                      ? 'bg-green-600 hover:bg-green-700'
                      : 'bg-gray-600 hover:bg-gray-700'
                  } text-white`}
                >
                  {isAvailable ? 'Available' : 'Unavailable'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}