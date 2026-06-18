import { ShieldCheck } from 'lucide-react';

export default function AuthBrandingPanel({ className = '' }: { className?: string }) {
  return (
    <div className={['relative h-full overflow-hidden rounded-3xl bg-[#1A1A1A]', className].join(' ')}>
      <div className="absolute inset-0 bg-[linear-gradient(to_bottom_right,transparent_0%,rgba(255,255,255,0.06)_100%)]" />
      <div className="relative z-10 flex h-full w-full flex-col justify-between p-12 text-white">
        <div className="space-y-4">
          <ShieldCheck className="size-10" strokeWidth={1.5} />
          <h1 className="font-serif text-2xl font-semibold tracking-tight">Marketplace Admin</h1>
          <p className="text-lg font-medium text-white/80">Supervisez. Moderez. Pilotez la plateforme.</p>
        </div>
        <p className="max-w-md text-sm leading-relaxed text-white/70">
          Connectez-vous pour gerer les vendeurs, les produits, les commandes et les statistiques globales.
        </p>
      </div>
    </div>
  );
}
