import Header from "@/components/Header";
import Hero from "@/components/Hero";
import Dashboard from "@/components/Dashboard";
import ReportForm from "@/components/ReportForm";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main>
        <Hero />
        <Dashboard />
        <ReportForm />
      </main>
      
      <footer className="bg-primary text-primary-foreground py-12">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <h3 className="font-bold mb-4">BlueChain MRV</h3>
              <p className="text-sm text-primary-foreground/80">
                Protecting blue carbon ecosystems through blockchain-verified monitoring and reporting.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-3">Platform</h4>
              <ul className="space-y-2 text-sm text-primary-foreground/80">
                <li><a href="#" className="hover:text-accent transition-colors">Dashboard</a></li>
                <li><a href="#" className="hover:text-accent transition-colors">Submit Reports</a></li>
                <li><a href="#" className="hover:text-accent transition-colors">Carbon Credits</a></li>
                <li><a href="#" className="hover:text-accent transition-colors">Community</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-3">Resources</h4>
              <ul className="space-y-2 text-sm text-primary-foreground/80">
                <li><a href="#" className="hover:text-accent transition-colors">API Documentation</a></li>
                <li><a href="#" className="hover:text-accent transition-colors">Research Papers</a></li>
                <li><a href="#" className="hover:text-accent transition-colors">Methodology</a></li>
                <li><a href="#" className="hover:text-accent transition-colors">Support</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-3">Connect</h4>
              <ul className="space-y-2 text-sm text-primary-foreground/80">
                <li><a href="#" className="hover:text-accent transition-colors">Twitter</a></li>
                <li><a href="#" className="hover:text-accent transition-colors">Discord</a></li>
                <li><a href="#" className="hover:text-accent transition-colors">GitHub</a></li>
                <li><a href="#" className="hover:text-accent transition-colors">Newsletter</a></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-primary-foreground/20 mt-8 pt-8 text-center text-sm text-primary-foreground/60">
            <p>&copy; 2024 BlueChain MRV. All rights reserved. Built for ocean conservation.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
