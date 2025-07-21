-- Fix credit transfer functionality by allowing negative amounts for credit transfers
-- This script addresses database constraint violations when transferring credits

-- First, add Credit Transfer as valid payment method
ALTER TABLE payments 
DROP CONSTRAINT IF EXISTS payments_payment_method_check;

ALTER TABLE payments 
ADD CONSTRAINT payments_payment_method_check 
CHECK (payment_method IN ('cash', 'paynow', 'bank_transfer', 'other', 'credit_transfer'));

-- Modify amount constraint to allow negative amounts for credit transfers only
ALTER TABLE payments 
DROP CONSTRAINT IF EXISTS payments_amount_check;

ALTER TABLE payments 
ADD CONSTRAINT payments_amount_check 
CHECK (
  (payment_method = 'credit_transfer' AND amount != 0) OR 
  (payment_method != 'credit_transfer' AND amount > 0)
);