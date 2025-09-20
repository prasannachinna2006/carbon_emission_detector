import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, MapPin, Leaf, Award, TrendingUp } from "lucide-react";

const Dashboard = () => {
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
              <div className="text-2xl font-bold mb-1">24</div>
              <p className="text-xs text-white/80">+3 this month</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Carbon Sequestered</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-success mb-1">1.2t CO₂</div>
              <p className="text-xs text-muted-foreground">+0.3t this month</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Verified Credits</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary mb-1">18</div>
              <p className="text-xs text-muted-foreground">+5 pending</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Community Rank</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-accent mb-1">#7</div>
              <p className="text-xs text-muted-foreground">Top 10% contributor</p>
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
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-3">
                  <MapPin className="h-4 w-4 text-primary" />
                  <div>
                    <p className="font-medium">Mangrove Forest - Sector A</p>
                    <p className="text-xs text-muted-foreground">0.8 hectares • 2 days ago</p>
                  </div>
                </div>
                <Badge variant="outline" className="text-success border-success">Verified</Badge>
              </div>
              
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-3">
                  <MapPin className="h-4 w-4 text-primary" />
                  <div>
                    <p className="font-medium">Seagrass Meadow - Zone B</p>
                    <p className="text-xs text-muted-foreground">1.2 hectares • 5 days ago</p>
                  </div>
                </div>
                <Badge variant="secondary">Pending</Badge>
              </div>
              
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-3">
                  <MapPin className="h-4 w-4 text-primary" />
                  <div>
                    <p className="font-medium">Salt Marsh - Coast C</p>
                    <p className="text-xs text-muted-foreground">0.5 hectares • 1 week ago</p>
                  </div>
                </div>
                <Badge variant="outline" className="text-success border-success">Verified</Badge>
              </div>
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
                <div className="text-2xl font-bold mb-1">2.0t CO₂</div>
                <div className="w-full bg-white/20 rounded-full h-2">
                  <div className="bg-accent h-2 rounded-full" style={{ width: '60%' }}></div>
                </div>
                <p className="text-xs text-white/80 mt-2">1.2t completed • 0.8t remaining</p>
              </div>
              
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span>Mangroves (0.47 C fraction)</span>
                  <span className="font-medium">0.7t CO₂</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Seagrass (0.43 C fraction)</span>
                  <span className="font-medium">0.3t CO₂</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Salt Marshes (0.45 C fraction)</span>
                  <span className="font-medium">0.2t CO₂</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
        
        <div className="mt-8 text-center">
          <Button variant="hero" size="lg">
            <Plus className="mr-2 h-5 w-5" />
            Submit New Report
          </Button>
        </div>
      </div>
    </section>
  );
};

export default Dashboard;