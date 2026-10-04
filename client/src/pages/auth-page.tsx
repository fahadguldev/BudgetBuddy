import { useAuth } from "@/context/auth-context";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SiGoogle } from "react-icons/si";
import { useState, useEffect } from "react";
import { AlertCircle, ArrowRight, Cloud, Eye, EyeOff, Lock, Mail, ShieldCheck, User as UserIcon } from "lucide-react";
import { useLocation } from "wouter";

export default function AuthPage() {
    const { signInWithGoogle, signUpWithEmail, signInWithEmail, user, continueAsGuest, isConfigured } = useAuth();
    const [, setLocation] = useLocation();

    // Form states
    const [authMode, setAuthMode] = useState<"signin" | "signup">("signin");
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);

    // Status states
    const [authError, setAuthError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        if (user) {
            setLocation("/");
        }
    }, [user, setLocation]);

    const handleEmailAuthSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setAuthError(null);

        if (!email.trim() || !password.trim()) {
            setAuthError("Please fill in all required fields.");
            return;
        }

        if (authMode === "signup") {
            if (password.length < 6) {
                setAuthError("Password must be at least 6 characters long.");
                return;
            }
            if (password !== confirmPassword) {
                setAuthError("Passwords do not match. Please verify and try again.");
                return;
            }
        }

        setIsLoading(true);
        try {
            if (authMode === "signup") {
                await signUpWithEmail(email.trim(), password, name.trim() || undefined);
            } else {
                await signInWithEmail(email.trim(), password);
            }
        } catch (err: any) {
            console.error("Authentication error:", err);
            handleFirebaseError(err);
        } finally {
            setIsLoading(false);
        }
    };

    const handleGoogleSignIn = async () => {
        setAuthError(null);
        setIsLoading(true);
        try {
            await signInWithGoogle();
        } catch (err: any) {
            console.error("Google sign in failed:", err);
            handleFirebaseError(err);
        } finally {
            setIsLoading(false);
        }
    };

    const handleFirebaseError = (err: any) => {
        const code = err?.code || "";
        switch (code) {
            case "auth/unauthorized-domain":
                setAuthError(
                    "Unauthorized Domain: Please add 'expensetracker785.vercel.app' in your Firebase Console under Authentication > Settings > Authorized Domains."
                );
                break;
            case "auth/operation-not-allowed":
                setAuthError(
                    "Email/Password sign-in is disabled in your Firebase project. Please enable 'Email/Password' in Firebase Console under Authentication > Sign-in method."
                );
                break;
            case "auth/email-already-in-use":
                setAuthError("An account with this email already exists. Please switch to Sign In.");
                break;
            case "auth/invalid-email":
                setAuthError("Please provide a valid email address.");
                break;
            case "auth/weak-password":
                setAuthError("Password must be at least 6 characters long.");
                break;
            case "auth/user-not-found":
            case "auth/wrong-password":
            case "auth/invalid-credential":
                setAuthError("Incorrect email or password. Please verify and try again.");
                break;
            case "auth/popup-closed-by-user":
                setAuthError("Sign-in popup was closed before completion. Please try again.");
                break;
            default:
                setAuthError(err?.message || "Authentication failed. Please check your network and credentials.");
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-background p-4 py-8">
            <Card className="w-full max-w-md shadow-xl border-border/80 rounded-3xl overflow-hidden">
                <CardHeader className="text-center space-y-2 pt-6">
                    <div className="mx-auto w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white flex items-center justify-center mb-1 shadow-md">
                        <Cloud className="w-6 h-6" />
                    </div>
                    <CardTitle className="font-display text-2xl font-bold tracking-tight">
                        BudgetBuddy Account
                    </CardTitle>
                    <CardDescription className="text-xs">
                        Sign in to sync your budgets and wealth portfolio in real-time across your devices.
                    </CardDescription>
                </CardHeader>

                <CardContent className="space-y-4 px-6 pb-6">
                    {/* Error Alert Banner */}
                    {authError && (
                        <div className="p-3.5 rounded-2xl bg-destructive/10 border border-destructive/20 text-destructive text-xs space-y-1">
                            <div className="flex items-center gap-1.5 font-semibold">
                                <AlertCircle className="w-4 h-4 shrink-0" />
                                <span>Authentication Notice</span>
                            </div>
                            <p className="leading-relaxed">{authError}</p>
                        </div>
                    )}

                    {isConfigured ? (
                        <>
                            {/* Tabs for Sign In vs Sign Up */}
                            <Tabs
                                value={authMode}
                                onValueChange={(val) => {
                                    setAuthMode(val as "signin" | "signup");
                                    setAuthError(null);
                                }}
                                className="w-full"
                            >
                                <TabsList className="grid grid-cols-2 h-10 p-1 bg-muted/60 rounded-xl">
                                    <TabsTrigger value="signin" className="text-xs font-medium rounded-lg">
                                        Sign In
                                    </TabsTrigger>
                                    <TabsTrigger value="signup" className="text-xs font-medium rounded-lg">
                                        Create Account
                                    </TabsTrigger>
                                </TabsList>

                                {/* Form */}
                                <form onSubmit={handleEmailAuthSubmit} className="space-y-3.5 mt-4">
                                    {authMode === "signup" && (
                                        <div className="space-y-1.5">
                                            <Label htmlFor="auth-name" className="text-xs font-medium">
                                                Full Name
                                            </Label>
                                            <div className="relative">
                                                <UserIcon className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
                                                <Input
                                                    id="auth-name"
                                                    type="text"
                                                    placeholder="Ali Khan"
                                                    value={name}
                                                    onChange={(e) => setName(e.target.value)}
                                                    className="pl-9 h-10 rounded-xl text-sm"
                                                />
                                            </div>
                                        </div>
                                    )}

                                    <div className="space-y-1.5">
                                        <Label htmlFor="auth-email" className="text-xs font-medium">
                                            Email Address
                                        </Label>
                                        <div className="relative">
                                            <Mail className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
                                            <Input
                                                id="auth-email"
                                                type="email"
                                                required
                                                placeholder="you@example.com"
                                                value={email}
                                                onChange={(e) => setEmail(e.target.value)}
                                                className="pl-9 h-10 rounded-xl text-sm"
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-1.5">
                                        <div className="flex items-center justify-between">
                                            <Label htmlFor="auth-password" className="text-xs font-medium">
                                                Password
                                            </Label>
                                            {authMode === "signup" && (
                                                <span className="text-[10px] text-muted-foreground">Min 6 characters</span>
                                            )}
                                        </div>
                                        <div className="relative">
                                            <Lock className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
                                            <Input
                                                id="auth-password"
                                                type={showPassword ? "text" : "password"}
                                                required
                                                placeholder="••••••••"
                                                value={password}
                                                onChange={(e) => setPassword(e.target.value)}
                                                className="pl-9 pr-9 h-10 rounded-xl text-sm"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowPassword(!showPassword)}
                                                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                                                aria-label={showPassword ? "Hide password" : "Show password"}
                                            >
                                                {showPassword ? (
                                                    <EyeOff className="w-4 h-4" />
                                                ) : (
                                                    <Eye className="w-4 h-4" />
                                                )}
                                            </button>
                                        </div>
                                    </div>

                                    {authMode === "signup" && (
                                        <div className="space-y-1.5">
                                            <Label htmlFor="auth-confirm-password" className="text-xs font-medium">
                                                Confirm Password
                                            </Label>
                                            <div className="relative">
                                                <Lock className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
                                                <Input
                                                    id="auth-confirm-password"
                                                    type={showPassword ? "text" : "password"}
                                                    required
                                                    placeholder="••••••••"
                                                    value={confirmPassword}
                                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                                    className="pl-9 h-10 rounded-xl text-sm"
                                                />
                                            </div>
                                        </div>
                                    )}

                                    <Button
                                        type="submit"
                                        disabled={isLoading}
                                        className="w-full h-11 rounded-xl text-sm font-semibold shadow-sm active:scale-95 transition-all mt-2"
                                    >
                                        {isLoading
                                            ? "Processing..."
                                            : authMode === "signup"
                                            ? "Create Account"
                                            : "Sign In"}
                                    </Button>
                                </form>
                            </Tabs>

                            <div className="relative my-4">
                                <div className="absolute inset-0 flex items-center">
                                    <span className="w-full border-t border-border" />
                                </div>
                                <div className="relative flex justify-center text-xs uppercase">
                                    <span className="bg-card px-2 text-muted-foreground text-[10px] tracking-wider">
                                        or continue with
                                    </span>
                                </div>
                            </div>

                            {/* Google OAuth Button */}
                            <Button
                                type="button"
                                variant="outline"
                                className="w-full h-11 rounded-xl text-sm font-medium border-border/80 hover:bg-muted/60 active:scale-95 transition-all"
                                disabled={isLoading}
                                onClick={handleGoogleSignIn}
                            >
                                <SiGoogle className="mr-2 h-4 w-4 text-red-500" />
                                Google
                            </Button>
                        </>
                    ) : (
                        <p className="text-xs text-center text-muted-foreground bg-muted p-3 rounded-xl">
                            Firebase credentials not detected. You can use BudgetBuddy completely offline in Guest Mode.
                        </p>
                    )}

                    <div className="relative my-3">
                        <div className="absolute inset-0 flex items-center">
                            <span className="w-full border-t border-border" />
                        </div>
                        <div className="relative flex justify-center text-xs uppercase">
                            <span className="bg-card px-2 text-muted-foreground text-[10px] tracking-wider">
                                or
                            </span>
                        </div>
                    </div>

                    {/* Guest Offline Button */}
                    <Button
                        variant="ghost"
                        className="w-full h-11 rounded-xl text-sm font-medium hover:bg-muted/60 text-muted-foreground hover:text-foreground active:scale-95 transition-all"
                        onClick={continueAsGuest}
                    >
                        Continue as Guest (Offline)
                        <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>

                    <div className="flex items-center justify-center gap-1.5 text-[11px] text-muted-foreground pt-1">
                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                        <span>Offline first: all budgets work without cloud sync.</span>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
