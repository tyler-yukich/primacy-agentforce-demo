import { Button } from "@/components/ui/button";
import primacyLogo from "@/assets/primacy_horizontal.svg";

const Footer = () => {
  return (
    <>
      <footer className="bg-primary py-10 md:py-12 lg:py-16 px-6 md:px-12 lg:px-16 xl:px-20 2xl:px-24 mt-auto text-white">
        <div>
          {/* Main footer content */}
          <div className="relative grid grid-cols-1 md:grid-cols-2 gap-12 md:gap-0">
            {/* Vertical divider line - only visible on md+ screens */}
            <div className="hidden md:block absolute top-0 bottom-0 left-1/2 w-[1.5px] bg-white -translate-x-1/2"></div>
            
            {/* Left section - Logo, tagline, and CTA */}
            <div className="pr-0 md:pr-12 lg:pr-16 xl:pr-20">
              <img src={primacyLogo} alt="Primacy" className="h-11 mb-8" />
              <p className="text-2xl font-medium mb-8 max-w-md">
                Looking for a results-driven partner?
              </p>
              <Button 
                size="lg" 
                className="bg-black hover:bg-gray-800 text-white rounded-full px-8 py-4 text-base font-medium"
              >
                Let's Talk
              </Button>
            </div>
            
            {/* Right section - Links */}
            <div className="pl-0 md:pl-12 lg:pl-16 xl:pl-20">
              <div className="grid grid-cols-2 gap-8">
                <div>
                  <h3 className="text-lg font-semibold mb-4 text-white">INFO</h3>
                  <ul className="space-y-3">
                    {['About', 'Work', 'Industries', 'Services', 'Careers', 'Ideas + Insights', 'News'].map((item) => (
                      <li key={item}>
                        <a href="#" className="text-white hover:text-gray-200 transition-colors text-sm">
                          {item}
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
                
                <div>
                  <h3 className="text-lg font-semibold mb-4 text-white">LOCATIONS</h3>
                  <ul className="space-y-3">
                    {['Connecticut', 'Florida', 'Massachusetts'].map((location) => (
                      <li key={location} className="text-white text-sm">
                        {location}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </footer>
      
      {/* Agency Logos Section - Separate white section */}
      <div className="bg-white py-6 px-6 md:px-12 lg:px-16 xl:px-20 2xl:px-24">
        <div>
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            {/* Logo Placeholders */}
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-gray-800 flex items-center justify-center text-white font-bold text-sm">
                DU
              </div>
              <div className="w-16 h-16 bg-primary flex items-center justify-center text-white font-bold text-sm">
                P
              </div>
              <div className="w-16 h-16 bg-purple-600 flex items-center justify-center text-white font-bold text-sm">
                M.
              </div>
              <div className="w-16 h-16 bg-cyan-500 flex items-center justify-center text-white font-bold text-sm">
                /Z
              </div>
            </div>
            
            {/* Copyright Text */}
            <p className="text-sm text-gray-600">
              © 2025 Digital United LLC All Rights Reserved. Privacy Policy
            </p>
          </div>
        </div>
      </div>
    </>
  );
};

export default Footer;