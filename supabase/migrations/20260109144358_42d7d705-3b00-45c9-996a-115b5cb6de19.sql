-- =====================================================
-- Fix Security Issues: Add User Ownership Tracking
-- =====================================================

-- 1. Add user_id column to movies table
ALTER TABLE public.movies 
  ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- 2. Add user_id column to collections table  
ALTER TABLE public.collections 
  ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- 3. Drop existing overly permissive policies on movies
DROP POLICY IF EXISTS "Authenticated users can insert movies" ON public.movies;
DROP POLICY IF EXISTS "Authenticated users can update movies" ON public.movies;
DROP POLICY IF EXISTS "Authenticated users can delete movies" ON public.movies;

-- 4. Drop existing overly permissive policies on collections
DROP POLICY IF EXISTS "Authenticated users can insert collections" ON public.collections;
DROP POLICY IF EXISTS "Authenticated users can update collections" ON public.collections;
DROP POLICY IF EXISTS "Authenticated users can delete collections" ON public.collections;

-- 5. Drop existing policies on collection_movies
DROP POLICY IF EXISTS "Authenticated users can insert collection_movies" ON public.collection_movies;
DROP POLICY IF EXISTS "Authenticated users can delete collection_movies" ON public.collection_movies;

-- 6. Create new RLS policies for movies with user ownership
CREATE POLICY "Users can insert their own movies"
  ON public.movies FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own movies"
  ON public.movies FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own movies"
  ON public.movies FOR DELETE
  USING (auth.uid() = user_id);

-- 7. Create new RLS policies for collections with user ownership
CREATE POLICY "Users can insert their own collections"
  ON public.collections FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own collections"
  ON public.collections FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own collections"
  ON public.collections FOR DELETE
  USING (auth.uid() = user_id);

-- 8. Create new RLS policies for collection_movies based on collection ownership
CREATE POLICY "Users can add movies to their collections"
  ON public.collection_movies FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.collections
      WHERE collections.id = collection_movies.collection_id
      AND collections.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can remove movies from their collections"
  ON public.collection_movies FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.collections
      WHERE collections.id = collection_movies.collection_id
      AND collections.user_id = auth.uid()
    )
  );