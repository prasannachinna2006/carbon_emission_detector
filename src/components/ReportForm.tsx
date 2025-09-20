import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { MapPin, Camera, Calculator, Upload } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const ReportForm = () => {
  const { toast } = useToast();
  const [ecosystemType, setEcosystemType] = useState("");
  const [area, setArea] = useState("");
  const [carbonCalc, setCarbonCalc] = useState(0);

  const calculateCarbon = () => {
    if (!area || !ecosystemType) return;
    
    const areaValue = parseFloat(area);
    const carbonFractions = {
      mangrove: 0.47,
      seagrass: 0.43,
      saltmarsh: 0.45
    };
    
    // Simplified calculation: Area × Biomass density × Carbon fraction × CO2 conversion
    const avgBiomass = 150; // tons/hectare (simplified)
    const co2Conversion = 3.67;
    const carbonFraction = carbonFractions[ecosystemType as keyof typeof carbonFractions] || 0.45;
    
    const sequestration = areaValue * avgBiomass * carbonFraction * co2Conversion;
    setCarbonCalc(Math.round(sequestration * 100) / 100);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    toast({
      title: "Report Submitted Successfully!",
      description: "Your blue carbon monitoring report is being processed for verification.",
    });
  };

  return (
    <section className="py-16">
      <div className="container mx-auto px-4 max-w-4xl">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold mb-2">Submit Blue Carbon Report</h2>
          <p className="text-muted-foreground">Document blue carbon ecosystems and earn verified carbon credits</p>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-5 w-5 text-primary" />
                  Location Data
                </CardTitle>
                <CardDescription>GPS coordinates and site information</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="latitude">Latitude</Label>
                    <Input 
                      id="latitude" 
                      placeholder="e.g., 12.9716"
                      className="font-mono"
                    />
                  </div>
                  <div>
                    <Label htmlFor="longitude">Longitude</Label>
                    <Input 
                      id="longitude" 
                      placeholder="e.g., 77.5946"
                      className="font-mono"
                    />
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="ecosystem">Ecosystem Type</Label>
                  <Select value={ecosystemType} onValueChange={(value) => {
                    setEcosystemType(value);
                    setTimeout(calculateCarbon, 100);
                  }}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select ecosystem type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="mangrove">Mangrove Forest</SelectItem>
                      <SelectItem value="seagrass">Seagrass Meadow</SelectItem>
                      <SelectItem value="saltmarsh">Salt Marsh</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="area">Area (hectares)</Label>
                  <Input 
                    id="area" 
                    type="number"
                    step="0.1"
                    placeholder="e.g., 1.5"
                    value={area}
                    onChange={(e) => {
                      setArea(e.target.value);
                      setTimeout(calculateCarbon, 100);
                    }}
                  />
                </div>
                
                <div className="p-3 bg-muted rounded-lg">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                    <MapPin className="h-4 w-4" />
                    Simulated GPS Status
                  </div>
                  <Badge variant="outline" className="text-success border-success">
                    GPS Locked • Accuracy: 3m
                  </Badge>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Camera className="h-5 w-5 text-primary" />
                  Photo Documentation
                </CardTitle>
                <CardDescription>Upload geotagged photos for verification</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="border-2 border-dashed border-muted rounded-lg p-6 text-center">
                  <Upload className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground mb-2">
                    Drag & drop photos or click to browse
                  </p>
                  <Button variant="outline" size="sm">Select Files</Button>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="description">Site Description</Label>
                  <Textarea 
                    id="description"
                    placeholder="Describe the ecosystem condition, vegetation density, any notable features..."
                    rows={4}
                  />
                </div>
                
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-center gap-2 text-sm text-blue-700 mb-1">
                    <Camera className="h-4 w-4" />
                    AI Verification Status
                  </div>
                  <p className="text-xs text-blue-600">
                    Photos will be automatically verified for authenticity and GPS matching
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
          
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calculator className="h-5 w-5 text-success" />
                Carbon Sequestration Calculation
              </CardTitle>
              <CardDescription>Estimated CO₂ sequestration based on your data</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="bg-gradient-wave text-white p-6 rounded-lg">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
                  <div>
                    <div className="text-2xl font-bold">{carbonCalc}</div>
                    <div className="text-sm text-white/80">tons CO₂/year</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold">{Math.round(carbonCalc * 0.8)}</div>
                    <div className="text-sm text-white/80">Potential Credits</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold">${Math.round(carbonCalc * 15)}</div>
                    <div className="text-sm text-white/80">Estimated Value</div>
                  </div>
                </div>
                
                <div className="mt-4 pt-4 border-t border-white/20">
                  <p className="text-xs text-white/80">
                    Calculation: Area × Biomass Density × Carbon Fraction ({ecosystemType === 'mangrove' ? '0.47' : ecosystemType === 'seagrass' ? '0.43' : '0.45'}) × CO₂ Conversion (3.67)
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <div className="flex gap-4 justify-center">
            <Button type="submit" variant="hero" size="lg">
              Submit for Verification
            </Button>
            <Button type="button" variant="outline" size="lg">
              Save as Draft
            </Button>
          </div>
        </form>
      </div>
    </section>
  );
};

export default ReportForm;