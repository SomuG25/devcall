/*
  # Clear All User Data

  1. Changes
    - Remove all existing user data using safe DELETE operations
    - Preserve table structure and relationships
    - Maintain RLS policies and constraints

  Note: This migration uses a safer approach that works within RLS constraints
*/

DO $$ 
BEGIN
  -- Clear all data from tables in correct order to respect foreign keys
  DELETE FROM bookings;
  DELETE FROM developer_skills;
  DELETE FROM developer_profiles;
  DELETE FROM customer_profiles;
  DELETE FROM user_roles;

  -- Delete auth.users using Supabase's auth.users table
  -- This will cascade to all related data
  DELETE FROM auth.users;
END $$;