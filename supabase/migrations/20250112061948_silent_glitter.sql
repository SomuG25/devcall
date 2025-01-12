/*
  # Add organization field to customer profiles

  1. Changes
    - Add organization field to customer_profiles table
*/

-- Add organization field to customer_profiles
ALTER TABLE customer_profiles 
ADD COLUMN organization text;