const Footer = () => {
  return (
    <footer className="bg-muted py-12 px-6 mt-auto">
      <div className="container mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <h3 className="text-lg font-semibold mb-4 text-foreground">INFO</h3>
            <ul className="space-y-2">
              {['About', 'Work', 'Services', 'Careers', 'Contact'].map((item) => (
                <li key={item}>
                  <a href="#" className="text-muted-foreground hover:text-primary transition-colors">
                    {item}
                  </a>
                </li>
              ))}
            </ul>
          </div>
          
          <div>
            <h3 className="text-lg font-semibold mb-4 text-foreground">LOCATIONS</h3>
            <ul className="space-y-2">
              {['Connecticut', 'Florida', 'Massachusetts'].map((location) => (
                <li key={location} className="text-muted-foreground">
                  {location}
                </li>
              ))}
            </ul>
          </div>
          
          <div>
            <div className="text-2xl font-bold text-primary mb-4">PRIMACY_</div>
            <p className="text-sm text-muted-foreground">
              © 2024 Primacy. All rights reserved.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;