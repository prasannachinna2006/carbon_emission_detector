import { useState, useRef } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { MapPin, Camera, Calculator, Upload, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { calculateCarbonMetrics, EcosystemType, ECOSYSTEM_PARAMS } from "@/lib/calculations";
import { verifyEcosystemImage, VerificationResult } from "@/lib/imageVerifier";

interface ReportFormProps {
  onSubmitReport: (report: {
    latitude: number;
    longitude: number;
    ecosystemType: EcosystemType;
    area: number;
    description: string;
    files: File[];
  }) => Promise<void> | void;
}

const ReportForm = ({ onSubmitReport }: ReportFormProps) => {
  const { toast } = useToast();
  const [ecosystemType, setEcosystemType] = useState<string>("");
  const [area, setArea] = useState<string>("");
  const [latitude, setLatitude] = useState<string>("");
  const [longitude, setLongitude] = useState<string>("");
  const [description, setDescription] = useState<string>("");
  const [files, setFiles] = useState<File[]>([]);
  
  // AI Image verification states
  const [verificationStatus, setVerificationStatus] = useState<'idle' | 'verifying' | 'verified' | 'failed'>('idle');
  const [verificationResult, setVerificationResult] = useState<VerificationResult | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Derive metrics instantly from inputs
  const areaValue = parseFloat(area) || 0;
  
  // Only calculate carbon if verification passes successfully
  const showCalculation = ecosystemType && areaValue > 0 && verificationStatus === 'verified';
  
  const metrics = showCalculation
    ? calculateCarbonMetrics(ecosystemType as EcosystemType, areaValue)
    : { estimatedCo2eTons: 0, potentialCredits: 0, estimatedValueUsd: 0 };

  const handleVerification = async (selectedFiles: File[]) => {
    if (selectedFiles.length === 0) return;
    
    setVerificationStatus('verifying');
    setVerificationResult(null);
    
    try {
      // Analyze the first uploaded file
      const result = await verifyEcosystemImage(selectedFiles[0]);
      setVerificationResult(result);
      
      if (result.isValid) {
        setVerificationStatus('verified');
        toast({
          title: "AI Verification Passed!",
          description: result.reason,
        });
      } else {
        setVerificationStatus('failed');
        toast({
          title: "AI Verification Failed",
          description: result.reason,
          variant: "destructive",
        });
      }
    } catch (err: any) {
      setVerificationStatus('failed');
      setVerificationResult({
        isValid: false,
        detectedSubject: "Error",
        confidence: 0,
        reason: err.message || "Failed to process image.",
      });
    }
  };

  const handleFilesSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(e.target.files ?? []);
    if (selected.length === 0) return;
    
    const newFiles = [...files, ...selected];
    setFiles(newFiles);
    e.target.value = "";
    
    handleVerification(newFiles);
  };

  const removeFile = (index: number) => {
    const newFiles = files.filter((_, i) => i !== index);
    setFiles(newFiles);
    
    if (newFiles.length === 0) {
      setVerificationStatus('idle');
      setVerificationResult(null);
    } else if (index === 0) {
      // Re-verify the new primary image
      handleVerification(newFiles);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!latitude || !longitude) {
      toast({
        title: "Missing Location Data",
        description: "Please enter both latitude and longitude coordinates.",
        variant: "destructive",
      });
      return;
    }

    if (!ecosystemType) {
      toast({
        title: "Missing Ecosystem Type",
        description: "Please select an ecosystem type.",
        variant: "destructive",
      });
      return;
    }

    if (!area || areaValue <= 0) {
      toast({
        title: "Invalid Area",
        description: "Please enter a valid positive area in hectares.",
        variant: "destructive",
      });
      return;
    }

    if (files.length === 0) {
      toast({
        title: "Photo Verification Required",
        description: "Please upload an ecosystem photo for AI verification.",
        variant: "destructive",
      });
      return;
    }

    if (verificationStatus === 'verifying') {
      toast({
        title: "Verification in Progress",
        description: "Please wait for the AI to finish analyzing the uploaded photo.",
        variant: "destructive",
      });
      return;
    }

    if (verificationStatus === 'failed') {
      toast({
        title: "Verification Failed",
        description: verificationResult?.reason || "Please upload a valid tree or coastal vegetation photo.",
        variant: "destructive",
      });
      return;
    }

    try {
      await onSubmitReport({
        latitude: parseFloat(latitude),
        longitude: parseFloat(longitude),
        ecosystemType: ecosystemType as EcosystemType,
        area: areaValue,
        description,
        files,
      });

      toast({
        title: "Report Submitted Successfully!",
        description: "Your blue carbon monitoring report is being processed for verification.",
      });

      // Clear the form fields after successful submission
      setLatitude("");
      setLongitude("");
      setEcosystemType("");
      setArea("");
      setDescription("");
      setFiles([]);
      setVerificationStatus('idle');
      setVerificationResult(null);
    } catch (err: any) {
      toast({
        title: "Submission failed",
        description: err.message || "An error occurred during submission.",
        variant: "destructive",
      });
    }
  };

  const activeParams = ecosystemType ? ECOSYSTEM_PARAMS[ecosystemType as EcosystemType] : null;
  const carbonFractionText = activeParams ? activeParams.carbonFraction.toString() : "0.43 - 0.47";
  const biomassDensityText = activeParams ? `${activeParams.biomassDensity} t/ha` : "25 - 150 t/ha";

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
                      value={latitude}
                      onChange={(e) => setLatitude(e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="longitude">Longitude</Label>
                    <Input 
                      id="longitude" 
                      placeholder="e.g., 77.5946"
                      className="font-mono"
                      value={longitude}
                      onChange={(e) => setLongitude(e.target.value)}
                    />
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="ecosystem">Ecosystem Type</Label>
                  <Select value={ecosystemType} onValueChange={setEcosystemType}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select ecosystem type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="mangrove">Mangrove Forest</SelectItem>
                      <SelectItem value="seagrass">Seagrass Meadow</SelectItem>
                      <SelectItem value="salt_marsh">Salt Marsh</SelectItem>
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
                    onChange={(e) => setArea(e.target.value)}
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
                <div
                  className="border-2 border-dashed border-muted rounded-lg p-6 text-center cursor-pointer hover:border-primary transition-colors"
                  onClick={() => fileInputRef.current?.click()}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => {
                    e.preventDefault();
                    const dropped = Array.from(e.dataTransfer.files).filter((f) =>
                      f.type.startsWith("image/")
                    );
                    if (dropped.length) {
                      const newFiles = [...files, ...dropped];
                      setFiles(newFiles);
                      handleVerification(newFiles);
                    }
                  }}
                >
                  <Upload className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground mb-2">
                    Drag & drop photos or click to browse
                  </p>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      fileInputRef.current?.click();
                    }}
                  >
                    Select Files
                  </Button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    multiple
                    capture="environment"
                    className="hidden"
                    onChange={handleFilesSelected}
                  />
                </div>

                {files.length > 0 && (
                  <div className="grid grid-cols-3 gap-2">
                    {files.map((file, i) => (
                      <div key={i} className="relative group animate-fade-in">
                        <img
                          src={URL.createObjectURL(file)}
                          alt={file.name}
                          className="w-full h-20 object-cover rounded border"
                        />
                        <button
                          type="button"
                          onClick={() => removeFile(i)}
                          className="absolute top-1 right-1 bg-black/60 text-white text-xs rounded px-1.5 py-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                
                <div className="space-y-2">
                  <Label htmlFor="description">Site Description</Label>
                  <Textarea 
                    id="description"
                    placeholder="Describe the ecosystem condition, vegetation density, any notable features..."
                    rows={4}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                  />
                </div>
                
                <div className={`p-4 border rounded-lg transition-all duration-300 ${
                  verificationStatus === 'verifying' ? 'bg-amber-50 border-amber-200 text-amber-800' :
                  verificationStatus === 'verified' ? 'bg-emerald-50 border-emerald-200 text-emerald-800' :
                  verificationStatus === 'failed' ? 'bg-rose-50 border-rose-200 text-rose-800' :
                  'bg-blue-50 border-blue-200 text-blue-800'
                }`}>
                  <div className="flex items-center gap-2 text-sm font-semibold mb-1">
                    {verificationStatus === 'verifying' ? (
                      <Loader2 className="h-4 w-4 animate-spin text-amber-600" />
                    ) : (
                      <Camera className="h-4 w-4" />
                    )}
                    {verificationStatus === 'verifying' && 'AI Verification: Running Classification...'}
                    {verificationStatus === 'verified' && `AI Verification Passed (${verificationResult?.confidence}% confidence)`}
                    {verificationStatus === 'failed' && `AI Verification Failed (${verificationResult?.confidence}% confidence)`}
                    {verificationStatus === 'idle' && 'AI Verification Status'}
                  </div>
                  <p className="text-xs opacity-90 leading-relaxed">
                    {verificationStatus === 'verifying' && 'Initiating TensorFlow.js classification. Checking structure for coastal vegetation/nature elements...'}
                    {verificationStatus === 'verified' && (verificationResult?.reason || 'Valid blue carbon ecosystem photo detected.')}
                    {verificationStatus === 'failed' && (verificationResult?.reason || 'Invalid photo. Nature structure check failed.')}
                    {verificationStatus === 'idle' && 'Upload a photo of the ecosystem. The AI model will verify its subject before calculating carbon.'}
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
              {verificationStatus === 'verified' ? (
                <div className="bg-gradient-wave text-white p-6 rounded-lg transition-all duration-300">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
                    <div>
                      <div className="text-2xl font-bold">{metrics.estimatedCo2eTons}</div>
                      <div className="text-sm text-white/80">tons CO₂/year</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold">{metrics.potentialCredits}</div>
                      <div className="text-sm text-white/80">Potential Credits</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold">${metrics.estimatedValueUsd}</div>
                      <div className="text-sm text-white/80">Estimated Value</div>
                    </div>
                  </div>
                  
                  <div className="mt-4 pt-4 border-t border-white/20">
                    <p className="text-xs text-white/80">
                      Calculation: Area × Biomass Density ({biomassDensityText}) × Carbon Fraction ({carbonFractionText}) × CO₂ Conversion (3.67)
                    </p>
                  </div>
                </div>
              ) : verificationStatus === 'failed' ? (
                <div className="bg-rose-50 border border-rose-200 text-rose-800 p-8 rounded-lg text-center">
                  <Calculator className="h-10 w-10 mx-auto mb-3 text-rose-500 opacity-80" />
                  <p className="font-bold text-sm mb-1">Calculation Locked (Verification Failed)</p>
                  <p className="text-xs opacity-90">
                    {verificationResult?.reason || 'The uploaded image is not a valid coastal ecosystem. Please upload a real tree/vegetation photo.'}
                  </p>
                </div>
              ) : (
                <div className="bg-muted text-muted-foreground p-8 rounded-lg text-center border-2 border-dashed border-muted-foreground/20">
                  <Calculator className="h-10 w-10 mx-auto mb-3 opacity-40 text-primary" />
                  <p className="font-semibold text-sm mb-1">Calculation Locked (Awaiting AI Verification)</p>
                  <p className="text-xs opacity-80">
                    Please upload a valid ecosystem photo (trees, forest, or plants) to unlock and display the carbon sequestration calculation.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
          
          <div className="flex gap-4 justify-center">
            <Button 
              type="submit" 
              variant="hero" 
              size="lg" 
              disabled={verificationStatus !== 'verified'}
            >
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