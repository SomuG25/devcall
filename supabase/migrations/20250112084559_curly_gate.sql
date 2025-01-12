/*
  # Add Transaction Details
  
  1. Changes
    - Add transaction_hash column to bookings table
    - Add network column for blockchain network
    - Add validation_attempts counter
    - Add validation_timestamp

  2. Security
    - Maintain existing RLS policies
*/

-- Add transaction-related columns
ALTER TABLE bookings
ADD COLUMN IF NOT EXISTS transaction_hash text,
ADD COLUMN IF NOT EXISTS network text DEFAULT 'ethereum',
ADD COLUMN IF NOT EXISTS validation_attempts integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS validation_timestamp timestamptz,
ADD COLUMN IF NOT EXISTS payment_validated boolean DEFAULT false;

-- Add constraint for network
ALTER TABLE bookings
ADD CONSTRAINT valid_network 
CHECK (network IN ('ethereum', 'polygon', 'bsc'));

-- Add validation status to payment_status enum
ALTER TABLE bookings
DROP CONSTRAINT IF EXISTS valid_payment_status;

ALTER TABLE bookings
ADD CONSTRAINT valid_payment_status 
CHECK (payment_status IN ('pending', 'pending_payment', 'validating', 'paid', 'cancelled'));