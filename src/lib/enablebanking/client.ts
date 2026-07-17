import { createSign } from "node:crypto";

/**
 * Cliente Enable Banking (D-009).
 *
 * EXCLUSIVO DE SERVIDOR: assina cada pedido com a chave privada RSA da
 * aplicação (JWT RS256). Os segredos nunca podem chegar ao browser — não
 * importar a partir de componentes cliente.
 *
 * PSD2/AISP: o Despact nunca vê credenciais bancárias — inicia uma
 * autorização, o utilizador consente no site do banco e depois lemos contas,
 * saldos e movimentos autorizados durante a validade do consentimento.
 */

const BASE_URL = "https://api.enablebanking.com";

/** Validade máxima de consentimento permitida pela PSD2. */
const CONSENT_DAYS = 90;

function requireCredentials(): { appId: string; privateKeyPem: string } {
  const appId = process.env.ENABLE_BANKING_APP_ID;
  const keyBase64 = process.env.ENABLE_BANKING_PRIVATE_KEY_BASE64;

  if (!appId || !keyBase64) {
    throw new Error(
      "Enable Banking não configurado: defina ENABLE_BANKING_APP_ID e ENABLE_BANKING_PRIVATE_KEY_BASE64 no ambiente do servidor.",
    );
  }

  return {
    appId,
    privateKeyPem: Buffer.from(keyBase64, "base64").toString("utf8"),
  };
}

function base64url(input: Buffer | string): string {
  return Buffer.from(input).toString("base64url");
}

/** JWT RS256 de curta duração exigido pela API (kid = Application ID). */
function buildJwt(): string {
  const { appId, privateKeyPem } = requireCredentials();
  const now = Math.floor(Date.now() / 1000);

  const header = base64url(
    JSON.stringify({ typ: "JWT", alg: "RS256", kid: appId }),
  );
  const payload = base64url(
    JSON.stringify({
      iss: "enablebanking.com",
      aud: "api.enablebanking.com",
      iat: now,
      exp: now + 3600,
    }),
  );

  const signer = createSign("RSA-SHA256");
  signer.update(`${header}.${payload}`);
  const signature = signer.sign(privateKeyPem).toString("base64url");

  return `${header}.${payload}.${signature}`;
}

async function ebFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${BASE_URL}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${buildJwt()}`,
      ...init?.headers,
    },
    // Dados bancários nunca são cacheados.
    cache: "no-store",
  });

  if (!response.ok) {
    const body = await response.text();
    console.error(
      `Enable Banking ${path} -> ${response.status}: ${body.slice(0, 300)}`,
    );
    throw new Error("O fornecedor bancário devolveu um erro. Tente novamente.");
  }

  return (await response.json()) as T;
}

// --- Bancos (ASPSPs) ---------------------------------------------------------

export interface Aspsp {
  name: string;
  country: string;
  logo: string | null;
}

interface AspspsResponse {
  aspsps: { name: string; country: string; logo?: string }[];
}

/**
 * Bancos disponíveis. Em sandbox a lista devolvida é a dos simuladores;
 * pedimos primeiro Portugal e, se vazio (caso do sandbox), a lista completa.
 */
export async function listAspsps(country = "PT"): Promise<Aspsp[]> {
  const primary = await ebFetch<AspspsResponse>(`/aspsps?country=${country}`);
  const list =
    primary.aspsps.length > 0
      ? primary.aspsps
      : (await ebFetch<AspspsResponse>("/aspsps")).aspsps;

  return list.map((aspsp) => ({
    name: aspsp.name,
    country: aspsp.country,
    logo: aspsp.logo ?? null,
  }));
}

// --- Autorização (consentimento) ---------------------------------------------

interface StartAuthorizationResponse {
  url: string;
}

/**
 * Inicia a autorização: devolve o URL de consentimento no site do banco.
 * `state` volta intacto no redirect — usamos o id da conexão Despact.
 */
export async function startAuthorization(input: {
  aspspName: string;
  aspspCountry: string;
  redirectUrl: string;
  state: string;
}): Promise<{ url: string; validUntil: string }> {
  const validUntil = new Date(
    Date.now() + CONSENT_DAYS * 24 * 60 * 60 * 1000,
  ).toISOString();

  const data = await ebFetch<StartAuthorizationResponse>("/auth", {
    method: "POST",
    body: JSON.stringify({
      access: { valid_until: validUntil },
      aspsp: { name: input.aspspName, country: input.aspspCountry },
      state: input.state,
      redirect_url: input.redirectUrl,
      psu_type: "personal",
    }),
  });

  return { url: data.url, validUntil };
}

interface CreateSessionResponse {
  session_id: string;
  accounts: { uid: string }[] | string[];
  access: { valid_until: string };
}

/** Troca o `code` do redirect por uma sessão com as contas autorizadas. */
export async function createSession(code: string): Promise<{
  sessionId: string;
  accountUids: string[];
  validUntil: string;
}> {
  const data = await ebFetch<CreateSessionResponse>("/sessions", {
    method: "POST",
    body: JSON.stringify({ code }),
  });

  const accountUids = data.accounts.map((account) =>
    typeof account === "string" ? account : account.uid,
  );

  return {
    sessionId: data.session_id,
    accountUids,
    validUntil: data.access.valid_until,
  };
}

interface GetSessionResponse {
  accounts: string[];
  status: string;
}

export async function getSession(sessionId: string): Promise<{
  accountUids: string[];
  status: string;
}> {
  const data = await ebFetch<GetSessionResponse>(`/sessions/${sessionId}`);
  return { accountUids: data.accounts, status: data.status };
}

// --- Contas -------------------------------------------------------------------

export interface ExternalAccountSummary {
  uid: string;
  iban: string | null;
  name: string;
  currencyCode: string;
  balanceMinor: number | null;
}

interface AccountDetailsResponse {
  account_id?: { iban?: string };
  name?: string;
  product?: string;
  currency?: string;
}

interface BalancesResponse {
  balances: {
    balance_amount: { currency: string; amount: string };
    balance_type: string;
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
  uid: string,
): Promise<ExternalAccountSummary> {
  const [details, balances] = await Promise.all([
    ebFetch<AccountDetailsResponse>(`/accounts/${uid}/details`),
    ebFetch<BalancesResponse>(`/accounts/${uid}/balances`),
  ]);

  // Preferir o saldo contabilístico; caso contrário, o primeiro disponível.
  const balance =
    balances.balances.find((b) =>
      ["CLBD", "XPCD", "ITBD"].includes(b.balance_type),
    ) ?? balances.balances[0];

  return {
    uid,
    iban: details.account_id?.iban ?? null,
    name:
      details.name ??
      details.product ??
      details.account_id?.iban ??
      "Conta bancária",
    currencyCode:
      details.currency ?? balance?.balance_amount.currency ?? "EUR",
    balanceMinor: balance
      ? providerAmountToMinorUnits(balance.balance_amount.amount)
      : null,
  };
}

// --- Movimentos ----------------------------------------------------------------

export interface ExternalTransaction {
  externalId: string;
  /** Assinado: positivo entra, negativo sai (derivado de credit/debit). */
  amountMinor: number;
  currencyCode: string;
  occurredOn: string;
  description: string | null;
}

interface TransactionsResponse {
  transactions: {
    entry_reference?: string | null;
    transaction_amount: { currency: string; amount: string };
    credit_debit_indicator: "CRDT" | "DBIT";
    status?: string;
    booking_date?: string | null;
    value_date?: string | null;
    remittance_information?: string[] | null;
    creditor?: { name?: string } | null;
    debtor?: { name?: string } | null;
  }[];
  continuation_key?: string | null;
}

const MAX_PAGES = 10;

/**
 * Movimentos contabilizados (BOOK) normalizados, com paginação. Pendentes e
 * movimentos sem identificador/data/montante válidos são ignorados de forma
 * determinística — só importamos factos finais e deduplicáveis.
 */
export async function getBookedTransactions(
  uid: string,
): Promise<ExternalTransaction[]> {
  const normalized: ExternalTransaction[] = [];
  let continuationKey: string | null | undefined;

  for (let page = 0; page < MAX_PAGES; page++) {
    const query = continuationKey
      ? `?continuation_key=${encodeURIComponent(continuationKey)}`
      : "";
    const data = await ebFetch<TransactionsResponse>(
      `/accounts/${uid}/transactions${query}`,
    );

    for (const row of data.transactions) {
      const occurredOn = row.booking_date ?? row.value_date;
      const magnitude = providerAmountToMinorUnits(
        row.transaction_amount.amount,
      );

      if (
        !row.entry_reference ||
        !occurredOn ||
        magnitude === null ||
        magnitude === 0 ||
        (row.status && row.status !== "BOOK")
      ) {
        continue;
      }

      const amountMinor =
        row.credit_debit_indicator === "DBIT"
          ? -Math.abs(magnitude)
          : Math.abs(magnitude);

      normalized.push({
        externalId: row.entry_reference,
        amountMinor,
        currencyCode: row.transaction_amount.currency,
        occurredOn,
        description:
          row.remittance_information?.join(" ").trim() ||
          (amountMinor < 0 ? row.creditor?.name : row.debtor?.name)?.trim() ||
          null,
      });
    }

    continuationKey = data.continuation_key;
    if (!continuationKey) {
      break;
    }
  }

  return normalized;
}
