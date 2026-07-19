import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, MapPin, Leaf, Award, TrendingUp } from "lucide-react";

interface DashboardProps {
  reports: Array<{
    id: string;
    created_at: string;
    latitude: number;
    longitude: number;
    ecosystem_type: "mangrove" | "seagrass" | "salt_marsh";
    area_hectares: number;
    status: "draft" | "submitted" | "verified" | "pending";
    notes: string;
    estimated_co2e_tons: number;
    potential_credits: number;
    estimated_value_usd: number;
  }>;
}

const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  const now = new Date();
  const diffTime = Math.abs(now.getTime() - date.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffDays <= 1) return "Today";
  if (diffDays === 2) return "Yesterday";
  if (diffDays <= 7) return `${diffDays} days ago`;
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
};

const Dashboard = ({ reports }: DashboardProps) => {
  // Calculate dynamic stats
  const totalReports = reports.length;
  const totalCarbon = reports.reduce((acc, r) => acc + r.estimated_co2e_tons, 0);
  const totalCredits = reports.reduce((acc, r) => acc + r.potential_credits, 0);
  const totalValue = reports.reduce((acc, r) => acc + r.estimated_value_usd, 0);

  const thisMonthReports = reports.filter(r => new Date(r.created_at).getMonth() === new Date().getMonth());
  const thisMonthCarbon = thisMonthReports.reduce((acc, r) => acc + r.estimated_co2e_tons, 0);

  const pendingReportsCount = reports.filter(r => r.status === "pending").length;

  // Breakdown by ecosystem
  const mangroveCarbon = reports
    .filter(r => r.ecosystem_type === 'mangrove')
    .reduce((acc, r) => acc + r.estimated_co2e_tons, 0);
  const seagrassCarbon = reports
    .filter(r => r.ecosystem_type === 'seagrass')
    .reduce((acc, r) => acc + r.estimated_co2e_tons, 0);
  const saltmarshCarbon = reports
    .filter(r => r.ecosystem_type === 'salt_marsh')
    .reduce((acc, r) => acc + r.estimated_co2e_tons, 0);

  // Sorting reports by date (newest first)
  const sortedReports = [...reports].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );

  const monthlyGoal = 500.0; // t CO2
  const progressPercent = Math.min(100, Math.round((totalCarbon / monthlyGoal) * 100));

  const scrollToForm = () => {
    const formSection = document.querySelector("form");
    if (formSection) {
      formSection.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <section className="py-16 bg-muted/30">
      <div className="container mx-auto px-4">
        <div className="mb-8">
          <h2 className="text-3xl font-bold mb-2">Your Conservation Dashboard</h2>
          <p className="text-muted-foreground">Track your contributions to blue carbon monitoring</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="bg-gradient-wave text-white shadow-wave">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-white/90">Total Reports</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold mb-1">{totalReports}</div>
              <p className="text-xs text-white/80">+{thisMonthReports.length} this month</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Carbon Sequestered</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-success mb-1">{totalCarbon.toFixed(1)}t CO₂</div>
              <p className="text-xs text-muted-foreground">+{thisMonthCarbon.toFixed(1)}t this month</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Verified Credits</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary mb-1">{Math.round(totalCredits)}</div>
              <p className="text-xs text-muted-foreground">+{pendingReportsCount} pending</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Estimated Value</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-accent mb-1">${Math.round(totalValue).toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">At market rate of $15/ton</p>
            </CardContent>
          </Card>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Leaf className="h-5 w-5 text-success" />
                Recent Submissions
              </CardTitle>
              <CardDescription>Your latest blue carbon monitoring reports</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 max-h-[350px] overflow-y-auto pr-1">
              {sortedReports.map((report) => (
                <div key={report.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors">
                  <div className="flex items-center gap-3">
                    <MapPin className="h-4 w-4 text-primary shrink-0" />
                    <div>
                      <p className="font-medium text-sm sm:text-base">
                        {report.ecosystem_type === 'mangrove' ? 'Mangrove Forest' : report.ecosystem_type === 'seagrass' ? 'Seagrass Meadow' : 'Salt Marsh'}
                        {report.notes ? ` - ${report.notes.substring(0, 30)}${report.notes.length > 30 ? '...' : ''}` : ''}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {report.area_hectares} hectares • {formatDate(report.created_at)}
                      </p>
                    </div>
                  </div>
                  <Badge 
                    variant={report.status === 'verified' ? 'outline' : 'secondary'} 
                    className={`shrink-0 ${report.status === 'verified' ? 'text-success border-success' : ''}`}
                  >
                    {report.status.charAt(0).toUpperCase() + report.status.slice(1)}
                  </Badge>
                </div>
              ))}
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Award className="h-5 w-5 text-accent" />
                Carbon Impact Calculator
              </CardTitle>
              <CardDescription>Estimate sequestration potential</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 bg-gradient-ocean rounded-lg text-white">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-white/80">Monthly Goal</span>
                  <TrendingUp className="h-4 w-4 text-white/80" />
                </div>
                <div className="text-2xl font-bold mb-1">{monthlyGoal.toFixed(1)}t CO₂</div>
                <div className="w-full bg-white/20 rounded-full h-2">
                  <div className="bg-accent h-2 rounded-full transition-all duration-500" style={{ width: `${progressPercent}%` }}></div>
                </div>
                <p className="text-xs text-white/80 mt-2">
                  {totalCarbon.toFixed(1)}t completed • {Math.max(0, monthlyGoal - totalCarbon).toFixed(1)}t remaining
                </p>
              </div>
              
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span>Mangroves (0.47 C fraction)</span>
                  <span className="font-medium">{mangroveCarbon.toFixed(1)}t CO₂</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Seagrass (0.43 C fraction)</span>
                  <span className="font-medium">{seagrassCarbon.toFixed(1)}t CO₂</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Salt Marshes (0.45 C fraction)</span>
                  <span className="font-medium">{saltmarshCarbon.toFixed(1)}t CO₂</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
        
        <div className="mt-8 text-center">
          <Button variant="hero" size="lg" onClick={scrollToForm}>
            <Plus className="mr-2 h-5 w-5" />
            Submit New Report
          </Button>
        </div>
      </div>
    </section>
  );
};

export default Dashboard;