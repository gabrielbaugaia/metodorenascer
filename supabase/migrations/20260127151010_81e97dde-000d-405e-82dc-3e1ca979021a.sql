-- Add columns for automated message control
ALTER TABLE automated_messages 
ADD COLUMN IF NOT EXISTS min_days_since_signup integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS cooldown_days integer DEFAULT 0;

-- Add comments for documentation
COMMENT ON COLUMN automated_messages.min_days_since_signup IS 'Minimum days since user signup before sending this message';
COMMENT ON COLUMN automated_messages.cooldown_days IS 'Minimum days between sending this message to the same user';