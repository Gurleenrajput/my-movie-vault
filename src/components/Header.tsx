import { Link, useLocation } from "react-router-dom";
import { Film, LogIn, LogOut, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useIsMobile } from "@/hooks/use-mobile";
import ContactForm from "@/components/ContactForm";

export function Header() {
  const { user, signOut } = useAuth();
  const location = useLocation();
  const isMobile = useIsMobile();

  return (
    <header className="fixed top-0 left-0 right-0 z-50 backdrop-blur-cinema bg-background/80 border-b border-border">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        {/* Logo - Left */}
        <Link to="/" className="flex items-center gap-2 group">
          <Film className="w-7 h-7 text-primary transition-transform group-hover:rotate-12" />
          <span className="font-display text-xl md:text-2xl tracking-wide text-foreground">
            MY<span className="text-primary">MOVIES</span>
          </span>
        </Link>

        {/* Navigation - Right */}
        <nav className="flex items-center gap-2 md:gap-4">
          {/* Primary CTA */}
          <ContactForm />
          
          {/* Admin Controls - Minimal */}
          {user ? (
            <div className="flex items-center gap-1">
              <Button 
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-muted-foreground hover:text-foreground"
                asChild
              >
                <Link to="/admin" title="Admin">
                  <Settings className="w-4 h-4" />
                </Link>
              </Button>
              <Button 
                variant="ghost" 
                size="icon"
                className="h-8 w-8 text-muted-foreground hover:text-foreground"
                onClick={signOut}
                title="Sign Out"
              >
                <LogOut className="w-4 h-4" />
              </Button>
            </div>
          ) : (
            <Button 
              variant="ghost" 
              size={isMobile ? "icon" : "sm"}
              className="text-muted-foreground hover:text-foreground h-8"
              asChild
            >
              <Link to="/login" title="Admin Login">
                <LogIn className="w-4 h-4" />
                {!isMobile && <span className="ml-1.5 text-xs">Admin</span>}
              </Link>
            </Button>
          )}
        </nav>
      </div>
    </header>
  );
}
