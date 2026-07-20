"use client";

import { Loader2 } from "lucide-react";
import { useFormStatus } from "react-dom";

import { Button } from "@/components/ui/button";

type ButtonProps = React.ComponentProps<typeof Button>;

/**
 * Botão de submissão com estado de espera: enquanto a Server Action do
 * formulário decorre, mostra um spinner e (opcionalmente) uma etiqueta de
 * progresso, evitando a sensação de "nada aconteceu". Tem de estar dentro
 * do <form> cuja submissão acompanha.
 */
export function SubmitButton({
  children,
  pendingLabel,
  icon,
  ...props
}: ButtonProps & { pendingLabel?: string; icon?: React.ReactNode }) {
  const { pending } = useFormStatus();

  return (
    <Button type="submit" disabled={pending} aria-busy={pending} {...props}>
      {pending ? (
        <>
          <Loader2 className="animate-spin" data-icon="inline-start" />
          {pendingLabel ?? children}
        </>
      ) : (
        <>
          {icon}
          {children}
        </>
      )}
    </Button>
  );
}
