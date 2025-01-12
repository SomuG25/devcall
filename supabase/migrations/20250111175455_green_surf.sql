/*
  # Update RLS policies for profile creation

  1. Changes
    - Add policies to allow profile creation during signup
    - Maintain existing security while enabling new user registration
  
  2. Security
    - Enable profile creation for authenticated users
    - Maintain read-only access for public profiles
    - Preserve update restrictions to own profile only
*/

-- Policies for developer_profiles
CREATE POLICY "Users can create their own profile"
  ON developer_profiles
  FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Policies for customer_profiles
CREATE POLICY "Users can create their own profile"
  ON customer_profiles
  FOR INSERT
  WITH CHECK (auth.uid() = id);