/*
  # Add project details to bookings table

  1. Changes
    - Add project_details JSONB column to bookings table to store project information
    - Add validation check for project_details structure
*/

-- Add project_details column
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS project_details JSONB;

-- Add check constraint to ensure project_details has required fields
ALTER TABLE bookings ADD CONSTRAINT valid_project_details 
  CHECK (
    project_details IS NULL OR (
      project_details ? 'title' AND
      project_details ? 'description' AND
      project_details ? 'requirements' AND
      project_details ? 'goals'
    )
  );