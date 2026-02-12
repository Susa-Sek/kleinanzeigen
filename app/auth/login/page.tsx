'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isSignUp) {
        // Sign up
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/auth/callback`,
          },
        });

        if (error) throw error;

        if (data.user) {
          toast.success('Account erstellt! Bitte bestätige deine E-Mail.');
          // Automatically sign in if email confirmation is disabled
          if (data.session) {
            router.push('/dashboard');
          }
        }
      } else {
        // Sign in
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) throw error;

        toast.success('Erfolgreich eingeloggt!');
        router.push('/dashboard');
      }
    } catch (error: any) {
      toast.error(error.message || 'Fehler bei der Anmeldung');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">
            {isSignUp ? 'Account erstellen' : 'Willkommen zurück'}
          </CardTitle>
          <CardDescription className="text-center">
            {isSignUp
              ? 'Erstelle einen Account für deine eBay Kleinanzeigen Multi-Account Plattform'
              : 'Logge dich ein um deine Nachrichten zu sehen'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleAuth} className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-medium">
                E-Mail
              </label>
              <Input
                id="email"
                type="email"
                placeholder="deine@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={loading}
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="password" className="text-sm font-medium">
                Passwort
              </label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={loading}
                minLength={6}
              />
              {isSignUp && (
                <p className="text-xs text-gray-500">
                  Mindestens 6 Zeichen
                </p>
              )}
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={loading}
            >
              {loading
                ? 'Laden...'
                : isSignUp
                ? 'Account erstellen'
                : 'Einloggen'}
            </Button>

            <div className="text-center text-sm">
              <button
                type="button"
                onClick={() => setIsSignUp(!isSignUp)}
                className="text-indigo-600 hover:text-indigo-500 dark:text-indigo-400"
              >
                {isSignUp
                  ? 'Bereits einen Account? Einloggen'
                  : 'Noch kein Account? Registrieren'}
              </button>
            </div>
          </form>

          <div className="mt-6 pt-6 border-t">
            <p className="text-xs text-gray-500 text-center">
              🔐 Deine Daten sind sicher verschlüsselt
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
