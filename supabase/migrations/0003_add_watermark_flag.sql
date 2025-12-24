-- Add is_watermarked column to generations table
ALTER TABLE public.generations 
ADD COLUMN IF NOT EXISTS is_watermarked BOOLEAN DEFAULT false;

-- Force update trial user's existing generations (optional, but good for consistency)
UPDATE public.generations g
SET is_watermarked = true
FROM public.profiles p
WHERE g.user_id = p.id AND (p.plan_type = 'trial' OR p.plan_type IS NULL);
