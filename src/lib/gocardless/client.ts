/**
 * Cliente GoCardless Bank Account Data (D-009).
 *
 * EXCLUSIVO DE SERVIDOR: usa segredos que nunca podem chegar ao browser.
 * Não importar a partir de componentes cliente.
 *
 * A API é PSD2/AISP: o Despact nunca vê credenciais bancárias — apenas cria
 * uma "requisição", envia o utilizador ao consentimento no site do banco e
 * depois lê contas, saldos e movimentos autorizados.
 */

const BASE_URL = "https://bankaccountdata.gocardless.com/api/v2";

interface AccessToken {
  access: string;
  expiresAtMs: number;
}

let cachedToken: AccessToken | null = null;

function requireCredentials(): { secretId: string; secretKey: string } {
  const secretId = process.env.GOCARDLESS_SECRET_ID;
  const secretKey = process.env.GOCARDLESS_SECRET_KEY;

  if (!secretId || !secretKey) {
    throw new Error(
      "GoCardless não configurado: defina GOCARDLESS_SECRET_ID e GOCARDLESS_SECRET_KEY no ambiente do servidor.",
    );
  }

  return { secretId, secretKey };
}

async function getAccessToken(): Promise<string> {
  if (cachedToken && cachedToken.expiresAtMs > Date.now()) {
    return cachedToken.access;
  }

  const { secretId, secretKey } = requireCredentials();
  const response = await fetch(`${BASE_URL}/token/new/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ secret_id: secretId, secret_key: secretKey }),
  });

  if (!response.ok) {
    throw new Error("Não foi possível autenticar no fornecedor bancário.");
  }

  const data = (await response.json()) as {
    access: string;
    access_expires: number;
  };

  cachedToken = {
    access: data.access,
    // Margem de 60 segundos para evitar usar um token no limite.
    expiresAtMs: Date.now() + (data.access_expires - 60) * 1000,
  };

  return cachedToken.access;
}

async function gcFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const token = await getAccessToken();
  const response = await fetch(`${BASE_URL}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...init?.headers,
    },
    // Dados bancários nunca são cacheados.
    cache: "no-store",
  });

  if (!response.ok) {
    const body = await response.text();
    console.error(`GoCardless ${path} -> ${response.status}: ${body.slice(0, 300)}`);
    throw new Error("O fornecedor bancário devolveu um erro. Tente novamente.");
  }

  return (await response.json()) as T;
}

// --- Instituições -----------------------------------------------------------

export interface Institution {
  id: string;
  name: string;
  logo: string;
}

export async function listInstitutions(
  country = "pt",
): Promise<Institution[]> {
  return gcFetch<Institution[]>(`/institutions/?country=${country}`);
}

// --- Requisições (consentimento) ---------------------------------------------

export interface Requisition {
  id: string;
  link: string;
  status: string;
  accounts: string[];
}

/**
 * Cria a requisição e devolve o link de consentimento no site do banco.
 * `reference` é devolvida no redirect de volta — usamos o id da conexão.
 */
export async function createRequisition(input: {
  institutionId: string;
  redirectUrl: string;
  reference: string;
}): Promise<Requisition> {
  return gcFetch<Requisition>("/requisitions/", {
    method: "POST",
    body: JSON.stringify({
      institution_id: input.institutionId,
      redirect: input.redirectUrl,
      reference: input.reference,
      user_language: "PT",
    }),
  });
}

export async function getRequisition(id: string): Promise<Requisition> {
  return gcFetch<Requisition>(`/requisitions/${id}/`);
}

/** Estado de requisição que significa "contas autorizadas e disponíveis". */
export const REQUISITION_LINKED = "LN";

// --- Contas ------------------------------------------------------------------

export interface ExternalAccountSummary {
  id: string;
  iban: string | null;
  name: string;
  currencyCode: string;
  balanceMinor: number | null;
}

interface AccountDetailsResponse {
  account: {
    iban?: string;
    name?: string;
    ownerName?: string;
    currency?: string;
  };
}

interface BalancesResponse {
  balances: {
    balanceAmount: { amount: string; currency: string };
    balanceType: string;
  }[];
}

/**
 * Converte um decimal do fornecedor ("-12.34") em unidades mínimas inteiras,
 * sem vírgula flutuante (D-001). Devolve null para formatos inesperados.
 */
export function providerAmountToMinorUnits(amount: string): number | null {
  const match = amount.trim().match(/^(-?)(\d+)(?:\.(\d{1,2}))?$/);

  if (!match) {
    return null;
  }

  const sign = match[1] === "-" ? -1 : 1;
  const major = Number.parseInt(match[2], 10);
  const minor = match[3] ? Number.parseInt(match[3].padEnd(2, "0"), 10) : 0;
  const total = major * 100 + minor;

  return Number.isSafeInteger(total) ? sign * total : null;
}

export async function getExternalAccountSummary(
  accountId: string,
): Promise<ExternalAccountSummary> {
  const [details, balances] = await Promise.all([
    gcFetch<AccountDetailsResponse>(`/accounts/${accountId}/details/`),
    gcFetch<BalancesResponse>(`/accounts/${accountId}/balances/`),
  ]);

  // Preferir o saldo contabilístico fechado; caso contrário, o primeiro.
  const balance =
    balances.balances.find((b) =>
      ["closingBooked", "interimBooked", "expected"].includes(b.balanceType),
    ) ?? balances.balances[0];

  return {
    id: accountId,
    iban: details.account.iban ?? null,
    name:
      details.account.name ??
      details.account.ownerName ??
      details.account.iban ??
      "Conta bancária",
    currencyCode:
      details.account.currency ?? balance?.balanceAmount.currency ?? "EUR",
    balanceMinor: balance
      ? providerAmountToMinorUnits(balance.balanceAmount.amount)
      : null,
  };
}

// --- Movimentos ----------------------------------------------------------------

export interface ExternalTransaction {
  externalId: string;
  amountMinor: number;
  currencyCode: string;
  occurredOn: string;
  description: string | null;
}

interface TransactionsResponse {
  transactions: {
    booked: {
      transactionId?: string;
      internalTransactionId?: string;
      bookingDate?: string;
      valueDate?: string;
      transactionAmount: { amount: string; currency: string };
      remittanceInformationUnstructured?: string;
      creditorName?: string;
      debtorName?: string;
    }[];
  };
}

/**
 * Movimentos contabilizados (booked) normalizados. Pendentes ficam de fora:
 * só importamos factos definitivos, para a deduplicação ser estável.
 */
export async function getBookedTransactions(
  accountId: string,
): Promise<ExternalTransaction[]> {
  const data = await gcFetch<TransactionsResponse>(
    `/accounts/${accountId}/transactions/`,
  );

  const normalized: ExternalTransaction[] = [];

  for (const row of data.transactions.booked) {
    const externalId = row.transactionId ?? row.internalTransactionId;
    const occurredOn = row.bookingDate ?? row.valueDate;
    const amountMinor = providerAmountToMinorUnits(
      row.transactionAmount.amount,
    );

    // Sem identificador não há deduplicação; sem data ou montante válido não
    // há movimento. Ignorados de forma determinística.
    if (!externalId || !occurredOn || amountMinor === null || amountMinor === 0) {
      continue;
    }

    normalized.push({
      externalId,
      amountMinor,
      currencyCode: row.transactionAmount.currency,
      occurredOn,
      description:
        row.remittanceInformationUnstructured?.trim() ||
        (amountMinor < 0 ? row.creditorName : row.debtorName)?.trim() ||
        null,
    });
  }

  return normalized;
}
