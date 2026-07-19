import { useState, useEffect } from "react";
import Header from "@/components/Header";
import Hero from "@/components/Hero";
import Dashboard from "@/components/Dashboard";
import ReportForm from "@/components/ReportForm";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { calculateCarbonMetrics, EcosystemType } from "@/lib/calculations";
import { uploadMonitoringImage } from "@/lib/storage";

// Static baseline mock reports for demo/seed data
const MOCK_REPORTS = [
  {
    id: "mock-1",
    created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days ago
    latitude: -8.4095,
    longitude: 115.1889,
    ecosystem_type: "mangrove" as const,
    area_hectares: 0.8,
    status: "verified" as const,
    notes: "Healthy mangrove forest sector with high canopy density.",
    estimated_co2e_tons: 206.99,
    potential_credits: 165.59,
    estimated_value_usd: 3104.85,
  },
  {
    id: "mock-2",
    created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(), // 5 days ago
    latitude: -8.4125,
    longitude: 115.1925,
    ecosystem_type: "seagrass" as const,
    area_hectares: 1.2,
    status: "pending" as const,
    notes: "Seagrass meadow in shallow coastal zone.",
    estimated_co2e_tons: 47.34,
    potential_credits: 37.87,
    estimated_value_usd: 710.1,
  },
  {
    id: "mock-3",
    created_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(), // 1 week ago
    latitude: -8.4150,
    longitude: 115.1850,
    ecosystem_type: "salt_marsh" as const,
    area_hectares: 0.5,
    status: "verified" as const,
    notes: "Salt marsh wetland along coastal estuary.",
    estimated_co2e_tons: 33.03,
    potential_credits: 26.42,
    estimated_value_usd: 495.45,
  }
];

const Index = () => {
  const { user } = useAuth();
  const [userReports, setUserReports] = useState<any[]>([]);

  // 1. Load user reports from localStorage on mount
  useEffect(() => {
    const local = localStorage.getItem("bluechain_reports");
    if (local) {
      try {
        setUserReports(JSON.parse(local));
      } catch (e) {
        console.error("Failed to parse local reports:", e);
      }
    }
  }, []);

  // 2. Fetch authenticated user's reports from Supabase and merge
  useEffect(() => {
    if (!user) return;
    
    const fetchSupabaseReports = async () => {
      const { data, error } = await supabase
        .from("monitoring_reports")
        .select("*")
        .order("created_at", { ascending: false });
        
      if (error) {
        console.error("Error fetching Supabase reports:", error);
        return;
      }
      
      if (data) {
        const mapped = data.map((mr) => {
          const area = mr.area_hectares || 0;
          const ecoType = mr.ecosystem_type as EcosystemType;
          const metrics = ecoType 
            ? calculateCarbonMetrics(ecoType, area) 
            : { estimatedCo2eTons: 0, potentialCredits: 0, estimatedValueUsd: 0 };
            
          return {
            id: mr.id,
            created_at: mr.created_at,
            latitude: mr.latitude || 0,
            longitude: mr.longitude || 0,
            ecosystem_type: ecoType,
            area_hectares: area,
            status: mr.status === 'submitted' ? 'pending' : mr.status,
            notes: mr.notes || "",
            estimated_co2e_tons: metrics.estimatedCo2eTons,
            potential_credits: metrics.potentialCredits,
            estimated_value_usd: metrics.estimatedValueUsd,
            is_from_supabase: true,
          };
        });
        
        // Merge and update state + storage (avoid duplicates by checking ID)
        setUserReports((prevLocal) => {
          const merged = [...prevLocal];
          mapped.forEach((dbReport) => {
            const exists = merged.some((r) => r.id === dbReport.id);
            if (!exists) {
              merged.push(dbReport);
            }
          });
          localStorage.setItem("bluechain_reports", JSON.stringify(merged));
          return merged;
        });
      }
    };
    
    fetchSupabaseReports();
  }, [user]);

  // 3. Submit handler
  const handleNewReportSubmit = async (reportData: {
    latitude: number;
    longitude: number;
    ecosystemType: EcosystemType;
    area: number;
    description: string;
    files: File[];
  }) => {
    const metrics = calculateCarbonMetrics(reportData.ecosystemType, reportData.area);
    let newReportId = crypto.randomUUID();
    let isDbSaved = false;

    if (user) {
      const { data, error } = await supabase
        .from("monitoring_reports")
        .insert({
          id: newReportId,
          user_id: user.id,
          status: "submitted",
          latitude: reportData.latitude,
          longitude: reportData.longitude,
          ecosystem_type: reportData.ecosystemType,
          area_hectares: reportData.area,
          notes: reportData.description,
          location_source: "gps_auto",
          gps_accuracy_m: 3.0,
        })
        .select()
        .single();

      if (error) {
        console.error("Supabase report insert error:", error);
        throw new Error(`Failed to save report to database: ${error.message}`);
      }
      
      if (data) {
        newReportId = data.id;
        isDbSaved = true;

        // Upload images if any
        if (reportData.files.length > 0) {
          for (const file of reportData.files) {
            const uploadRes = await uploadMonitoringImage(file, user.id, newReportId);
            if (uploadRes.success && uploadRes.storagePath) {
              const { error: imgError } = await supabase
                .from("report_images")
                .insert({
                  report_id: newReportId,
                  user_id: user.id,
                  storage_path: uploadRes.storagePath,
                  file_name: file.name,
                  file_size_bytes: file.size,
                  mime_type: file.type,
                });
                
              if (imgError) {
                console.error("Failed to insert image record:", imgError.message);
              }
            } else {
              console.error("Failed to upload image file:", uploadRes.error);
            }
          }
        }
      }
    }

    const newReport = {
      id: newReportId,
      created_at: new Date().toISOString(),
      latitude: reportData.latitude,
      longitude: reportData.longitude,
      ecosystem_type: reportData.ecosystemType,
      area_hectares: reportData.area,
      status: "pending" as const,
      notes: reportData.description,
      estimated_co2e_tons: metrics.estimatedCo2eTons,
      potential_credits: metrics.potentialCredits,
      estimated_value_usd: metrics.estimatedValueUsd,
      is_from_supabase: isDbSaved,
    };

    setUserReports((prev) => {
      const updated = [newReport, ...prev];
      localStorage.setItem("bluechain_reports", JSON.stringify(updated));
      return updated;
    });
  };

  // Combine mock data and user reports
  const allReports = [...userReports, ...MOCK_REPORTS];

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main>
        <Hero />
        <Dashboard reports={allReports} />
        <ReportForm onSubmitReport={handleNewReportSubmit} />
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
