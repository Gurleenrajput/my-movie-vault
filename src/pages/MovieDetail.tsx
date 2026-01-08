import { useParams, Link } from "react-router-dom";
import { ArrowLeft, Star, Clock, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Header } from "@/components/Header";
import { useMovie } from "@/hooks/useMovies";

const MovieDetail = () => {
  const { id } = useParams<{ id: string }>();
  const { data: movie, isLoading } = useMovie(id || "");

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="pt-24 px-4 container mx-auto">
          <div className="animate-pulse">
            <div className="h-[60vh] bg-muted rounded-xl mb-8" />
            <div className="h-8 bg-muted rounded w-1/3 mb-4" />
            <div className="h-4 bg-muted rounded w-2/3" />
          </div>
        </div>
      </div>
    );
  }

  if (!movie) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="pt-24 px-4 container mx-auto text-center">
          <h1 className="text-3xl font-display mb-4">Movie not found</h1>
          <Button asChild>
            <Link to="/">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Home
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  const backdropUrl = movie.backdrop_path 
    ? `https://image.tmdb.org/t/p/original${movie.backdrop_path}`
    : null;
  const posterUrl = movie.poster_path 
    ? `https://image.tmdb.org/t/p/w500${movie.poster_path}`
    : '/placeholder.svg';
  const year = movie.release_date ? new Date(movie.release_date).getFullYear() : null;

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      {/* Backdrop */}
      <div className="relative h-[50vh] md:h-[60vh]">
        {backdropUrl ? (
          <img 
            src={backdropUrl} 
            alt={movie.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-muted" />
        )}
        <div className="absolute inset-0 hero-gradient" />
        <div className="absolute inset-0 cinematic-overlay" />
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 -mt-32 relative z-10">
        <Button 
          variant="ghost" 
          size="sm" 
          asChild
          className="mb-6"
        >
          <Link to="/">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Link>
        </Button>

        <div className="flex flex-col md:flex-row gap-8">
          {/* Poster */}
          <div className="flex-shrink-0">
            <img 
              src={posterUrl}
              alt={movie.title}
              className="w-48 md:w-64 rounded-xl shadow-2xl mx-auto md:mx-0"
            />
          </div>

          {/* Details */}
          <div className="flex-1 min-w-0">
            <h1 className="font-display text-4xl md:text-6xl text-foreground mb-4">
              {movie.title}
            </h1>

            {/* Meta Info */}
            <div className="flex flex-wrap items-center gap-4 mb-6 text-muted-foreground">
              {movie.vote_average !== null && (
                <div className="rating-badge">
                  <Star className="w-4 h-4" fill="currentColor" />
                  <span>{movie.vote_average.toFixed(1)}</span>
                </div>
              )}
              {year && (
                <div className="flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  <span>{year}</span>
                </div>
              )}
              {movie.runtime && (
                <div className="flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  <span>{movie.runtime} min</span>
                </div>
              )}
            </div>

            {/* Genres */}
            {movie.genres && movie.genres.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-6">
                {movie.genres.map((genre) => (
                  <Badge key={genre} variant="secondary">
                    {genre}
                  </Badge>
                ))}
              </div>
            )}

            {/* Overview */}
            {movie.overview && (
              <div className="mb-8">
                <h2 className="font-display text-xl text-foreground mb-3">Overview</h2>
                <p className="text-muted-foreground leading-relaxed max-w-3xl">
                  {movie.overview}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Spacer */}
      <div className="h-24" />
    </div>
  );
};

export default MovieDetail;
