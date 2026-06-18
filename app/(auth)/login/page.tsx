'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AlertCircle, Eye, EyeOff, Loader2 } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

export default function LoginPage() {
  const { login, admin, isLoading } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isLoading && admin) router.replace('/dashboard');
  }, [isLoading, admin, router]);

  const inputClass =
    'w-full border border-[#D5D5D5] rounded-sm px-4 py-3 text-sm text-[#1A1A1A] outline-none transition-colors focus:border-black';

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    setError(null);
    try {
      await login(email.trim(), password);
      router.push('/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur de connexion');
    } finally {
      setSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="size-6 animate-spin text-[#1A1A1A]" />
      </div>
    );
  }

  return (
    <div className="mx-auto flex w-full flex-col justify-center space-y-8">
      <div className="space-y-3 text-center">
        <h1 className="font-serif text-3xl font-semibold tracking-tight text-[#1A1A1A]">Marketplace</h1>
        <p className="mx-auto max-w-[300px] text-sm text-[#777]">Connectez-vous a votre espace admin</p>
      </div>
      <form onSubmit={onSubmit} className="space-y-5">
        <div>
          <label htmlFor="email" className="mb-1.5 block text-sm text-[#333]">Adresse email</label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={inputClass}
            autoComplete="email"
            required
          />
        </div>
        <div className="relative">
          <label htmlFor="password" className="mb-1.5 block text-sm text-[#333]">Mot de passe</label>
          <input
            id="password"
            type={showPassword ? 'text' : 'password'}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={`${inputClass} pr-10`}
            autoComplete="current-password"
            required
          />
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            className="absolute right-3 top-[42px] text-[#999] hover:text-[#1A1A1A]"
          >
            {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        </div>
        <button
          type="submit"
          disabled={submitting || !email.trim() || !password}
          className={`flex w-full items-center justify-center gap-2 py-3 text-sm font-semibold ${
            submitting || !email.trim() || !password
              ? 'cursor-not-allowed bg-[#CCCCCC] text-white'
              : 'bg-black text-white hover:bg-[#333]'
          }`}
        >
          {submitting && <Loader2 size={16} className="animate-spin" />}
          Se connecter
        </button>
        {error && (
          <div className="flex items-start gap-2 rounded-sm border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            <AlertCircle size={16} className="mt-0.5 shrink-0" />
            <span>{error}</span>
          </div>
        )}
      </form>
    </div>
  );
}
