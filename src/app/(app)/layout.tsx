import { LogOut } from "lucide-react";
import { redirect } from "next/navigation";

import { BottomNav, SidebarNav } from "@/components/app-nav";
import { UserMenu } from "@/components/user-menu";
import { BankAutoSync } from "@/features/bank/bank-auto-sync";
import { createClient } from "@/lib/supabase/server";

import { logout } from "./actions";

/**
 * Shell da área autenticada.
 *
 * Desktop: sidebar fixa em tinta escura (assinatura visual do Despact) com
 * navegação e sessão. Mobile: cabeçalho compacto e barra de separadores em
 * baixo com acção central de novo movimento — a app móvel não é o desktop
 * encolhido.
 */
export default async function AppLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name")
    .eq("id", user.id)
    .maybeSingle();

  return (
    <div className="min-h-screen md:flex">
      <a
        href="#conteudo"
        className="sr-only rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50"
      >
        Saltar para o conteúdo
      </a>

      {/* Sidebar — desktop */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-60 flex-col bg-sidebar text-sidebar-foreground md:flex">
        <div className="px-6 py-6">
          <p className="font-display text-xl font-semibold tracking-tight">
            Despact
          </p>
          <p className="mt-0.5 text-xs text-sidebar-foreground/50">
            Finanças com decisão
          </p>
        </div>
        <SidebarNav />
        <div className="mt-auto border-t border-sidebar-border px-6 py-4">
          <p className="truncate text-xs text-sidebar-foreground/60">
            {user.email}
          </p>
          <form action={logout} className="mt-2">
            <button
              type="submit"
              className="flex items-center gap-2 text-sm text-sidebar-foreground/70 transition-colors hover:text-sidebar-foreground"
            >
              <LogOut className="size-4" />
              Terminar sessão
            </button>
          </form>
        </div>
      </aside>

      {/* Cabeçalho — mobile */}
      <header className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur md:hidden">
        <div className="flex items-center justify-between px-4 py-2.5">
          <p className="font-display text-lg font-semibold tracking-tight">
            Despact
          </p>
          <UserMenu
            email={user.email ?? ""}
            displayName={profile?.display_name ?? null}
            logout={logout}
          />
        </div>
      </header>

      {/* Conteúdo */}
      <div className="min-w-0 flex-1 md:pl-60">
        <div
          id="conteudo"
          className="mx-auto w-full max-w-5xl px-4 pb-24 pt-6 md:px-8 md:pb-10 md:pt-8"
        >
          {children}
        </div>
      </div>

      <BottomNav />
      <BankAutoSync />
    </div>
  );
}
