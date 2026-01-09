import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { Movie } from "./useMovies";

export interface Collection {
  id: string;
  name: string;
  description: string | null;
  cover_image: string | null;
  user_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface CollectionWithMovies extends Collection {
  movies: Movie[];
}

export function useCollections() {
  return useQuery({
    queryKey: ["collections"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("collections")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as Collection[];
    },
  });
}

export function useCollectionWithMovies(id: string) {
  return useQuery({
    queryKey: ["collection", id],
    queryFn: async () => {
      // Fetch collection
      const { data: collection, error: collectionError } = await supabase
        .from("collections")
        .select("*")
        .eq("id", id)
        .maybeSingle();

      if (collectionError) throw collectionError;
      if (!collection) return null;

      // Fetch movies in collection
      const { data: collectionMovies, error: moviesError } = await supabase
        .from("collection_movies")
        .select("movie_id")
        .eq("collection_id", id);

      if (moviesError) throw moviesError;

      const movieIds = collectionMovies.map((cm) => cm.movie_id);

      let movies: Movie[] = [];
      if (movieIds.length > 0) {
        const { data: moviesData, error: fetchError } = await supabase
          .from("movies")
          .select("*")
          .in("id", movieIds);

        if (fetchError) throw fetchError;
        movies = moviesData as Movie[];
      }

      return { ...collection, movies } as CollectionWithMovies;
    },
    enabled: !!id,
  });
}

export function useCollectionsWithMovies() {
  return useQuery({
    queryKey: ["collections-with-movies"],
    queryFn: async () => {
      // Fetch all collections
      const { data: collections, error: collectionsError } = await supabase
        .from("collections")
        .select("*")
        .order("created_at", { ascending: false });

      if (collectionsError) throw collectionsError;

      // Fetch all collection_movies
      const { data: collectionMovies, error: cmError } = await supabase
        .from("collection_movies")
        .select("collection_id, movie_id");

      if (cmError) throw cmError;

      // Fetch all movies
      const { data: movies, error: moviesError } = await supabase
        .from("movies")
        .select("*");

      if (moviesError) throw moviesError;

      // Build collections with movies
      const collectionsWithMovies = collections.map((collection) => {
        const movieIds = collectionMovies
          .filter((cm) => cm.collection_id === collection.id)
          .map((cm) => cm.movie_id);
        const collectionMoviesList = movies.filter((m) =>
          movieIds.includes(m.id)
        );
        return { ...collection, movies: collectionMoviesList };
      });

      return collectionsWithMovies as CollectionWithMovies[];
    },
  });
}

export function useAddCollection() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (collection: { name: string; description?: string }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Must be logged in to create collections");
      
      const { data, error } = await supabase
        .from("collections")
        .insert({ ...collection, user_id: user.id })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["collections"] });
      queryClient.invalidateQueries({ queryKey: ["collections-with-movies"] });
      toast.success("Collection created!");
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}

export function useDeleteCollection() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("collections").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["collections"] });
      queryClient.invalidateQueries({ queryKey: ["collections-with-movies"] });
      toast.success("Collection deleted!");
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}

export function useAddMovieToCollection() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      collectionId,
      movieId,
    }: {
      collectionId: string;
      movieId: string;
    }) => {
      const { error } = await supabase
        .from("collection_movies")
        .insert({ collection_id: collectionId, movie_id: movieId });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["collections"] });
      queryClient.invalidateQueries({ queryKey: ["collections-with-movies"] });
      queryClient.invalidateQueries({ queryKey: ["collection"] });
      toast.success("Movie added to collection!");
    },
    onError: (error: Error) => {
      if (error.message.includes("duplicate")) {
        toast.error("Movie already in this collection");
      } else {
        toast.error(error.message);
      }
    },
  });
}

export function useRemoveMovieFromCollection() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      collectionId,
      movieId,
    }: {
      collectionId: string;
      movieId: string;
    }) => {
      const { error } = await supabase
        .from("collection_movies")
        .delete()
        .eq("collection_id", collectionId)
        .eq("movie_id", movieId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["collections"] });
      queryClient.invalidateQueries({ queryKey: ["collections-with-movies"] });
      queryClient.invalidateQueries({ queryKey: ["collection"] });
      toast.success("Movie removed from collection!");
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}
