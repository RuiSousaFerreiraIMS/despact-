import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Privacidade — Despact",
};

/** Política de privacidade pública (exigida pelo fornecedor de Open Banking). */
export default function PrivacyPage() {
  return (
    <main className="mx-auto max-w-2xl space-y-6 px-4 py-12">
      <header className="space-y-1">
        <p className="font-display text-lg font-semibold tracking-tight">
          Despact
        </p>
        <h1 className="font-display text-3xl font-semibold tracking-tight">
          Política de Privacidade
        </h1>
        <p className="text-sm text-muted-foreground">
          Actualizada em 17 de Julho de 2026
        </p>
      </header>

      <section className="space-y-4 text-sm leading-relaxed">
        <p>
          O Despact é uma aplicação pessoal de gestão de finanças, operada por
          Rui Ferreira. Contacto para questões de privacidade e protecção de
          dados: <strong>rui.edh.ferreira@gmail.com</strong>.
        </p>

        <h2 className="font-display text-lg font-semibold">
          Que dados guardamos
        </h2>
        <ul className="list-disc space-y-1 pl-5">
          <li>Dados de conta: endereço de e-mail e nome opcional.</li>
          <li>
            Dados financeiros introduzidos por si: contas, movimentos,
            categorias e objectivos.
          </li>
          <li>
            Dados bancários importados com o seu consentimento explícito,
            através do fornecedor licenciado Enable Banking (PSD2): saldos e
            movimentos das contas que autorizar. O Despact nunca vê nem guarda
            as suas credenciais bancárias; o consentimento expira
            automaticamente (máximo 90 dias) e pode ser revogado em qualquer
            momento na secção Bancos.
          </li>
        </ul>

        <h2 className="font-display text-lg font-semibold">
          Onde e como são guardados
        </h2>
        <p>
          Os dados são guardados na União Europeia, em infra-estrutura
          Supabase (base de dados PostgreSQL) e servidos através da Vercel.
          Cada registo pertence exclusivamente ao utilizador que o criou e
          está isolado por políticas de segurança ao nível da base de dados
          (Row Level Security). As comunicações são cifradas (HTTPS).
        </p>

        <h2 className="font-display text-lg font-semibold">
          O que não fazemos
        </h2>
        <ul className="list-disc space-y-1 pl-5">
          <li>Não vendemos nem partilhamos os seus dados com terceiros.</li>
          <li>Não usamos os seus dados para publicidade.</li>
          <li>
            Não usamos os seus dados financeiros para outro fim que não seja
            apresentar-lhe a sua própria informação.
          </li>
        </ul>

        <h2 className="font-display text-lg font-semibold">Os seus direitos</h2>
        <p>
          Pode pedir acesso, correcção ou eliminação de todos os seus dados a
          qualquer momento através do contacto acima. A revogação de uma
          ligação bancária nunca apaga os movimentos já importados; a
          eliminação da conta remove todos os dados associados.
        </p>

        <h2 className="font-display text-lg font-semibold">Subcontratantes</h2>
        <p>
          Supabase (base de dados e autenticação), Vercel (alojamento) e
          Enable Banking (acesso bancário PSD2, apenas quando liga um banco).
        </p>
      </section>

      <footer className="border-t border-border pt-4 text-sm">
        <Link href="/" className="underline underline-offset-4">
          Voltar ao Despact
        </Link>{" "}
        ·{" "}
        <Link href="/terms" className="underline underline-offset-4">
          Termos de Utilização
        </Link>
      </footer>
    </main>
  );
}
