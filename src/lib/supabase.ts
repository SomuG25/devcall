import { createClient } from '@supabase/supabase-js';
import { RealtimeChannel } from '@supabase/supabase-js';
import type { FetchError } from '@supabase/supabase-js';

// Types for real-time updates
export type DeveloperUpdate = {
  id: string;
  type: 'INSERT' | 'UPDATE' | 'DELETE';
  profile: DeveloperProfile;
};

export type CallFailureUpdate = {
  id: string;
  customer_name: string;
  booking_time: string;
  failure_time: string;
  project_title: string;
};

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

const MAX_RETRIES = 3;
const RETRY_DELAY = 2000; // 2 seconds
const RETRY_BACKOFF_FACTOR = 1.5;

const NETWORK_ERROR_MESSAGES = [
  'Failed to fetch',
  'NetworkError',
  'network timeout',
  'Network request failed',
  'Network Error',
  'The Internet connection appears to be offline'
];

async function fetchWithRetry(
  url: string, 
  options: RequestInit, 
  retries = MAX_RETRIES,
  currentDelay = RETRY_DELAY
): Promise<Response> {
  try {
    const response = await fetch(url, options);
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        errorData.message || 
        errorData.error_description || 
        `HTTP error! status: ${response.status}`
      );
    }
    return response;
  } catch (error) {
    const isNetworkError = error instanceof Error && 
      NETWORK_ERROR_MESSAGES.some(msg => error.message.includes(msg));

    if (retries > 0 && isNetworkError) {
      await new Promise(resolve => setTimeout(resolve, currentDelay));
      return fetchWithRetry(
        url, 
        options, 
        retries - 1,
        currentDelay * RETRY_BACKOFF_FACTOR
      );
    }
    throw error;
  }
}

const supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true
  },
  global: {
    fetch: async (url: string, options: RequestInit) => {
      try {
        const response = await fetchWithRetry(url, options);
        return response;
      } catch (error) {
        console.error('Network error:', error);
        const message = error instanceof Error ? error.message : 'Unknown error occurred';
        const isNetworkError = NETWORK_ERROR_MESSAGES.some(msg => message.includes(msg));
        
        if (isNetworkError) {
          throw new Error(
            'Unable to connect to the server. Please check your internet connection and try again.'
          );
        }
        
        throw new Error(`Connection error: ${message}`);
      }
    }
  }
});

export const supabase = supabaseClient;

// Types
export type UserRole = 'developer' | 'customer';

export type UserRoles = {
  user_id: string;
  role: UserRole;
  is_primary: boolean;
};

export type DeveloperProfile = {
  id: string;
  full_name: string;
  bio: string;
  hourly_rate: number;
  location: string;
  education: string;
  github_profile: string;
  linkedin_profile: string;
  wallet_address: string;
  profile_picture: string;
  is_available: boolean;
  created_at: string;
  updated_at: string;
};

export type CustomerProfile = {
  id: string;
  full_name: string;
  created_at: string;
  updated_at: string;
};

export type Booking = {
  id: string;
  customer_id: string;
  project_details: {
    title: string;
    description: string;
    requirements: string;
    goals: string;
  };
  developer_id: string;
  booking_time: string;
  duration: string;
  amount: number;
  status: 'pending' | 'upcoming' | 'completed' | 'cancelled';
  call_status: 'completed' | 'failed' | null;
  payment_status: 'pending' | 'pending_payment' | 'paid' | 'cancelled';
  call_link: string;
  created_at: string;
  updated_at: string;
};

// Auth functions
export async function signUp(email: string, password: string, role: UserRole) {
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email,
    password
  });

  if (authError) throw authError;

  // Create profile based on role
  if (authData.user) {
    // Add user role
    const { error: roleError } = await supabase
      .from('user_roles')
      .insert([{ 
        user_id: authData.user.id, 
        role,
        is_primary: true 
      }])
      .select()
      .single();

    if (roleError) throw roleError;
  }

  return authData;
}

export async function signIn(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
    options: {
      captchaToken: undefined // Disable captcha for development
    }
  });

  if (error) {
    if (error.message === 'Invalid login credentials') {
      throw new Error('Invalid email or password. Please check your credentials and try again.');
    }
    throw error;
  }
  
  // Get user roles
  const roles = await getUserRoles(data.user.id);
  
  if (!roles || roles.length === 0) {
    throw new Error('Account exists but no roles found. Please sign up as a developer or customer first.');
  }
  
  data.user.roles = roles;
  return data;
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

export async function getCurrentUser() {
  try {
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error) throw error;
    return user;
  } catch (error) {
    console.error('Error getting current user:', error);
    throw new Error('Failed to get user information. Please try logging in again.');
  }
}

export async function getUserRoles(userId: string) {
  const { data, error } = await supabase
    .from('user_roles')
    .select('*')
    .eq('user_id', userId);
  
  if (error) throw error;
  return data as UserRoles[];
}

export async function addCustomerRole(userId: string) {
  // Check if user already has customer role
  const { data: existingRoles } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', userId)
    .eq('role', 'customer');

  // If user already has customer role, just return success
  if (existingRoles?.length > 0) {
    return true;
  }

  const { error: roleError } = await supabase
    .from('user_roles')
    .insert([{ 
      user_id: userId, 
      role: 'customer',
      is_primary: false 
    }]);
  
  if (roleError) throw roleError;

  // Check if customer profile already exists
  const { data: existingProfile } = await supabase
    .from('customer_profiles')
    .select('id')
    .eq('id', userId);

  // If profile exists, just return success
  if (existingProfile?.length > 0) {
    return true;
  }

  const { error: profileError } = await supabase
    .from('customer_profiles')
    .insert([{ id: userId }]);
  
  if (profileError) throw profileError;
  
  return true;
}

// Profile functions
export async function getDeveloperProfile(id: string) {
  const { data, error } = await supabase
    .from('developer_profiles')
    .select('*, skills:developer_skills(*, skill:skills(*))')
    .eq('id', id)
    .single();
  
  if (error) throw error;
  return data;
}

export async function updateDeveloperProfile(id: string, profile: Partial<DeveloperProfile>) {
  const { data, error } = await supabase
    .from('developer_profiles')
    .update(profile)
    .eq('id', id)
    .select()
    .single();
  
  if (error) throw error;
  return data;
}

export async function getCustomerProfile(id: string) {
  try {
    // First check if profile exists
    const { data: existingProfile, error: checkError } = await supabase
      .from('customer_profiles')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (checkError) throw checkError;

    // If no profile exists, create one
    if (!existingProfile) {
      const { data: newProfile, error: createError } = await supabase
        .from('customer_profiles')
        .insert([{ id }])
        .select()
        .single();

      if (createError) throw createError;
      return newProfile;
    }
   
    return existingProfile;
  } catch (error) {
    console.error('Error in getCustomerProfile:', error);
    throw error;
  }
}

export async function updateCustomerProfile(id: string, profile: Partial<CustomerProfile>) {
  try {
    // First ensure profile exists
    const { data: existingProfile } = await supabase
      .from('customer_profiles')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (!existingProfile) {
      // Create profile if it doesn't exist
      const { data: newProfile, error: createError } = await supabase
        .from('customer_profiles')
        .insert([{ id, ...profile }])
        .select()
        .single();

      if (createError) throw createError;
      return newProfile;
    }

    // Update existing profile
    const { data, error } = await supabase
      .from('customer_profiles')
      .update(profile)
      .eq('id', id)
      .select()
      .single();
   
    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error in updateCustomerProfile:', error);
    throw error;
  }
}

// Booking functions
export async function createBooking(booking: Omit<Booking, 'id' | 'created_at' | 'updated_at'>) {
  try {
    const { data, error } = await supabase
      .from('bookings')
      .insert([booking])
      .select(`
        *,
        developer:developer_users_view(
          id,
          full_name,
          email
        ),
        customer:customer_profiles(
          id,
          full_name
        )
      `)
      .single();
    
    if (error) throw error;

    // Send email to developer
    try {
      await supabase.functions.invoke('send-booking-email', {
        body: { 
          bookingId: data.id,
          developerEmail: data.developer.email,
          customerName: data.customer?.full_name,
          projectDetails: data.project_details,
          bookingTime: data.booking_time,
          duration: data.duration,
          amount: data.amount
        }
      });
    } catch (error) {
      console.warn('Email notification failed, but booking was created:', error);
      // Don't throw error - email sending is non-critical
    }

    return data;
  } catch (error) {
    console.error('Booking creation failed:', error);
    if (error instanceof Error) {
      throw new Error(`Failed to create booking: ${error.message}`);
    }
    throw new Error('Failed to create booking. Please try again.');
  }
}

// Subscribe to new bookings for a developer
export function subscribeToBookings(developerId: string, onBooking: (booking: Booking) => void): RealtimeChannel {
  return supabase
    .channel('bookings')
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'bookings',
        filter: `developer_id=eq.${developerId}`
      },
      (payload) => {
        onBooking(payload.new as Booking);
      }
    )
    .subscribe();
}

// Subscribe to call failure updates
export function subscribeToCallFailures(developerId: string, onFailure: (update: CallFailureUpdate) => void): RealtimeChannel {
  return supabase
    .channel('call-failures')
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'bookings',
        filter: `developer_id=eq.${developerId} AND call_status=eq.failed`,
      },
      async (payload) => {
        // Fetch complete booking data with customer info
        const { data: booking, error } = await supabase
          .from('bookings')
          .select(`
            id,
            booking_time,
            updated_at,
            project_details,
            customer:customer_profiles!inner(
              full_name
            )
          `)
          .eq('id', payload.new.id)
          .single();

        if (!error && booking) {
          onFailure({
            id: booking.id,
            customer_name: booking.customer.full_name,
            booking_time: booking.booking_time,
            failure_time: booking.updated_at,
            project_title: booking.project_details.title
          });
        }
      }
    )
    .subscribe();
}

export async function getCustomerBookings(customerId: string) {
  const { data, error } = await supabase
    .from('bookings')
    .select(`
      *,
      developer:developer_profiles(
        id,
        full_name,
        profile_picture
      )
    `)
    .eq('customer_id', customerId)
    .order('booking_time', { ascending: true });
  
  if (error) throw error;
  return data;
}

export async function getDeveloperBookings(developerId: string) {
  const { data, error } = await supabase
    .from('bookings')
    .select(`
      *,
      customer:customer_profiles!customer_id(
        id,
        full_name
      )
    `)
    .eq('developer_id', developerId)
    .order('booking_time', { ascending: true });
  
  if (error) throw error;
  return data;
}

export async function updateBooking(id: string, updates: Partial<Booking>) {
  const { data, error } = await supabase
    .from('bookings')
    .update({
      ...updates,
      updated_at: new Date().toISOString()
    })
    .eq('id', id)
    .select()
    .single();
  
  if (error) throw error;
  return data;
}

export async function validateAndUpdatePayment(bookingId: string, txHash: string) {
  try {
    // First update the booking with pending validation status
    await updateBooking(bookingId, {
      payment_status: 'validating',
      transaction_hash: txHash,
      validation_attempts: 1,
      validation_timestamp: new Date().toISOString()
    });

    // TODO: Add actual blockchain validation here
    // Example validation flow:
    // 1. Verify transaction exists
    // 2. Check recipient address matches developer's wallet
    // 3. Verify amount matches booking amount
    // 4. Confirm transaction is confirmed (enough blocks)
    
    // Simulate blockchain validation for now
    const validationDelay = 2000; // 2 seconds
    await new Promise(resolve => setTimeout(resolve, validationDelay));

    // Update booking status to paid after validation
    const { data, error } = await supabase
      .from('bookings')
      .update({
        payment_status: 'paid',
        status: 'completed',
        payment_validated: true,
        updated_at: new Date().toISOString()
      })
      .eq('id', bookingId)
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Payment validation failed:', error);
    // Revert to pending payment if validation fails
    await updateBooking(bookingId, {
      payment_status: 'pending_payment',
      validation_attempts: supabase.sql`validation_attempts + 1`
    });
    throw error;
  }
}

// Subscribe to booking cancellations
export function subscribeToBookingCancellations(
  customerId: string,
  onCancellation: (booking: Booking) => void
): RealtimeChannel {
  return supabase
    .channel('booking-cancellations')
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'bookings',
        filter: `customer_id=eq.${customerId} AND status=eq.cancelled`,
      },
      (payload) => {
        onCancellation(payload.new as Booking);
      }
    )
    .subscribe();
}

// Developer listing functions
export async function getAvailableDevelopers() {
  const { data, error } = await supabase
    .from('developer_profiles')
    .select(`
      *,
      skills:developer_skills(
        years_of_experience,
        skill:skills(name)
      )
    `)
    .eq('is_available', true)
    .order('hourly_rate', { ascending: true });
  
  if (error) throw error;
  return data;
}

// Subscribe to developer profile changes
export function subscribeToDevelopers(
  onUpdate: (update: DeveloperUpdate) => void
): RealtimeChannel {
  return supabase
    .channel('developers')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'developer_profiles'
      },
      async (payload) => {
        // Fetch complete developer data including skills
        const { data: profile, error } = await supabase
          .from('developer_profiles')
          .select('*, skills:developer_skills!inner(years_of_experience, skill:skills!inner(name))')
          .eq('id', payload.new.id)
          .single();

        if (!error && profile) {
          onUpdate({
            id: payload.new.id,
            type: payload.eventType,
            profile
          });
        }
      }
    )
    .subscribe();
}
// Rest of the file remains unchanged...