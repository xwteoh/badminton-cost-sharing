-- Fix the balance calculation formula
-- Current: current_balance = total_paid - total_owed (WRONG)
-- Correct: current_balance = total_owed - total_paid

-- Step 1: Drop the existing generated column
ALTER TABLE player_balances DROP COLUMN current_balance;

-- Step 2: Add the corrected generated column  
ALTER TABLE player_balances ADD COLUMN current_balance DECIMAL(10,2) GENERATED ALWAYS AS (total_owed - total_paid) STORED;

-- Step 3: Update the computed column (this will automatically recalculate all balances)
-- No additional action needed - the GENERATED ALWAYS column will automatically recalculate