import { useAuth } from "@/context/auth-context";
import { Route } from "wouter";
import { Loader2 } from "lucide-react";

export function ProtectedRoute({ component: Component, path }: { component: React.ComponentType<any>, path: string }) {
    const { loading } = useAuth();

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    // Auth is optional: all routes are accessible to guests and logged-in users alike
    return <Route path={path} component={Component} />;
}
