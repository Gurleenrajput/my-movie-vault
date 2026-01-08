-- Create movies table for storing watched movies
CREATE TABLE public.movies (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    tmdb_id INTEGER UNIQUE NOT NULL,
    title TEXT NOT NULL,
    overview TEXT,
    poster_path TEXT,
    backdrop_path TEXT,
    release_date DATE,
    runtime INTEGER,
    vote_average NUMERIC(3, 1),
    genres TEXT[],
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.movies ENABLE ROW LEVEL SECURITY;

-- Public can read all movies
CREATE POLICY "Anyone can view movies"
ON public.movies
FOR SELECT
USING (true);

-- Only authenticated users can insert movies
CREATE POLICY "Authenticated users can insert movies"
ON public.movies
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Only authenticated users can update movies
CREATE POLICY "Authenticated users can update movies"
ON public.movies
FOR UPDATE
TO authenticated
USING (true);

-- Only authenticated users can delete movies
CREATE POLICY "Authenticated users can delete movies"
ON public.movies
FOR DELETE
TO authenticated
USING (true);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_movies_updated_at
BEFORE UPDATE ON public.movies
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();