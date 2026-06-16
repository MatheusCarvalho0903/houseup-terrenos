import type { Metadata } from "next";
import { Suspense } from "react";
import { LoginForm } from "./LoginForm";

export const metadata: Metadata = {
  title: "Entrar | HouseUp Banco de Terrenos",
};

export default function LoginPage() {
  return (
    <div className="relative flex min-h-screen flex-1 items-center justify-center overflow-hidden bg-navy-900 px-4">
      {/* Camadas decorativas sutis para dar profundidade ao fundo navy */}
      <div className="pointer-events-none absolute -left-32 -top-32 h-96 w-96 rounded-full bg-brand/20 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-40 -right-20 h-[28rem] w-[28rem] rounded-full bg-brand-light/10 blur-3xl" />

      <div className="relative w-full max-w-md animate-fade-in">
        <div className="mb-10 flex flex-col items-center gap-3">
          <div className="flex items-center gap-3">
            <svg width="44" height="44" viewBox="0 0 38 38" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect width="38" height="38" rx="10" fill="#FFFFFF" />
              <path d="M19 9L29 17.5V29H23V21H15V29H9V17.5L19 9Z" fill="#1A2E4A" />
              <path d="M19 9L29 17.5L26.5 19.6L19 13.3L11.5 19.6L9 17.5L19 9Z" fill="#4FA3E0" />
            </svg>
            <span className="text-2xl font-bold tracking-tight text-white">
              House<span className="text-brand-light">Up</span>
            </span>
          </div>
          <span className="text-xs font-medium uppercase tracking-[0.2em] text-white/50">
            Banco de Terrenos
          </span>
        </div>

        <div className="rounded-2xl bg-white p-8 shadow-2xl sm:p-10">
          <h1 className="text-xl font-semibold text-navy-900">Acesse sua conta</h1>
          <p className="mt-1 text-sm text-ink-secondary">
            Use o email e senha cadastrados pela HouseUp.
          </p>

          <Suspense fallback={null}>
            <LoginForm />
          </Suspense>
        </div>

        <p className="mt-8 text-center text-xs text-white/40">
          Acesso restrito a colaboradores e corretores parceiros convidados pela HouseUp Construtora.
        </p>
      </div>
    </div>
  );
}
