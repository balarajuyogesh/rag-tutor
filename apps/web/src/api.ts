export interface AskResponse {
  answer: string;
}

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "/api";

export async function askTutor(question: string, signal?: AbortSignal) {
  const response = await fetch(`${API_BASE_URL}/rag/ask`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ question }),
    signal,
  });

  if (!response.ok) {
    const payload = (await response.json().catch(() => null)) as
      | { detail?: string }
      | null;
    throw new Error(payload?.detail ?? `The tutor returned ${response.status}.`);
  }

  return (await response.json()) as AskResponse;
}
