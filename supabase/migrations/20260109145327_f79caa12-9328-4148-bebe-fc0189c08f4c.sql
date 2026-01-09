-- Create role enum
CREATE TYPE public.app_role AS ENUM ('admin', 'user');

-- Create user_roles table for role assignments
CREATE TABLE public.user_roles (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role app_role NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE (user_id, role)
);

-- Enable RLS on user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Create security definer function to check roles (avoids RLS recursion)
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Create function to check if user is approved (has any role)
CREATE OR REPLACE FUNCTION public.is_approved_user(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
  )
$$;

-- RLS policies for user_roles table
CREATE POLICY "Admins can manage all roles"
ON public.user_roles
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can view their own roles"
ON public.user_roles
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- Drop existing movies policies
DROP POLICY IF EXISTS "Anyone can view movies" ON public.movies;
DROP POLICY IF EXISTS "Users can insert their own movies" ON public.movies;
DROP POLICY IF EXISTS "Users can update their own movies" ON public.movies;
DROP POLICY IF EXISTS "Users can delete their own movies" ON public.movies;

-- New movies policies
-- Anyone can view movies (public read)
CREATE POLICY "Anyone can view movies"
ON public.movies
FOR SELECT
USING (true);

-- Approved users (anyone with a role) can insert movies
CREATE POLICY "Approved users can insert movies"
ON public.movies
FOR INSERT
TO authenticated
WITH CHECK (
  public.is_approved_user(auth.uid()) 
  AND auth.uid() = user_id
);

-- Users can update their own movies, admins can update any
CREATE POLICY "Users can update own movies or admin can update any"
ON public.movies
FOR UPDATE
TO authenticated
USING (
  user_id = auth.uid() 
  OR public.has_role(auth.uid(), 'admin')
);

-- Only admins can delete movies
CREATE POLICY "Only admins can delete movies"
ON public.movies
FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));