/*
  # Clear all data for demo

  This migration safely clears all data from tables while preserving the schema
  and functionality.
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