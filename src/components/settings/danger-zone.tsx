'use client'

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"
import { Loader2 } from "lucide-react"
import { useFormStatus } from 'react-dom'
import { deleteUserAccount } from "@/app/auth/login/actions"
import { IS_DIGIMYTCH_TALENT_HUB } from "@/lib/digimytch-config"

interface DangerZoneProps {
  subscriptionStatus?: string;
}

interface SubmitButtonProps {
  isEnabled: boolean;
}

function SubmitButton({ isEnabled }: SubmitButtonProps) {
  const { pending } = useFormStatus()
  const isDisabled = pending || !isEnabled
  const digimytch = IS_DIGIMYTCH_TALENT_HUB

  return (
    <AlertDialogAction
      type="submit"
      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
      disabled={isDisabled}
    >
      {pending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
      {digimytch ? "Supprimer le compte" : "Delete Account"}
    </AlertDialogAction>
  )
}

export function DangerZone({ subscriptionStatus }: DangerZoneProps) {
  const [confirmation, setConfirmation] = useState("")
  const isConfirmed = confirmation === "DELETE"
  const digimytch = IS_DIGIMYTCH_TALENT_HUB

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between p-4 rounded-lg border border-destructive/50 bg-destructive/5">
        <div>
          <h3 className="font-medium text-destructive">
            {digimytch ? "Supprimer le compte" : "Delete Account"}
          </h3>
          <p className="text-sm text-muted-foreground">
            {digimytch
              ? "Supprimer définitivement votre compte et toutes vos données."
              : "Permanently delete your account and all of your data"}
          </p>
          {!digimytch && subscriptionStatus === "active" && (
            <p className="text-sm text-muted-foreground mt-2">
              You currently have an active subscription. Cancel above to avoid future charges before deleting your account.
            </p>
          )}
          {digimytch && (
            <p className="text-sm text-muted-foreground mt-2">
              Cette action est irréversible. Toutes vos données seront supprimées définitivement.
            </p>
          )}
        </div>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button 
              variant="destructive"
              className="bg-rose-500 hover:bg-rose-600"
            >
              {digimytch ? "Supprimer le compte" : "Delete Account"}
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <form action={deleteUserAccount}>
              <AlertDialogHeader>
                <AlertDialogTitle>
                  {digimytch ? "Êtes-vous absolument sûr ?" : "Are you absolutely sure?"}
                </AlertDialogTitle>
                <AlertDialogDescription>
                  {digimytch
                    ? "Cette action est irréversible. Votre compte et toutes vos données seront supprimés."
                    : "This action cannot be undone. This will permanently delete your account and remove your data from our servers."}
                </AlertDialogDescription>
              </AlertDialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="confirm">
                    {digimytch ? "Tapez « DELETE » pour confirmer" : "Type “DELETE” to confirm"}
                  </Label>
                  <Input
                    id="confirm"
                    name="confirm"
                    placeholder="DELETE"
                    className="bg-white/50"
                    value={confirmation}
                    onChange={(event) => setConfirmation(event.target.value.toUpperCase())}
                    required
                  />
                </div>
              </div>
              <AlertDialogFooter>
                <AlertDialogCancel>{digimytch ? "Annuler" : "Cancel"}</AlertDialogCancel>
                <SubmitButton isEnabled={isConfirmed} />
              </AlertDialogFooter>
            </form>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  )
} 