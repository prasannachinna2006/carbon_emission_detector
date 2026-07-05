import { Button } from "@/components/ui/button";
import { MapPin, User, BarChart3, LogOut } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

const Header = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [fullName, setFullName] = useState<string>("");

  useEffect(() => {
    if (!user) { setFullName(""); return; }
    supabase.from("profiles").select("full_name").eq("id", user.id).maybeSingle()
      .then(({ data }) => setFullName(data?.full_name ?? ""));
  }, [user]);

  return (
    <header className="border-b bg-background/80 backdrop-blur-sm sticky top-0 z-50">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-gradient-ocean rounded-lg flex items-center justify-center">
            <MapPin className="h-5 w-5 text-white" />
          </div>
          <h1 className="text-xl font-bold text-primary">BlueChain MRV</h1>
        </div>
        
        <nav className="hidden md:flex items-center space-x-6">
          <a href="#" className="text-foreground hover:text-primary transition-colors">Dashboard</a>
          <a href="#" className="text-foreground hover:text-primary transition-colors">Reports</a>
          <a href="#" className="text-foreground hover:text-primary transition-colors">Carbon Credits</a>
          <a href="#" className="text-foreground hover:text-primary transition-colors">Community</a>
        </nav>
        
        <div className="flex items-center space-x-3">
          <Button variant="ghost" size="icon">
            <BarChart3 className="h-5 w-5" />
          </Button>
          {user ? (
            <>
              <div className="hidden sm:flex items-center gap-2 text-sm">
                <User className="h-4 w-4 text-primary" />
                <span className="font-medium">{fullName || user.email}</span>
              </div>
              <Button variant="ghost" size="icon" onClick={signOut} aria-label="Sign out">
                <LogOut className="h-5 w-5" />
              </Button>
            </>
          ) : (
            <Button variant="hero" size="sm" onClick={() => navigate("/auth")}>Sign in</Button>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;