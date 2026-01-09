import { useState } from "react";
import { Navigate } from "react-router-dom";
import { Search, Loader2, Plus, Trash2, Film, Folder, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Header } from "@/components/Header";
import { useAuth } from "@/hooks/useAuth";
import { useMovies, useAddMovie, useDeleteMovie } from "@/hooks/useMovies";
import {
  useCollections,
  useAddCollection,
  useDeleteCollection,
  useAddMovieToCollection,
  useRemoveMovieFromCollection,
} from "@/hooks/useCollections";
import { useIsAdmin, useIsApproved } from "@/hooks/useUserRoles";
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { UserManagement } from "@/components/UserManagement";

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
  const { data: isAdmin, isLoading: adminLoading } = useIsAdmin();
  const { data: isApproved, isLoading: approvedLoading } = useIsApproved();
  const { data: movies, isLoading: moviesLoading } = useMovies();
  const { data: collections, isLoading: collectionsLoading } = useCollections();
  const addMovie = useAddMovie();
  const deleteMovie = useDeleteMovie();
  const addCollection = useAddCollection();
  const deleteCollection = useDeleteCollection();
  const addMovieToCollection = useAddMovieToCollection();
  const removeMovieFromCollection = useRemoveMovieFromCollection();

  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<TMDBMovie[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [addingMovieId, setAddingMovieId] = useState<number | null>(null);

  const [newCollectionName, setNewCollectionName] = useState("");
  const [newCollectionDescription, setNewCollectionDescription] = useState("");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [selectedCollectionId, setSelectedCollectionId] = useState<string>("");
  const [isManageDialogOpen, setIsManageDialogOpen] = useState(false);
  const [managingCollection, setManagingCollection] = useState<{
    id: string;
    name: string;
  } | null>(null);
  const [collectionMovies, setCollectionMovies] = useState<string[]>([]);

  if (authLoading || adminLoading || approvedLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (!isApproved && !isAdmin) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="pt-24 pb-12 px-4">
          <div className="container mx-auto max-w-md text-center">
            <Card className="bg-card border-border">
              <CardContent className="pt-6">
                <div className="text-6xl mb-4">⏳</div>
                <h2 className="text-xl font-semibold text-foreground mb-2">
                  Awaiting Approval
                </h2>
                <p className="text-muted-foreground">
                  Your account is pending admin approval. You'll be able to add movies once approved.
                </p>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    );
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

  const handleCreateCollection = async () => {
    if (!newCollectionName.trim()) return;

    await addCollection.mutateAsync({
      name: newCollectionName.trim(),
      description: newCollectionDescription.trim() || undefined,
    });

    setNewCollectionName("");
    setNewCollectionDescription("");
    setIsCreateDialogOpen(false);
  };

  const handleAddToCollection = async (movieId: string) => {
    if (!selectedCollectionId) return;

    await addMovieToCollection.mutateAsync({
      collectionId: selectedCollectionId,
      movieId,
    });
  };

  const openManageDialog = async (collection: { id: string; name: string }) => {
    setManagingCollection(collection);
    // Fetch movies in this collection
    const { data } = await supabase
      .from("collection_movies")
      .select("movie_id")
      .eq("collection_id", collection.id);

    setCollectionMovies(data?.map((cm) => cm.movie_id) || []);
    setIsManageDialogOpen(true);
  };

  const toggleMovieInCollection = async (movieId: string) => {
    if (!managingCollection) return;

    if (collectionMovies.includes(movieId)) {
      await removeMovieFromCollection.mutateAsync({
        collectionId: managingCollection.id,
        movieId,
      });
      setCollectionMovies((prev) => prev.filter((id) => id !== movieId));
    } else {
      await addMovieToCollection.mutateAsync({
        collectionId: managingCollection.id,
        movieId,
      });
      setCollectionMovies((prev) => [...prev, movieId]);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="pt-24 pb-12 px-4">
        <div className="container mx-auto max-w-4xl">
          <h1 className="font-display text-4xl text-foreground mb-8">
            {isAdmin ? "Admin Dashboard" : "Dashboard"}
          </h1>

          {/* User Management - Admin Only */}
          {isAdmin && (
            <div className="mb-8">
              <UserManagement />
            </div>
          )}

          {/* Collections Section */}
          <Card className="mb-8 bg-card border-border">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Folder className="w-5 h-5" />
                  Collections ({collections?.length || 0})
                </span>
                <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                  <DialogTrigger asChild>
                    <Button size="sm">
                      <Plus className="w-4 h-4 mr-1" />
                      New Collection
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Create Collection</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 mt-4">
                      <Input
                        placeholder="Collection name"
                        value={newCollectionName}
                        onChange={(e) => setNewCollectionName(e.target.value)}
                      />
                      <Input
                        placeholder="Description (optional)"
                        value={newCollectionDescription}
                        onChange={(e) => setNewCollectionDescription(e.target.value)}
                      />
                      <Button
                        onClick={handleCreateCollection}
                        disabled={!newCollectionName.trim() || addCollection.isPending}
                        className="w-full"
                      >
                        {addCollection.isPending ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          "Create Collection"
                        )}
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {collectionsLoading ? (
                <div className="space-y-3">
                  {[1, 2].map((i) => (
                    <div key={i} className="h-12 bg-muted animate-pulse rounded-lg" />
                  ))}
                </div>
              ) : collections?.length === 0 ? (
                <p className="text-muted-foreground text-center py-4">
                  No collections yet. Create one above!
                </p>
              ) : (
                <div className="space-y-3">
                  {collections?.map((collection) => (
                    <div
                      key={collection.id}
                      className="flex items-center gap-4 p-3 rounded-lg bg-background border border-border"
                    >
                      <Folder className="w-8 h-8 text-primary" />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-foreground truncate">
                          {collection.name}
                        </p>
                        {collection.description && (
                          <p className="text-sm text-muted-foreground truncate">
                            {collection.description}
                          </p>
                        )}
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openManageDialog(collection)}
                      >
                        Manage
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="destructive" size="sm">
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete Collection</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to delete "{collection.name}"?
                              This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => deleteCollection.mutate(collection.id)}
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

          {/* Manage Collection Dialog */}
          <Dialog open={isManageDialogOpen} onOpenChange={setIsManageDialogOpen}>
            <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Manage: {managingCollection?.name}</DialogTitle>
              </DialogHeader>
              <div className="space-y-2 mt-4">
                <p className="text-sm text-muted-foreground mb-4">
                  Click on movies to add/remove them from this collection
                </p>
                {movies?.map((movie) => (
                  <div
                    key={movie.id}
                    onClick={() => toggleMovieInCollection(movie.id)}
                    className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-colors ${
                      collectionMovies.includes(movie.id)
                        ? "bg-primary/20 border border-primary"
                        : "bg-muted hover:bg-muted/80 border border-transparent"
                    }`}
                  >
                    {movie.poster_path ? (
                      <img
                        src={`https://image.tmdb.org/t/p/w92${movie.poster_path}`}
                        alt={movie.title}
                        className="w-10 h-15 rounded object-cover"
                      />
                    ) : (
                      <div className="w-10 h-15 rounded bg-card flex items-center justify-center">
                        <Film className="w-5 h-5 text-muted-foreground" />
                      </div>
                    )}
                    <span className="flex-1 text-foreground truncate">{movie.title}</span>
                    {collectionMovies.includes(movie.id) && (
                      <Badge variant="secondary">Added</Badge>
                    )}
                  </div>
                ))}
              </div>
            </DialogContent>
          </Dialog>

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
                      {isAdmin && (
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
                      )}
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
