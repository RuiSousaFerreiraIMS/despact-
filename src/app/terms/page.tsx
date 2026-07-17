import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Termos de Utilização — Despact",
};

/** Termos de utilização públicos (exigidos pelo fornecedor de Open Banking). */
export default function TermsPage() {
  return (
    <main className="mx-auto max-w-2xl space-y-6 px-4 py-12">
      <header className="space-y-1">
        <p className="font-display text-lg font-semibold tracking-tight">
          Despact
        </p>
        <h1 className="font-display text-3xl font-semibold tracking-tight">
          Termos de Utilização
        </h1>
        <p className="text-sm text-muted-foreground">
          Actualizados em 17 de Julho de 2026
        </p>
      </header>

      <section className="space-y-4 text-sm leading-relaxed">
        <h2 className="font-display text-lg font-semibold">O serviço</h2>
        <p>
          O Despact é uma aplicação pessoal de organização financeira, em
          desenvolvimento activo, operada por Rui Ferreira
          (rui.edh.ferreira@gmail.com). O uso é gratuito e por convite durante
          esta fase.
        </p>

        <h2 className="font-display text-lg font-semibold">
          Não é aconselhamento financeiro
        </h2>
        <p>
          Toda a informação apresentada — incluindo os insights — é
          descritiva e calculada exclusivamente a partir dos seus próprios
          dados, com as regras de cálculo visíveis. O Despact não presta
          aconselhamento financeiro, de investimento ou fiscal, e nenhuma
          indicação da aplicação deve ser interpretada como recomendação.
        </p>

        <h2 className="font-display text-lg font-semibold">
          Responsabilidades
        </h2>
        <ul className="list-disc space-y-1 pl-5">
          <li>
            É responsável pela exactidão dos dados que introduz e pelas
            decisões que toma com base neles.
          </li>
          <li>
            A ligação a bancos é opcional, feita com o seu consentimento
            através de um fornecedor licenciado (PSD2), e pode ser revogada em
            qualquer momento.
          </li>
          <li>
            O serviço é fornecido &quot;tal como está&quot;, sem garantias de
            disponibilidade contínua, podendo evoluir ou ser descontinuado
            com aviso razoável.
          </li>
        </ul>

        <h2 className="font-display text-lg font-semibold">Conta e dados</h2>
        <p>
          Pode eliminar a sua conta e todos os dados associados a qualquer
          momento, contactando o endereço acima. Os seus dados são tratados
          conforme a{" "}
          <Link href="/privacy" className="underline underline-offset-4">
            Política de Privacidade
          </Link>
          .
        </p>
      </section>

      <footer className="border-t border-border pt-4 text-sm">
        <Link href="/" className="underline underline-offset-4">
          Voltar ao Despact
        </Link>
      </footer>
    </main>
  );
}
