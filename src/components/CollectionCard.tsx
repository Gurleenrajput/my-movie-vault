import { Link } from "react-router-dom";
import { Folder, Film } from "lucide-react";
import type { CollectionWithMovies } from "@/hooks/useCollections";

interface CollectionCardProps {
  collection: CollectionWithMovies;
}

export function CollectionCard({ collection }: CollectionCardProps) {
  // Get first 4 movie posters for the grid preview
  const previewMovies = collection.movies.slice(0, 4);

  return (
    <Link to={`/collection/${collection.id}`} className="group block">
      <div className="relative aspect-video rounded-xl overflow-hidden bg-card border border-border transition-all duration-300 group-hover:border-primary/50 group-hover:shadow-lg group-hover:shadow-primary/10">
        {previewMovies.length > 0 ? (
          <div className="grid grid-cols-2 h-full">
            {previewMovies.map((movie, index) => (
              <div
                key={movie.id}
                className={`relative overflow-hidden ${
                  previewMovies.length === 1 ? "col-span-2" : ""
                } ${previewMovies.length === 3 && index === 2 ? "col-span-2" : ""}`}
              >
                {movie.poster_path ? (
                  <img
                    src={`https://image.tmdb.org/t/p/w300${movie.poster_path}`}
                    alt={movie.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-muted flex items-center justify-center">
                    <Film className="w-8 h-8 text-muted-foreground" />
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-muted">
            <Folder className="w-12 h-12 text-muted-foreground" />
          </div>
        )}
        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
        {/* Content */}
        <div className="absolute bottom-0 left-0 right-0 p-4">
          <h3 className="font-display text-lg text-white mb-1 truncate">
            {collection.name}
          </h3>
          <p className="text-white/70 text-sm">
            {collection.movies.length} movie{collection.movies.length !== 1 ? "s" : ""}
          </p>
        </div>
      </div>
    </Link>
  );
}
