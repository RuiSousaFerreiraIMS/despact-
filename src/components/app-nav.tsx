"use client";

import {
  ArrowLeftRight,
  Landmark,
  LayoutDashboard,
  Plus,
  Tags,
  Target,
  Wallet,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "/", label: "Início", icon: LayoutDashboard, exact: true },
  { href: "/accounts", label: "Contas", icon: Wallet },
  { href: "/transactions", label: "Movimentos", icon: ArrowLeftRight },
  { href: "/categories", label: "Categorias", icon: Tags },
  { href: "/goals", label: "Objectivos", icon: Target },
  { href: "/banks", label: "Bancos", icon: Landmark },
] as const;

function isActive(pathname: string, href: string, exact?: boolean): boolean {
  if (exact) {
    return pathname === href;
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}

/** Navegação lateral (desktop). Renderizada dentro da sidebar escura. */
export function SidebarNav() {
  const pathname = usePathname();

  return (
    <nav className="flex flex-col gap-1 px-3" aria-label="Navegação principal">
      {NAV_ITEMS.map((item) => {
        const active = isActive(pathname, item.href, "exact" in item);
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
              active
                ? "bg-sidebar-accent text-sidebar-accent-foreground"
                : "text-sidebar-foreground/70 hover:bg-sidebar-accent/60 hover:text-sidebar-foreground",
            )}
          >
            <Icon
              className={cn("size-4.5", active && "text-sidebar-primary")}
              strokeWidth={2}
            />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

/**
 * Barra de separadores (mobile): 4 destinos + acção central destacada para
 * registar um movimento — o gesto mais frequente da aplicação.
 */
export function BottomNav() {
  const pathname = usePathname();
  const [home, accounts, transactions, , goals] = NAV_ITEMS;
  const left = [home, accounts];
  const right = [transactions, goals];

  const renderTab = (item: (typeof NAV_ITEMS)[number]) => {
    const active = isActive(pathname, item.href, "exact" in item);
    const Icon = item.icon;
    return (
      <Link
        key={item.href}
        href={item.href}
        aria-current={active ? "page" : undefined}
        className={cn(
          "flex min-w-0 flex-1 flex-col items-center gap-1 py-2 text-[11px] font-medium",
          active ? "text-foreground" : "text-muted-foreground",
        )}
      >
        <Icon
          className={cn("size-5", active && "text-success")}
          strokeWidth={active ? 2.4 : 2}
        />
        <span className="truncate">{item.label}</span>
      </Link>
    );
  };

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-card/95 backdrop-blur md:hidden"
      aria-label="Navegação principal"
    >
      <div className="mx-auto flex max-w-md items-stretch px-2 pb-[env(safe-area-inset-bottom)]">
        {left.map(renderTab)}
        <div className="flex flex-1 items-center justify-center">
          <Link
            href="/transactions/new"
            aria-label="Nova transacção"
            className="-mt-5 flex size-13 items-center justify-center rounded-full bg-success text-success-foreground shadow-lg shadow-success/30 transition-transform active:scale-95"
          >
            <Plus className="size-6" strokeWidth={2.4} />
          </Link>
        </div>
        {right.map(renderTab)}
      </div>
    </nav>
  );
}
