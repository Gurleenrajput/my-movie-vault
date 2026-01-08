import { Link } from "react-router-dom";
import { Home, Film } from "lucide-react";
import { Button } from "@/components/ui/button";

const NotFound = () => {
  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center text-center p-4">
      <Film className="w-20 h-20 text-muted-foreground mb-6" />
      <h1 className="font-display text-6xl text-foreground mb-4">404</h1>
      <p className="text-muted-foreground text-lg mb-8 max-w-md">
        Oops! The page you're looking for doesn't exist. Maybe the movie got cut from the final release.
      </p>
      <Button asChild>
        <Link to="/">
          <Home className="w-4 h-4 mr-2" />
          Back to Home
        </Link>
      </Button>
    </div>
  );
};

export default NotFound;
