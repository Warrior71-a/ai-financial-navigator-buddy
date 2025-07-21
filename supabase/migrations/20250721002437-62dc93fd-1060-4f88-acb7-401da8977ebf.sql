-- Fix function search path security warning
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    -- Set search path to an empty string to prevent schema resolution surprises
    SET search_path = '';
    
    -- Your existing function logic here
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;