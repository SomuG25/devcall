/*
  # Add user roles and relationships

  1. New Tables
    - `user_roles` - Tracks roles for each user
      - `user_id` (uuid, references auth.users)
      - `role` (text, either 'developer' or 'customer')
      - `is_primary` (boolean, indicates primary role)

  2. Changes
    - Add relationships between users and roles
    - Add policies for role management
    
  3. Security
    - Enable RLS on user_roles table
    - Add policies for role access
*/

-- Create user roles table
CREATE TABLE user_roles (
    user_id uuid REFERENCES auth.users ON DELETE CASCADE,
    role text NOT NULL CHECK (role IN ('developer', 'customer')),
    is_primary boolean NOT NULL DEFAULT false,
    created_at timestamptz DEFAULT now(),
    PRIMARY KEY (user_id, role)
);

-- Enable RLS
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;

-- Policies for user_roles
CREATE POLICY "Users can view their own roles"
    ON user_roles
    FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "System can manage roles"
    ON user_roles
    FOR ALL
    USING (true)
    WITH CHECK (true);