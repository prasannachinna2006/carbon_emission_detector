import { Button } from "@/components/ui/button";
import { MapPin, User, BarChart3 } from "lucide-react";

const Header = () => {
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
          <Button variant="ghost" size="icon">
            <User className="h-5 w-5" />
          </Button>
          <Button variant="hero" size="sm">Connect Wallet</Button>
        </div>
      </div>
    </header>
  );
};

export default Header;