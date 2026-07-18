"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef } from "react";

import { syncStaleBankLinks } from "./auto-sync";

/**
 * Dispara a sincronização automática das contas bancárias quando a app abre.
 *
 * Renderizado no layout autenticado: corre uma vez por carregamento completo
 * (não em navegações suaves). Se algo for importado, actualiza a interface.
 * Silencioso e não bloqueante — a página já está interactiva.
 */
export function BankAutoSync() {
  const router = useRouter();
  const started = useRef(false);

  useEffect(() => {
    if (started.current) {
      return;
    }
    started.current = true;

    syncStaleBankLinks()
      .then((result) => {
        if (result.imported > 0) {
          router.refresh();
        }
      })
      .catch(() => {
        // Sincronização automática é best-effort; erros ficam para o sync manual.
      });
  }, [router]);

  return null;
}
