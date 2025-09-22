import { Button } from "@/components/ui/button";
import primacyLogo from "@/assets/primacy_horizontal.svg";

const Header = () => {
  return (
    <header className="bg-primary text-primary-foreground py-8 px-6">
      <div className="container mx-auto">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <img 
              src={primacyLogo} 
              alt="Primacy" 
              className="h-12 md:h-16 mb-2"
            />
            <p className="text-xl md:text-2xl opacity-90">Looking for a results-driven partner?</p>
          </div>
          <Button 
            variant="outline" 
            size="lg"
            className="bg-primary-dark border-primary-foreground text-primary-foreground hover:bg-primary-foreground hover:text-primary-dark transition-colors duration-200"
          >
            Let's Talk
          </Button>
        </div>
      </div>
    </header>
  );
};

export default Header;