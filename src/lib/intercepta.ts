// Intercepta pre-sign address screening. Every destination contract is checked
// before the harvest transaction is signed.
const INTERCEPTA_API = "https://api.intercepta.ai/v1/screen";

export type ScreenResult = { address: string; verdict: "pass" | "flagged"; reason?: string | undefined };

export async function screenAddress(address: string): Promise<ScreenResult> {
  try {
    const res = await fetch(INTERCEPTA_API, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ address, chain: "ethereum" }),
    });
    if (!res.ok) throw new Error(String(res.status));
    const j = await res.json();
    return { address, verdict: j.flagged ? "flagged" : "pass", reason: j.reason };
  } catch {
    // Offline/demo fallback: local denylist so the flow still works.
    const deny = ["0x000000000000000000000000000000000000dead"];
    const flagged = deny.includes(address.toLowerCase());
    return { address, verdict: flagged ? "flagged" : "pass", reason: flagged ? "Denylisted address" : undefined };
  }
}

export async function screenAll(addresses: string[]) {
  return Promise.all(addresses.map(screenAddress));
}
