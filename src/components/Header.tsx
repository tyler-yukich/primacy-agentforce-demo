import { Button } from "@/components/ui/button";
import { Menu } from "lucide-react";
import primacyLogo from "@/assets/primacy_horizontal.svg";
const Header = () => {
  return <header className="bg-primary text-primary-foreground">
      {/* Top Navigation Bar */}
      <div className="container mx-auto px-6 py-3">
        <div className="flex items-center justify-between">
          <img src={primacyLogo} alt="Primacy" className="h-6 md:h-8" />
          <div className="flex items-center gap-4">
            <Button variant="secondary" size="lg" className="bg-lime-400 text-black hover:bg-lime-300 rounded-full px-8 py-3 text-base font-medium shadow-lg">
              Contact Us
            </Button>
            <Menu className="h-11 w-11 text-primary-foreground" />
          </div>
        </div>
      </div>
      
      {/* Hero Section */}
      <div className="container mx-auto px-6 py-16 md:py-24 lg:py-32">
        <div className="text-center">
          <h1 className="text-xl md:text-2xl font-semibold lg:text-4xl">PRIMACY_agent</h1>
        </div>
      </div>
    </header>;
};
export default Header;