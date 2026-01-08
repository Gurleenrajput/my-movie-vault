import { MovieCard } from "./MovieCard";

interface Movie {
  id: string;
  title: string;
  poster_path: string | null;
  release_date: string | null;
  vote_average: number | null;
}

interface MovieGridProps {
  movies: Movie[];
  isLoading?: boolean;
}

export function MovieGrid({ movies, isLoading }: MovieGridProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
        {Array.from({ length: 12 }).map((_, i) => (
          <div key={i} className="aspect-[2/3] rounded-lg bg-muted animate-pulse" />
        ))}
      </div>
    );
  }

  if (movies.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="text-6xl mb-4">🎬</div>
        <h3 className="text-xl font-semibold text-foreground mb-2">No movies yet</h3>
        <p className="text-muted-foreground">Start adding movies to your collection!</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
      {movies.map((movie, index) => (
        <div 
          key={movie.id} 
          className="animate-fade-in"
          style={{ animationDelay: `${index * 50}ms` }}
        >
          <MovieCard
            id={movie.id}
            title={movie.title}
            posterPath={movie.poster_path}
            releaseDate={movie.release_date}
            voteAverage={movie.vote_average}
          />
        </div>
      ))}
    </div>
  );
}
