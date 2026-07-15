'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { KeyRound, CheckCircle2, AlertCircle, Eye, EyeOff } from 'lucide-react'
import { toast } from 'sonner'

export default function DefinirMotDePassePage() {
  const router = useRouter()
  const supabase = createClient()

  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [sessionOk, setSessionOk] = useState<boolean | null>(null)
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    async function checkSession() {
      const { data: { session } } = await supabase.auth.getSession()
      setSessionOk(!!session)
    }
    checkSession()
  }, [supabase])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    if (password.length < 6) {
      toast.error('Le mot de passe doit faire au moins 6 caracteres')
      return
    }

    if (password !== confirmPassword) {
      toast.error('Les mots de passe ne correspondent pas')
      return
    }

    setLoading(true)
    try {
      const { error } = await supabase.auth.updateUser({ password })
      if (error) throw error
      setSuccess(true)
      toast.success('Mot de passe defini avec succes')
      setTimeout(() => {
        router.push('/')
      }, 2000)
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Erreur'
      toast.error(msg)
    } finally {
      setLoading(false)
    }
  }

  if (sessionOk === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-sm text-gray-500">Verification...</p>
      </div>
    )
  }

  if (sessionOk === false) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8 text-center space-y-4">
          <div className="w-14 h-14 mx-auto rounded-full bg-red-100 flex items-center justify-center">
            <AlertCircle className="h-7 w-7 text-red-600" />
          </div>
          <h1 className="text-xl font-bold text-gray-900">Lien invalide ou expire</h1>
          <p className="text-sm text-gray-600">
            Le lien d&apos;invitation ou de reinitialisation n&apos;est plus valide.
            Demande a l&apos;administrateur de te renvoyer un nouvel email.
          </p>
          <Button onClick={() => router.push('/login')} className="w-full">
            Aller a la connexion
          </Button>
        </div>
      </div>
    )
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8 text-center space-y-4">
          <div className="w-14 h-14 mx-auto rounded-full bg-emerald-100 flex items-center justify-center">
            <CheckCircle2 className="h-7 w-7 text-emerald-600" />
          </div>
          <h1 className="text-xl font-bold text-gray-900">Mot de passe defini</h1>
          <p className="text-sm text-gray-600">Redirection en cours...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-6 md:p-8 space-y-6">
        <div className="text-center space-y-2">
          <div className="w-14 h-14 mx-auto rounded-full bg-blue-100 flex items-center justify-center">
            <KeyRound className="h-7 w-7 text-blue-600" />
          </div>
          <h1 className="text-xl font-bold text-gray-900">Definir ton mot de passe</h1>
          <p className="text-sm text-gray-500">Choisis un mot de passe pour ton compte Anjara</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label>Nouveau mot de passe</Label>
            <div className="relative">
              <Input
                type={showPassword ? 'text' : 'password'}
                placeholder="Min 6 caracteres"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Confirmer le mot de passe</Label>
            <Input
              type={showPassword ? 'text' : 'password'}
              placeholder="Retape le mot de passe"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
          </div>

          <Button
            type="submit"
            className="w-full"
            disabled={loading || !password || !confirmPassword}
          >
            {loading ? 'Enregistrement...' : 'Definir mon mot de passe'}
          </Button>
        </form>

        <p className="text-xs text-gray-400 text-center">
          Une fois defini, tu pourras te connecter avec ton email et ce mot de passe.
        </p>
      </div>
    </div>
  )
        }
