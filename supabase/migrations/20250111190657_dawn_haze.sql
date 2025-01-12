/*
  # Add developer users view

  1. New Views
    - `developer_users_view`: A view that joins developer_profiles with auth.users to get email addresses
  
  2. Changes
    - Modify booking queries to use the new view
*/

-- Create a view to join developer_profiles with auth.users
CREATE OR REPLACE VIEW developer_users_view AS
SELECT 
  dp.*,
  au.email
FROM developer_profiles dp
JOIN auth.users au ON au.id = dp.id;

-- Grant access to the view
GRANT SELECT ON developer_users_view TO anon, authenticated;