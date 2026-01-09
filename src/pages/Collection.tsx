import { useParams, Link } from "react-router-dom";
import { ArrowLeft, Folder } from "lucide-react";
import { Header } from "@/components/Header";
import { MovieGrid } from "@/components/MovieGrid";
import { useCollectionWithMovies } from "@/hooks/useCollections";
import { Skeleton } from "@/components/ui/skeleton";

const Collection = () => {
  const { id } = useParams<{ id: string }>();
  const { data: collection, isLoading } = useCollectionWithMovies(id || "");

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="pt-24 pb-12 px-4">
          <div className="container mx-auto">
            <Skeleton className="h-10 w-64 mb-4" />
            <Skeleton className="h-6 w-96 mb-8" />
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {[1, 2, 3, 4].map((i) => (
                <Skeleton key={i} className="aspect-[2/3] rounded-lg" />
              ))}
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (!collection) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="pt-24 pb-12 px-4">
          <div className="container mx-auto text-center">
            <Folder className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h1 className="font-display text-3xl text-foreground mb-4">
              Collection Not Found
            </h1>
            <Link to="/" className="text-primary hover:underline">
              ← Back to Home
            </Link>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="pt-24 pb-12 px-4">
        <div className="container mx-auto">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-6"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </Link>

          <div className="mb-8">
            <h1 className="font-display text-4xl md:text-5xl text-foreground mb-2">
              {collection.name}
            </h1>
            {collection.description && (
              <p className="text-muted-foreground text-lg max-w-2xl">
                {collection.description}
              </p>
            )}
            <p className="text-muted-foreground mt-2">
              {collection.movies.length} movie{collection.movies.length !== 1 ? "s" : ""}
            </p>
          </div>

          {collection.movies.length > 0 ? (
            <MovieGrid movies={collection.movies} isLoading={false} />
          ) : (
            <div className="text-center py-16">
              <Folder className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground text-lg">
                No movies in this collection yet
              </p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default Collection;
