export interface AskResponse {
  answer: string;
}

export interface LibraryDocument {
  document_id: string;
  source: string;
  title: string;
  page_count: number;
  chunks_stored: number;
  size_bytes: number;
  created_at: string;
  updated_at: string;
}

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "/api";

async function responseError(response: Response, fallback: string) {
  const payload = (await response.json().catch(() => null)) as
    | { detail?: string }
    | null;
  return new Error(payload?.detail ?? fallback);
}

export async function askTutor(
  question: string,
  documentIds: string[],
  signal?: AbortSignal,
) {
  const response = await fetch(`${API_BASE_URL}/rag/ask`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      question,
      document_ids: documentIds.length ? documentIds : undefined,
    }),
    signal,
  });

  if (!response.ok) {
    throw await responseError(response, `The tutor returned ${response.status}.`);
  }

  return (await response.json()) as AskResponse;
}

export async function getDocuments(signal?: AbortSignal) {
  const response = await fetch(`${API_BASE_URL}/rag/documents`, { signal });
  if (!response.ok) {
    throw await responseError(
      response,
      `The library returned ${response.status}.`,
    );
  }
  return (await response.json()) as LibraryDocument[];
}
