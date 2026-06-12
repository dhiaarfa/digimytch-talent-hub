'use client';
import { logger } from "@/lib/logger";

import { createContext, useCallback, useContext, useMemo, useState } from "react";
import { toast } from "sonner";
import { Github, Loader2 } from "lucide-react";

import { signInWithGithub, signInWithGoogle } from "@/app/auth/login/actions";
import { LoginForm } from "@/components/auth/login-form";
import { SignupForm } from "@/components/auth/signup-form";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export type AuthTab = "login" | "signup";

interface AuthDialogContextValue {
  openDialog: (tab?: AuthTab) => void;
}

const AuthDialogContext = createContext<AuthDialogContextValue | undefined>(undefined);

function TabButton({ value, children }: { value: AuthTab; children: React.ReactNode }) {
  return (
    <TabsTrigger
      value={value}
      className="
        relative flex-1 h-8 px-3 text-sm font-medium rounded-md
        transition-all duration-200 ease-out
        data-[state=inactive]:text-slate-600 data-[state=inactive]:bg-transparent
        data-[state=active]:text-violet-700 data-[state=active]:bg-violet-50 data-[state=active]:shadow-sm
        data-[state=inactive]:hover:text-violet-600 data-[state=inactive]:hover:bg-violet-50/50
        border-0 shadow-none
        focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-violet-400 focus-visible:ring-offset-0
      "
    >
      {children}
    </TabsTrigger>
  );
}

// Inline Google SVG icon (no lucide equivalent)
function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden>
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
    </svg>
  );
}

function SocialAuth() {
  const [loadingProvider, setLoadingProvider] = useState<"github" | "google" | null>(null);
  const [errorMessage, setErrorMessage] = useState<string>();

  const handleOAuth = async (provider: "github" | "google") => {
    setErrorMessage(undefined);
    setLoadingProvider(provider);

    try {
      const result = await (provider === "github" ? signInWithGithub() : signInWithGoogle());

      if (!result.success) {
        setErrorMessage(result.error || `Échec de la connexion avec ${provider === "github" ? "GitHub" : "Google"}.`);
        return;
      }

      if (result.url) {
        window.location.href = result.url;
        return;
      }

      setErrorMessage(`Impossible de démarrer la connexion ${provider === "github" ? "GitHub" : "Google"}.`);
    } catch (error) {
      logger.error(`Failed to sign in with ${provider}:`, error);
      setErrorMessage(`Impossible de démarrer la connexion ${provider === "github" ? "GitHub" : "Google"}.`);
    } finally {
      setLoadingProvider(null);
    }
  };

  return (
    <div className="space-y-3 mt-4">
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <Separator className="bg-slate-200" />
        </div>
        <div className="relative flex justify-center text-xs">
          <span className="bg-white px-3 text-slate-500">ou continuer avec</span>
        </div>
      </div>

      {/* Google */}
      <Button
        variant="outline"
        className="w-full h-10 bg-white border-slate-200 hover:bg-slate-50 hover:border-slate-300 text-slate-700 font-medium transition-all duration-200 rounded-lg"
        onClick={() => handleOAuth("google")}
        disabled={loadingProvider !== null}
      >
        {loadingProvider === "google" ? (
          <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Connexion…</>
        ) : (
          <><GoogleIcon className="mr-2 h-4 w-4" />Continuer avec Google</>
        )}
      </Button>

      {/* GitHub */}
      <Button
        variant="outline"
        className="w-full h-10 bg-white border-slate-200 hover:bg-slate-50 hover:border-slate-300 text-slate-700 font-medium transition-all duration-200 rounded-lg"
        onClick={() => handleOAuth("github")}
        disabled={loadingProvider !== null}
      >
        {loadingProvider === "github" ? (
          <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Connexion…</>
        ) : (
          <><Github className="mr-2 h-4 w-4" />Continuer avec GitHub</>
        )}
      </Button>

      {errorMessage && (
        <Alert variant="destructive" className="bg-red-50/50 text-red-900 border-red-200/50" role="alert">
          <AlertDescription>{errorMessage}</AlertDescription>
        </Alert>
      )}
    </div>
  );
}

export function AuthDialogProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<AuthTab>("signup");
  const [formVersion, setFormVersion] = useState(0);

  const resetDialog = useCallback(() => {
    setActiveTab("signup");
    setFormVersion((version) => version + 1);
  }, []);

  const closeDialog = useCallback(() => {
    setOpen(false);
    resetDialog();
  }, [resetDialog]);

  const openDialog = useCallback((tab: AuthTab = "signup") => {
    setActiveTab(tab);
    setOpen(true);
  }, []);

  const handleOpenChange = useCallback(
    (isOpen: boolean) => {
      if (!isOpen) {
        closeDialog();
        return;
      }

      setOpen(true);
    },
    [closeDialog]
  );

  const handleSignupSuccess = useCallback(() => {
    toast.success("Compte créé. Consultez votre e-mail pour confirmer votre inscription.");
    closeDialog();
  }, [closeDialog]);

  const contextValue = useMemo(
    () => ({
      openDialog,
    }),
    [openDialog]
  );

  return (
    <AuthDialogContext.Provider value={contextValue}>
      {children}

      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent
          className="
            sm:max-w-[420px] w-full max-h-[min(85vh,720px)] p-0 bg-white border border-slate-200 shadow-xl
            animate-in fade-in-0 zoom-in-95 duration-200
            rounded-xl overflow-hidden overflow-y-auto
          "
        >
          <DialogTitle className="sr-only">Authentification</DialogTitle>
          <DialogDescription className="sr-only">Connexion ou création de compte</DialogDescription>

          <div className="px-6 pt-6">
            <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as AuthTab)} className="w-full">
              <TabsList
                className="
                  w-full h-10 bg-violet-50/30 border border-violet-100/50 p-1
                  flex gap-0.5 rounded-lg
                "
              >
                <TabButton value="login">Connexion</TabButton>
                <TabButton value="signup">Créer un compte</TabButton>
              </TabsList>

              <div className="mt-5 pb-6">
                <TabsContent value="login" className="mt-0 space-y-4">
                  <div className="text-center mb-4">
                    <h3 className="text-lg font-semibold text-slate-900">Bon retour</h3>
                    <p className="text-sm text-slate-600 mt-1">Connectez-vous pour continuer</p>
                  </div>
                  <LoginForm key={`login-${formVersion}`} />
                  <SocialAuth />
                </TabsContent>

                <TabsContent value="signup" className="mt-0 space-y-4">
                  <div className="text-center mb-4">
                    <h3 className="text-lg font-semibold text-slate-900">Bienvenue</h3>
                    <p className="text-sm text-slate-600 mt-1">Créez votre compte gratuitement</p>
                  </div>
                  <SignupForm key={`signup-${formVersion}`} onSuccess={handleSignupSuccess} />
                  <SocialAuth />
                </TabsContent>
              </div>
            </Tabs>
          </div>
        </DialogContent>
      </Dialog>
    </AuthDialogContext.Provider>
  );
}

export function useAuthDialog() {
  const context = useContext(AuthDialogContext);
  if (!context) {
    throw new Error("useAuthDialog must be used inside AuthDialogProvider");
  }
  return context;
}
