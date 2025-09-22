import { Button } from "@/components/ui/button";
import primacyLogo from "@/assets/primacy_horizontal.svg";

const Footer = () => {
  return (
    <footer className="bg-green-600 py-16 px-6 mt-auto text-white">
      <div className="container mx-auto">
        {/* Main footer content */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 mb-12">
          {/* Left section - Logo, tagline, and CTA */}
          <div className="lg:col-span-7">
            <img src={primacyLogo} alt="Primacy" className="h-12 mb-6" />
            <p className="text-xl mb-8 max-w-md">
              We're a full-service digital agency focused on strategy, design, and development.
            </p>
            <Button 
              size="lg" 
              className="bg-black hover:bg-gray-800 text-white rounded-full px-8 py-3 text-base font-medium"
            >
              Let's Talk
            </Button>
          </div>
          
          {/* Right section - Links */}
          <div className="lg:col-span-5">
            <div className="grid grid-cols-2 gap-8">
              <div>
                <h3 className="text-lg font-semibold mb-6 text-white">INFO</h3>
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
                <h3 className="text-lg font-semibold mb-6 text-white">LOCATIONS</h3>
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
        
        {/* Bottom section - Certifications and Copyright */}
        <div className="border-t border-green-500 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2 text-xs">
                <span className="bg-white text-green-600 px-2 py-1 rounded text-xs font-semibold">B CORP</span>
                <span className="text-white">CERTIFIED</span>
              </div>
              <div className="text-xs text-white">
                GOOGLE PARTNER
              </div>
            </div>
            <p className="text-xs text-white">
              © 2024 Primacy. All rights reserved.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;