import { Header } from "@/components/Header";
import { MovieGrid } from "@/components/MovieGrid";
import { useMovies } from "@/hooks/useMovies";

const Index = () => {
  const { data: movies, isLoading } = useMovies();

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="pt-24 pb-12 px-4">
        <div className="container mx-auto">
          {/* Hero Section */}
          <section className="mb-12 text-center">
            <h1 className="font-display text-5xl md:text-7xl text-foreground mb-4">
              My <span className="text-gradient">Movie</span> Collection
            </h1>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              A curated collection of films I've watched and enjoyed. 
              Click on any movie to see more details.
            </p>
          </section>

          {/* Movies Grid */}
          <section>
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-display text-2xl text-foreground">
                All Movies 
                {movies && movies.length > 0 && (
                  <span className="text-muted-foreground text-lg ml-2">
                    ({movies.length})
                  </span>
                )}
              </h2>
            </div>
            <MovieGrid movies={movies || []} isLoading={isLoading} />
          </section>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border py-8 text-center">
        <p className="text-muted-foreground text-sm">
          Made by Gurleen Rajput
        </p>
      </footer>
    </div>
  );
};

export default Index;
