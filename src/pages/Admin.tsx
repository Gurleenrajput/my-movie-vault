import { useState } from "react";
import { Navigate } from "react-router-dom";
import { Search, Loader2, Plus, Trash2, Film } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Header } from "@/components/Header";
import { useAuth } from "@/hooks/useAuth";
import { useMovies, useAddMovie, useDeleteMovie } from "@/hooks/useMovies";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface TMDBMovie {
  id: number;
  title: string;
  overview: string;
  poster_path: string | null;
  backdrop_path: string | null;
  release_date: string;
  vote_average: number;
  genre_ids: number[];
}

interface TMDBMovieDetails {
  id: number;
  title: string;
  overview: string;
  poster_path: string | null;
  backdrop_path: string | null;
  release_date: string;
  runtime: number;
  vote_average: number;
  genres: { id: number; name: string }[];
}

const Admin = () => {
  const { user, loading: authLoading } = useAuth();
  const { data: movies, isLoading: moviesLoading } = useMovies();
  const addMovie = useAddMovie();
  const deleteMovie = useDeleteMovie();

  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<TMDBMovie[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [addingMovieId, setAddingMovieId] = useState<number | null>(null);

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    try {
      const { data, error } = await supabase.functions.invoke("tmdb-search", {
        body: { query: searchQuery },
      });

      if (error) throw error;
      setSearchResults(data.results || []);
    } catch (error) {
      console.error("Search error:", error);
      toast.error("Failed to search movies");
    } finally {
      setIsSearching(false);
    }
  };

  const handleAddMovie = async (tmdbId: number) => {
    setAddingMovieId(tmdbId);
    try {
      // Fetch full movie details
      const { data, error } = await supabase.functions.invoke("tmdb-details", {
        body: { movieId: tmdbId },
      });

      if (error) throw error;

      const details: TMDBMovieDetails = data;

      await addMovie.mutateAsync({
        tmdb_id: details.id,
        title: details.title,
        overview: details.overview,
        poster_path: details.poster_path,
        backdrop_path: details.backdrop_path,
        release_date: details.release_date || null,
        runtime: details.runtime || null,
        vote_average: details.vote_average || null,
        genres: details.genres?.map((g) => g.name) || null,
      });

      setSearchResults((prev) => prev.filter((m) => m.id !== tmdbId));
    } catch (error) {
      console.error("Add movie error:", error);
    } finally {
      setAddingMovieId(null);
    }
  };

  const isMovieAdded = (tmdbId: number) => 
    movies?.some((m) => m.tmdb_id === tmdbId);

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="pt-24 pb-12 px-4">
        <div className="container mx-auto max-w-4xl">
          <h1 className="font-display text-4xl text-foreground mb-8">
            Admin Dashboard
          </h1>

          {/* Search Section */}
          <Card className="mb-8 bg-card border-border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Search className="w-5 h-5" />
                Search TMDB
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSearch} className="flex gap-2">
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search for a movie..."
                  className="flex-1 bg-background"
                />
                <Button type="submit" disabled={isSearching}>
                  {isSearching ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Search className="w-4 h-4" />
                  )}
                </Button>
              </form>

              {/* Search Results */}
              {searchResults.length > 0 && (
                <div className="mt-6 space-y-3">
                  <h3 className="text-sm font-medium text-muted-foreground">
                    Search Results
                  </h3>
                  {searchResults.map((movie) => (
                    <div
                      key={movie.id}
                      className="flex items-center gap-4 p-3 rounded-lg bg-background border border-border"
                    >
                      {movie.poster_path ? (
                        <img
                          src={`https://image.tmdb.org/t/p/w92${movie.poster_path}`}
                          alt={movie.title}
                          className="w-12 h-18 rounded object-cover"
                        />
                      ) : (
                        <div className="w-12 h-18 rounded bg-muted flex items-center justify-center">
                          <Film className="w-6 h-6 text-muted-foreground" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-foreground truncate">
                          {movie.title}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {movie.release_date
                            ? new Date(movie.release_date).getFullYear()
                            : "N/A"}{" "}
                          • ⭐ {movie.vote_average.toFixed(1)}
                        </p>
                      </div>
                      <Button
                        size="sm"
                        disabled={isMovieAdded(movie.id) || addingMovieId === movie.id}
                        onClick={() => handleAddMovie(movie.id)}
                      >
                        {addingMovieId === movie.id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : isMovieAdded(movie.id) ? (
                          "Added"
                        ) : (
                          <>
                            <Plus className="w-4 h-4 mr-1" />
                            Add
                          </>
                        )}
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* My Movies Section */}
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Film className="w-5 h-5" />
                My Movies ({movies?.length || 0})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {moviesLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="h-16 bg-muted animate-pulse rounded-lg" />
                  ))}
                </div>
              ) : movies?.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">
                  No movies added yet. Search for movies above!
                </p>
              ) : (
                <div className="space-y-3">
                  {movies?.map((movie) => (
                    <div
                      key={movie.id}
                      className="flex items-center gap-4 p-3 rounded-lg bg-background border border-border"
                    >
                      {movie.poster_path ? (
                        <img
                          src={`https://image.tmdb.org/t/p/w92${movie.poster_path}`}
                          alt={movie.title}
                          className="w-12 h-18 rounded object-cover"
                        />
                      ) : (
                        <div className="w-12 h-18 rounded bg-muted flex items-center justify-center">
                          <Film className="w-6 h-6 text-muted-foreground" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-foreground truncate">
                          {movie.title}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {movie.release_date
                            ? new Date(movie.release_date).getFullYear()
                            : "N/A"}{" "}
                          • ⭐ {movie.vote_average?.toFixed(1) || "N/A"}
                        </p>
                      </div>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="destructive" size="sm">
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete Movie</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to delete "{movie.title}" from
                              your collection? This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => deleteMovie.mutate(movie.id)}
                            >
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default Admin;
