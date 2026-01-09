-- Create collections table
CREATE TABLE public.collections (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    cover_image TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create junction table for movies in collections
CREATE TABLE public.collection_movies (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    collection_id UUID NOT NULL REFERENCES public.collections(id) ON DELETE CASCADE,
    movie_id UUID NOT NULL REFERENCES public.movies(id) ON DELETE CASCADE,
    added_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE(collection_id, movie_id)
);

-- Enable RLS
ALTER TABLE public.collections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.collection_movies ENABLE ROW LEVEL SECURITY;

-- Public can view collections
CREATE POLICY "Anyone can view collections" 
ON public.collections 
FOR SELECT 
USING (true);

-- Only authenticated users can manage collections
CREATE POLICY "Authenticated users can insert collections" 
ON public.collections 
FOR INSERT 
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update collections" 
ON public.collections 
FOR UPDATE 
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can delete collections" 
ON public.collections 
FOR DELETE 
USING (auth.uid() IS NOT NULL);

-- Public can view collection_movies
CREATE POLICY "Anyone can view collection_movies" 
ON public.collection_movies 
FOR SELECT 
USING (true);

-- Only authenticated users can manage collection_movies
CREATE POLICY "Authenticated users can insert collection_movies" 
ON public.collection_movies 
FOR INSERT 
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can delete collection_movies" 
ON public.collection_movies 
FOR DELETE 
USING (auth.uid() IS NOT NULL);

-- Add trigger for updated_at
CREATE TRIGGER update_collections_updated_at
BEFORE UPDATE ON public.collections
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();