/*
  # Create profiles and bookings tables

  1. New Tables
    - `developer_profiles`
      - Extended profile information for developers
      - Linked to auth.users
      - Stores professional details, hourly rate, etc.
    
    - `customer_profiles`
      - Extended profile information for customers
      - Linked to auth.users
      - Stores basic customer details
    
    - `bookings`
      - Stores all booking information
      - Links customers and developers
      - Tracks booking status, payment status, etc.

  2. Security
    - Enable RLS on all tables
    - Policies for profile access and management
    - Policies for booking creation and viewing
*/

-- Create developer profiles table
CREATE TABLE developer_profiles (
  id uuid PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  full_name text,
  bio text,
  hourly_rate integer NOT NULL DEFAULT 0,
  location text,
  education text,
  github_profile text,
  linkedin_profile text,
  wallet_address text,
  profile_picture text,
  is_available boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create customer profiles table
CREATE TABLE customer_profiles (
  id uuid PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  full_name text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create bookings table
CREATE TABLE bookings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id uuid REFERENCES customer_profiles(id) ON DELETE CASCADE,
  developer_id uuid REFERENCES developer_profiles(id) ON DELETE CASCADE,
  booking_time timestamptz NOT NULL,
  duration interval NOT NULL,
  amount decimal NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  call_status text,
  payment_status text NOT NULL DEFAULT 'pending',
  call_link text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT valid_status CHECK (status IN ('pending', 'upcoming', 'completed', 'cancelled')),
  CONSTRAINT valid_call_status CHECK (call_status IN ('completed', 'failed', NULL)),
  CONSTRAINT valid_payment_status CHECK (payment_status IN ('pending', 'pending_payment', 'paid', 'cancelled'))
);

-- Enable RLS
ALTER TABLE developer_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;

-- Policies for developer_profiles
CREATE POLICY "Public profiles are viewable by everyone"
  ON developer_profiles
  FOR SELECT
  USING (true);

CREATE POLICY "Users can update own profile"
  ON developer_profiles
  FOR UPDATE
  USING (auth.uid() = id);

-- Policies for customer_profiles
CREATE POLICY "Profiles are viewable by everyone"
  ON customer_profiles
  FOR SELECT
  USING (true);

CREATE POLICY "Users can update own profile"
  ON customer_profiles
  FOR UPDATE
  USING (auth.uid() = id);

-- Policies for bookings
CREATE POLICY "Customers can view own bookings"
  ON bookings
  FOR SELECT
  USING (auth.uid() = customer_id);

CREATE POLICY "Developers can view assigned bookings"
  ON bookings
  FOR SELECT
  USING (auth.uid() = developer_id);

CREATE POLICY "Customers can create bookings"
  ON bookings
  FOR INSERT
  WITH CHECK (auth.uid() = customer_id);

CREATE POLICY "Involved parties can update bookings"
  ON bookings
  FOR UPDATE
  USING (auth.uid() IN (customer_id, developer_id));