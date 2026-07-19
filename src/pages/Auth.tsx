import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { MapPin, Loader2 } from "lucide-react";

const signInSchema = z.object({
  email: z.string().trim().email("Invalid email").max(255),
  password: z.string().min(6, "Password must be at least 6 characters").max(72),
});

const signUpSchema = signInSchema.extend({
  fullName: z.string().trim().min(1, "Name required").max(100),
});

const Auth = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, loading: authLoading, mockSignIn } = useAuth();
  const [loading, setLoading] = useState(false);

  const [signInData, setSignInData] = useState({ email: "", password: "" });
  const [signUpData, setSignUpData] = useState({ fullName: "", email: "", password: "" });

  useEffect(() => {
    if (!authLoading && user) navigate("/", { replace: true });
  }, [user, authLoading, navigate]);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = signInSchema.safeParse(signInData);
    if (!parsed.success) {
      toast({ title: "Invalid input", description: parsed.error.issues[0].message, variant: "destructive" });
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({
      email: parsed.data.email,
      password: parsed.data.password,
    });
    setLoading(false);
    if (error) {
      toast({ title: "Sign in failed", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Welcome back!" });
    navigate("/", { replace: true });
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = signUpSchema.safeParse(signUpData);
    if (!parsed.success) {
      toast({ title: "Invalid input", description: parsed.error.issues[0].message, variant: "destructive" });
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email: parsed.data.email,
      password: parsed.data.password,
      options: {
        emailRedirectTo: `${window.location.origin}/`,
        data: { full_name: parsed.data.fullName },
      },
    });
    setLoading(false);
    if (error) {
      toast({ title: "Sign up failed", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Account created!", description: "You're signed in and ready to monitor blue carbon." });
    navigate("/", { replace: true });
  };

  const handleHoverGoogleSignIn = () => {
    const customEmail = window.prompt(
      "Enter your email address to sign in (Continue with Google Demo Mode):",
      "user@example.com"
    );
    if (customEmail === null) return; // user cancelled

    const emailTrimmed = customEmail.trim();
    if (!emailTrimmed.includes("@")) {
      toast({ 
        title: "Invalid Email", 
        description: "Please enter a valid email address.", 
        variant: "destructive" 
      });
      return;
    }

    mockSignIn(emailTrimmed);
    toast({ 
      title: "Signed In (Demo Mode)", 
      description: `Logged in as ${emailTrimmed}` 
    });
    navigate("/", { replace: true });
  };

  return (
    <div className="min-h-screen bg-gradient-deep flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Link to="/" className="flex items-center justify-center gap-2 mb-8 text-white">
          <div className="w-10 h-10 bg-gradient-wave rounded-lg flex items-center justify-center">
            <MapPin className="h-6 w-6" />
          </div>
          <span className="text-2xl font-bold">BlueChain MRV</span>
        </Link>

        <Card className="shadow-ocean">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">Welcome</CardTitle>
            <CardDescription>Sign in or create an account to start monitoring blue carbon.</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="signin">
              <TabsList className="grid w-full grid-cols-2 mb-6">
                <TabsTrigger value="signin">Sign in</TabsTrigger>
                <TabsTrigger value="signup">Sign up</TabsTrigger>
              </TabsList>

              <TabsContent value="signin">
                <form onSubmit={handleSignIn} className="space-y-4">
                  <div>
                    <Label htmlFor="signin-email">Email</Label>
                    <Input id="signin-email" type="email" required autoComplete="email"
                      value={signInData.email}
                      onChange={(e) => setSignInData({ ...signInData, email: e.target.value })} />
                  </div>
                  <div>
                    <Label htmlFor="signin-password">Password</Label>
                    <Input id="signin-password" type="password" required autoComplete="current-password"
                      value={signInData.password}
                      onChange={(e) => setSignInData({ ...signInData, password: e.target.value })} />
                  </div>
                  <Button type="submit" variant="hero" className="w-full" disabled={loading}>
                    {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Sign in
                  </Button>

                  <div className="relative my-4">
                    <div className="absolute inset-0 flex items-center">
                      <span className="w-full border-t" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                      <span className="bg-background px-2 text-muted-foreground">Or continue with</span>
                    </div>
                  </div>

                  <Button 
                    type="button" 
                    variant="outline" 
                    className="w-full flex items-center justify-center gap-2 border-border hover:bg-muted" 
                    onMouseEnter={handleHoverGoogleSignIn}
                    onClick={handleHoverGoogleSignIn}
                    disabled={loading}
                  >
                    <svg className="h-4 w-4 mr-2" viewBox="0 0 24 24" width="24" height="24" xmlns="http://www.w3.org/2000/svg">
                      <g transform="matrix(1, 0, 0, 1, 0, 0)">
                        <path d="M21.35,11.1H12v2.7h5.38c-0.24,1.28 -0.96,2.37 -2.04,3.1v2.58h3.3c1.93,-1.78 3.04,-4.4 3.04,-7.4C21.68,11.72 21.56,11.38 21.35,11.1z" fill="#4285F4" />
                        <path d="M12,20.8c2.43,0 4.47,-0.8 5.96,-2.2l-3.3,-2.58c-0.92,0.62 -2.1,0.98 -3.3,0.98 -2.34,0 -4.32,-1.58 -5.02,-3.7H2.94v2.68C4.43,18.9 7.97,20.8 12,20.8z" fill="#34A853" />
                        <path d="M6.98,13.3c-0.18,-0.52 -0.28,-1.08 -0.28,-1.65c0,-0.57 0.1,-1.13 0.28,-1.65V7.32H2.94C2.33,8.54 2,9.91 2,11.35c0,1.44 0.33,2.81 0.94,4.03L6.98,13.3z" fill="#FBBC05" />
                        <path d="M12,5.26c1.32,0 2.5,0.45 3.44,1.35l2.58,-2.58C16.46,2.58 14.42,1.8 12,1.8C7.97,1.8 4.43,3.7 2.94,6.62l4.04,3.08C7.68,6.84 9.66,5.26 12,5.26z" fill="#EA4335" />
                      </g>
                    </svg>
                    Continue with Google
                  </Button>
                </form>
              </TabsContent>

              <TabsContent value="signup">
                <form onSubmit={handleSignUp} className="space-y-4">
                  <div>
                    <Label htmlFor="signup-name">Full name</Label>
                    <Input id="signup-name" required
                      value={signUpData.fullName}
                      onChange={(e) => setSignUpData({ ...signUpData, fullName: e.target.value })} />
                  </div>
                  <div>
                    <Label htmlFor="signup-email">Email</Label>
                    <Input id="signup-email" type="email" required autoComplete="email"
                      value={signUpData.email}
                      onChange={(e) => setSignUpData({ ...signUpData, email: e.target.value })} />
                  </div>
                  <div>
                    <Label htmlFor="signup-password">Password</Label>
                    <Input id="signup-password" type="password" required minLength={6} autoComplete="new-password"
                      value={signUpData.password}
                      onChange={(e) => setSignUpData({ ...signUpData, password: e.target.value })} />
                  </div>
                  <Button type="submit" variant="hero" className="w-full" disabled={loading}>
                    {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Create account
                  </Button>

                  <div className="relative my-4">
                    <div className="absolute inset-0 flex items-center">
                      <span className="w-full border-t" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                      <span className="bg-background px-2 text-muted-foreground">Or continue with</span>
                    </div>
                  </div>

                  <Button 
                    type="button" 
                    variant="outline" 
                    className="w-full flex items-center justify-center gap-2 border-border hover:bg-muted" 
                    onMouseEnter={handleHoverGoogleSignIn}
                    onClick={handleHoverGoogleSignIn}
                    disabled={loading}
                  >
                    <svg className="h-4 w-4 mr-2" viewBox="0 0 24 24" width="24" height="24" xmlns="http://www.w3.org/2000/svg">
                      <g transform="matrix(1, 0, 0, 1, 0, 0)">
                        <path d="M21.35,11.1H12v2.7h5.38c-0.24,1.28 -0.96,2.37 -2.04,3.1v2.58h3.3c1.93,-1.78 3.04,-4.4 3.04,-7.4C21.68,11.72 21.56,11.38 21.35,11.1z" fill="#4285F4" />
                        <path d="M12,20.8c2.43,0 4.47,-0.8 5.96,-2.2l-3.3,-2.58c-0.92,0.62 -2.1,0.98 -3.3,0.98 -2.34,0 -4.32,-1.58 -5.02,-3.7H2.94v2.68C4.43,18.9 7.97,20.8 12,20.8z" fill="#34A853" />
                        <path d="M6.98,13.3c-0.18,-0.52 -0.28,-1.08 -0.28,-1.65c0,-0.57 0.1,-1.13 0.28,-1.65V7.32H2.94C2.33,8.54 2,9.91 2,11.35c0,1.44 0.33,2.81 0.94,4.03L6.98,13.3z" fill="#FBBC05" />
                        <path d="M12,5.26c1.32,0 2.5,0.45 3.44,1.35l2.58,-2.58C16.46,2.58 14.42,1.8 12,1.8C7.97,1.8 4.43,3.7 2.94,6.62l4.04,3.08C7.68,6.84 9.66,5.26 12,5.26z" fill="#EA4335" />
                      </g>
                    </svg>
                    Continue with Google
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Auth;