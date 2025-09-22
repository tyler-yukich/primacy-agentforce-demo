import { Button } from "@/components/ui/button";
import { Menu } from "lucide-react";
import primacyLogo from "@/assets/primacy_horizontal.svg";

const Header = () => {
  return (
    <header className="bg-primary text-primary-foreground">
      {/* Top Navigation Bar */}
      <div className="container mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          <img 
            src={primacyLogo} 
            alt="Primacy" 
            className="h-6 md:h-8"
          />
          <div className="flex items-center gap-4">
            <Button 
              variant="secondary"
              size="lg"
              className="bg-lime-400 text-black hover:bg-lime-300 rounded-full px-8 py-3 text-base font-medium shadow-lg"
            >
              Contact Us
            </Button>
            <Menu className="h-6 w-6 text-primary-foreground" />
          </div>
        </div>
      </div>
      
      {/* Hero Section */}
      <div className="container mx-auto px-6 py-16 md:py-24">
        <div className="text-center relative">
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-light mb-8">
            Want to Chat?
          </h1>
          
          {/* Vertical Green Lines */}
          <div className="absolute left-1/2 transform -translate-x-1/2 top-full mt-8">
            <div className="flex gap-2">
              <div className="w-0.5 h-16 bg-accent"></div>
              <div className="w-0.5 h-16 bg-accent"></div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;