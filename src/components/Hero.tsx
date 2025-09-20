import { Button } from "@/components/ui/button";
import { ArrowRight, MapPin, Camera, TrendingUp } from "lucide-react";
import heroImage from "@/assets/hero-blue-carbon.jpg";

const Hero = () => {
  return (
    <section className="relative overflow-hidden">
      <div className="absolute inset-0">
        <img 
          src={heroImage} 
          alt="Blue carbon ecosystems - mangroves, seagrass, and salt marshes" 
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-primary/80 via-primary/40 to-transparent" />
      </div>
      
      <div className="relative container mx-auto px-4 py-24 md:py-32">
        <div className="max-w-2xl text-white">
          <h1 className="text-4xl md:text-6xl font-bold mb-6 leading-tight">
            Protecting Blue Carbon
            <span className="block text-accent">Ecosystems</span>
          </h1>
          
          <p className="text-lg md:text-xl mb-8 text-white/90 leading-relaxed">
            Monitor, report, and verify blue carbon sequestration in mangroves, seagrass beds, and salt marshes. 
            Earn blockchain-verified carbon credits while protecting our oceans.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 mb-12">
            <Button variant="hero" size="lg" className="group">
              Start Monitoring <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
            </Button>
            <Button variant="outline" size="lg" className="bg-white/10 border-white/30 text-white hover:bg-white/20">
              Learn More
            </Button>
          </div>
          
          <div className="grid grid-cols-3 gap-6 pt-8 border-t border-white/20">
            <div className="text-center">
              <MapPin className="h-8 w-8 text-accent mx-auto mb-2" />
              <div className="text-2xl font-bold">GPS</div>
              <div className="text-sm text-white/80">Location Tracking</div>
            </div>
            <div className="text-center">
              <Camera className="h-8 w-8 text-accent mx-auto mb-2" />
              <div className="text-2xl font-bold">AI</div>
              <div className="text-sm text-white/80">Photo Verification</div>
            </div>
            <div className="text-center">
              <TrendingUp className="h-8 w-8 text-accent mx-auto mb-2" />
              <div className="text-2xl font-bold">Credits</div>
              <div className="text-sm text-white/80">Carbon Rewards</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;