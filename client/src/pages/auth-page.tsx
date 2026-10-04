import { useAuth } from "@/context/auth-context";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { SiGoogle } from "react-icons/si";
import { ArrowRight, Cloud, ShieldCheck } from "lucide-react";
import { useLocation } from "wouter";
import { useEffect } from "react";

export default function AuthPage() {
    const { signInWithGoogle, user, continueAsGuest, isConfigured } = useAuth();
    const [, setLocation] = useLocation();

    useEffect(() => {
        if (user) {
            setLocation("/");
        }
    }, [user, setLocation]);

    return (
        <div className="min-h-screen flex items-center justify-center bg-background p-4">
            <Card className="w-full max-w-md shadow-lg">
                <CardHeader className="text-center space-y-2">
                    <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-1">
                        <Cloud className="w-6 h-6 text-primary" />
                    </div>
                    <CardTitle className="text-2xl font-bold">Welcome to BudgetBuddy</CardTitle>
                    <CardDescription>
                        Sign in to sync your budget in real-time across all your devices, or continue offline as a guest.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    {isConfigured ? (
                        <Button
                            variant="default"
                            className="w-full py-5 text-sm font-medium"
                            onClick={() => signInWithGoogle()}
                        >
                            <SiGoogle className="mr-2 h-4 w-4" />
                            Sign in with Google
                        </Button>
                    ) : (
                        <p className="text-xs text-center text-muted-foreground bg-muted p-2.5 rounded-md">
                            Firebase is running in local mode (environment variables not provided).
                        </p>
                    )}

                    <div className="relative">
                        <div className="absolute inset-0 flex items-center">
                            <span className="w-full border-t border-border" />
                        </div>
                        <div className="relative flex justify-center text-xs uppercase">
                            <span className="bg-card px-2 text-muted-foreground">or</span>
                        </div>
                    </div>

                    <Button
                        variant="outline"
                        className="w-full py-5 text-sm font-medium"
                        onClick={continueAsGuest}
                    >
                        Continue as Guest (Offline)
                        <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>

                    <div className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground pt-2">
                        <ShieldCheck className="w-4 h-4 text-emerald-500" />
                        <span>Authentication is optional. Local data can be synced anytime.</span>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
