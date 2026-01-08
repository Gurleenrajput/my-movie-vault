import { Link } from "react-router-dom";
import { Star } from "lucide-react";

interface MovieCardProps {
  id: string;
  title: string;
  posterPath: string | null;
  releaseDate: string | null;
  voteAverage: number | null;
}

export function MovieCard({ id, title, posterPath, releaseDate, voteAverage }: MovieCardProps) {
  const year = releaseDate ? new Date(releaseDate).getFullYear() : null;
  const posterUrl = posterPath 
    ? `https://image.tmdb.org/t/p/w500${posterPath}`
    : '/placeholder.svg';

  return (
    <Link 
      to={`/movie/${id}`}
      className="group block relative overflow-hidden rounded-lg bg-card card-hover-glow"
    >
      <div className="aspect-[2/3] relative">
        <img
          src={posterUrl}
          alt={title}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        
        {/* Rating Badge */}
        {voteAverage !== null && (
          <div className="absolute top-2 right-2 rating-badge">
            <Star className="w-3 h-3" fill="currentColor" />
            <span>{voteAverage.toFixed(1)}</span>
          </div>
        )}
      </div>

      {/* Info Overlay */}
      <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-background to-transparent">
        <h3 className="font-semibold text-foreground text-sm line-clamp-2 mb-1">
          {title}
        </h3>
        {year && (
          <p className="text-muted-foreground text-xs">{year}</p>
        )}
      </div>
    </Link>
  );
}
