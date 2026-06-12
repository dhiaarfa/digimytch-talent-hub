'use client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { SecurityForm } from "./security-form"
import { ApiKeysForm } from "./api-keys-form"
import { SubscriptionSection } from "./subscription-section"
import { DangerZone } from "./danger-zone"
import { AiPromptsForm } from "./ai-prompts-form"
import { User } from "@supabase/supabase-js"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { useEffect, useMemo, useState } from "react"
import type { SubscriptionSnapshot } from "@/lib/subscription-access"
import { IS_DIGIMYTCH_TALENT_HUB } from "@/lib/digimytch-config"
import { PFE_TAGLINE } from "@/lib/digimytch-branding"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { ProfileSection, type ProfileSectionUser } from "./profile-section"

const allSections = [
  { id: "profile", title: "Profil", description: "Photo et nom affiché", icon: "👤" },
  { id: "security", title: "Sécurité", description: "E-mail et mot de passe", icon: "🔒" },
  { id: "subscription", title: "Abonnement", description: "Facturation et plan Pro", icon: "💳" },
  { id: "api-keys", title: "Intelligence artificielle", description: "Clé OpenRouter et modèle par défaut", icon: "🤖" },
  { id: "ai-prompts", title: "Prompts IA", description: "Personnalisation avancée des assistants", icon: "✏️" },
  { id: "danger-zone", title: "Zone sensible", description: "Suppression du compte", icon: "⚠️" },
] as const

interface SettingsContentProps {
  user: User | null;
  profileUser?: ProfileSectionUser | null;
  isProPlan: boolean;
  subscriptionStatus: string;
  subscriptionSnapshot: SubscriptionSnapshot | null;
  isAdmin?: boolean;
}

export function SettingsContent({
  user,
  profileUser,
  isProPlan,
  subscriptionStatus,
  subscriptionSnapshot,
  isAdmin = false,
}: SettingsContentProps) {
  const digimytch = IS_DIGIMYTCH_TALENT_HUB
  const sections = useMemo(
    () =>
      digimytch
        ? allSections.filter((s) => s.id !== "subscription" && s.id !== "ai-prompts")
        : [...allSections],
    [digimytch]
  )
  const [activeSection, setActiveSection] = useState<string>(
    digimytch ? "profile" : "security"
  )

  useEffect(() => {
    const handleScroll = () => {
      const sectionElements = sections.map(section => ({
        id: section.id,
        element: document.getElementById(section.id),
      }))

      const currentSection = sectionElements.find(({ element }) => {
        if (!element) return false
        const rect = element.getBoundingClientRect()
        return rect.top <= 100 && rect.bottom > 100
      })

      if (currentSection) {
        setActiveSection(currentSection.id)
      }
    }

    window.addEventListener("scroll", handleScroll, { passive: true })
    return () => window.removeEventListener("scroll", handleScroll)
  }, [sections])

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId)
    if (element) {
      const offset = 80
      const elementPosition = element.getBoundingClientRect().top
      const offsetPosition = elementPosition + window.pageYOffset - offset

      window.scrollTo({
        top: offsetPosition,
        behavior: "smooth"
      })
    }
  }

  return (
    <div className="flex gap-8 relative">
      {/* Table of Contents */}
      <div className="w-64 hidden lg:block">
        <div className="sticky top-20 rounded-lg border border-white/40 bg-white/80 backdrop-blur-xl p-4">
          <h3 className="font-semibold mb-4 text-muted-foreground">Sur cette page</h3>
          <div className="space-y-1">
            {sections.map((section) => (
              <Button
                key={section.id}
                variant="ghost"
                className={cn(
                  "w-full justify-start text-left font-normal transition-all duration-200 relative pl-8",
                  activeSection === section.id && 
                  "bg-gradient-to-r from-purple-600/10 to-indigo-600/10 text-purple-600 font-medium",
                  activeSection !== section.id && "text-muted-foreground hover:text-foreground"
                )}
                onClick={() => scrollToSection(section.id)}
              >
                <span className="absolute left-2">{section.icon}</span>
                <span className="truncate">{section.title}</span>
                {activeSection === section.id && (
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 bg-gradient-to-b from-purple-600 to-indigo-600 rounded-full" />
                )}
              </Button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 space-y-8">
        <Link
          href="/home"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-[var(--digi-navy)] transition-colors"
        >
          <ArrowLeft className="h-4 w-4 shrink-0" aria-hidden />
          Tableau de bord
        </Link>
        {profileUser && (
          <ProfileSection user={profileUser} />
        )}

        {isAdmin && (
          <Card className="border-[#030A8C]/20 bg-blue-50/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Administration</CardTitle>
              <CardDescription>
                Gérer le catalogue formations et consulter les statistiques plateforme.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild variant="outline" className="border-[#030A8C] text-[#030A8C]">
                <Link href="/admin">Ouvrir le tableau de bord admin</Link>
              </Button>
            </CardContent>
          </Card>
        )}

        {digimytch && (
          <Card className="border-[var(--digi-border)] bg-[var(--digi-surface)]/80">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">{PFE_TAGLINE}</CardTitle>
              <CardDescription>
                Environnement de démonstration locale. Pas de facturation, pas de produit commercial.
                Configurez uniquement votre clé OpenRouter si elle n&apos;est pas déjà dans le fichier <code className="text-xs">.env</code>.
              </CardDescription>
            </CardHeader>
          </Card>
        )}

        {/* Security Settings */}
        <Card id="security" className="border-white/40 shadow-xl shadow-black/5 bg-white/80 backdrop-blur-xl">
          <CardHeader>
            <CardTitle className="text-xl">Sécurité</CardTitle>
            <CardDescription>E-mail et mot de passe de connexion</CardDescription>
          </CardHeader>
          <CardContent>
            <SecurityForm user={user} />
          </CardContent>
        </Card>

        {!digimytch && (
        <Card id="subscription" className="border-white/40 shadow-xl shadow-black/5 bg-white/80 backdrop-blur-xl">
          <CardHeader>
            <CardTitle className="text-xl">Abonnement</CardTitle>
            <CardDescription>Gestion du plan et de la facturation</CardDescription>
          </CardHeader>
          <CardContent>
            <SubscriptionSection initialProfile={subscriptionSnapshot} />
          </CardContent>
        </Card>
        )}

        {/* API Keys / IA */}
        <Card id="api-keys" className="border-white/40 shadow-xl shadow-black/5 bg-white/80 backdrop-blur-xl">
          <CardHeader>
            <CardTitle className="text-xl">{digimytch ? "Intelligence artificielle" : "API Keys"}</CardTitle>
            <CardDescription>
              {digimytch
                ? "Modèle par défaut et clé OpenRouter (optionnel si déjà dans .env)"
                : "Manage your API keys for different AI providers"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ApiKeysForm isProPlan={isProPlan} />
          </CardContent>
        </Card>

        {!digimytch && (
        <Card id="ai-prompts" className="border-white/40 shadow-xl shadow-black/5 bg-white/80 backdrop-blur-xl">
          <CardHeader>
            <CardTitle className="text-xl">Prompts IA</CardTitle>
            <CardDescription>Personnalisation avancée des assistants</CardDescription>
          </CardHeader>
          <CardContent>
            <AiPromptsForm />
          </CardContent>
        </Card>
        )}

        {/* Danger Zone */}
        <Card id="danger-zone" className="border-destructive/50 shadow-xl shadow-black/5 bg-white/80 backdrop-blur-xl">
          <CardHeader>
            <CardTitle className="text-xl text-destructive">Zone sensible</CardTitle>
            <CardDescription>Suppression définitive du compte de démonstration</CardDescription>
          </CardHeader>
          <CardContent>
            <DangerZone subscriptionStatus={subscriptionStatus} />
          </CardContent>
        </Card>
      </div>
    </div>
  )
} 
