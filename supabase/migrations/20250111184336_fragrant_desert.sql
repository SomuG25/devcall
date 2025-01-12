/*
  # Separate Developer and Customer Systems

  1. Changes
    - Add unique constraint to user_roles to prevent duplicate roles
    - Add trigger to handle role-specific profile creation
    - Add function to manage role assignments

  2. Security
    - Maintain RLS policies
    - Ensure data integrity across roles
*/

-- Create function to handle profile creation
CREATE OR REPLACE FUNCTION handle_role_profile()
RETURNS TRIGGER AS $$
BEGIN
  -- Create corresponding profile based on role
  IF NEW.role = 'developer' THEN
    INSERT INTO developer_profiles (id)
    VALUES (NEW.user_id)
    ON CONFLICT (id) DO NOTHING;
  ELSIF NEW.role = 'customer' THEN
    INSERT INTO customer_profiles (id)
    VALUES (NEW.user_id)
    ON CONFLICT (id) DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic profile creation
DROP TRIGGER IF EXISTS create_role_profile ON user_roles;
CREATE TRIGGER create_role_profile
  AFTER INSERT ON user_roles
  FOR EACH ROW
  EXECUTE FUNCTION handle_role_profile();

-- Add unique constraint to prevent duplicate roles
ALTER TABLE user_roles
DROP CONSTRAINT IF EXISTS unique_user_role;

ALTER TABLE user_roles
ADD CONSTRAINT unique_user_role 
UNIQUE (user_id, role);

-- Function to safely add a role
CREATE OR REPLACE FUNCTION add_user_role(
  p_user_id uuid,
  p_role text,
  p_is_primary boolean DEFAULT false
)
RETURNS boolean AS $$
BEGIN
  -- Insert new role if it doesn't exist
  INSERT INTO user_roles (user_id, role, is_primary)
  VALUES (p_user_id, p_role, p_is_primary)
  ON CONFLICT (user_id, role) 
  DO UPDATE SET is_primary = EXCLUDED.is_primary;
  
  RETURN true;
END;
$$ LANGUAGE plpgsql;