-- Add approval workflow fields to farmers table
ALTER TABLE farmers ADD COLUMN approval_status TEXT DEFAULT 'approved' CHECK (approval_status IN ('pending', 'approved', 'rejected'));
ALTER TABLE farmers ADD COLUMN rejection_reason TEXT;

-- Add registration_number to cooperatives table
ALTER TABLE cooperatives ADD COLUMN registration_number TEXT UNIQUE;

-- Update existing cooperative members to pending status (if they exist)
UPDATE farmers 
SET approval_status = 'pending' 
WHERE is_cooperative_member = 1 
  AND role = 'cooperative'
  AND approval_status IS NULL;

-- Update existing non-cooperative farmers to approved
UPDATE farmers 
SET approval_status = 'approved' 
WHERE (is_cooperative_member = 0 OR is_cooperative_member IS NULL)
  AND approval_status IS NULL;
