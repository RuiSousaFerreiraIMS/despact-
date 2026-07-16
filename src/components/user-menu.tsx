"use client";

import { LogOut, Tags } from "lucide-react";
import Link from "next/link";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

/**
 * Menu de perfil do cabeçalho mobile: bola com a inicial do utilizador que
 * abre as opções pessoais — Categorias (fora da barra inferior) e sessão.
 */
export function UserMenu({
  email,
  displayName,
  logout,
}: {
  email: string;
  displayName: string | null;
  logout: () => Promise<void>;
}) {
  const initial = (displayName ?? email).charAt(0).toUpperCase();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label="Menu de perfil"
        className="flex size-9 items-center justify-center rounded-full bg-primary font-display text-sm font-semibold text-primary-foreground outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
      >
        {initial}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="space-y-0.5">
          {displayName ? (
            <p className="text-sm font-medium">{displayName}</p>
          ) : null}
          <p className="truncate text-xs font-normal text-muted-foreground">
            {email}
          </p>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/categories">
            <Tags className="size-4" />
            Categorias
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <form action={logout} className="w-full">
            <button
              type="submit"
              className="flex w-full items-center gap-2 text-left"
            >
              <LogOut className="size-4" />
              Terminar sessão
            </button>
          </form>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
