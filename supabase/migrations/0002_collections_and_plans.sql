-- Create collections table
CREATE TABLE IF NOT EXISTS public.collections (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Add collection_id and metadata to generations
ALTER TABLE public.generations ADD COLUMN IF NOT EXISTS collection_id UUID REFERENCES public.collections(id) ON DELETE SET NULL;
ALTER TABLE public.generations ADD COLUMN IF NOT EXISTS version INTEGER DEFAULT 1;
ALTER TABLE public.generations ADD COLUMN IF NOT EXISTS parent_id UUID REFERENCES public.generations(id) ON DELETE SET NULL;

-- Add subscription info to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS plan_type TEXT DEFAULT 'trial' CHECK (plan_type IN ('trial', 'basic', 'standard', 'pro', 'enterprise'));
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS generation_count INTEGER DEFAULT 0;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS subscription_ends_at TIMESTAMP WITH TIME ZONE;

-- Enable RLS for collections
ALTER TABLE public.collections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own collections"
    ON public.collections FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own collections"
    ON public.collections FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own collections"
    ON public.collections FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own collections"
    ON public.collections FOR DELETE
    USING (auth.uid() = user_id);

-- Create a helper function to increment generation count
CREATE OR REPLACE FUNCTION increment_generation_count()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE public.profiles
    SET generation_count = generation_count + 1
    WHERE id = NEW.user_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_generation_created
    AFTER INSERT ON public.generations
    FOR EACH ROW
    EXECUTE FUNCTION increment_generation_count();
