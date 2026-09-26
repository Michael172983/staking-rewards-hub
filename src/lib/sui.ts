// Real Sui mainnet staking reader via public JSON-RPC (suix_getStakes).
const SUI_RPC = "https://fullnode.mainnet.sui.io:443";

export type SuiStake = {
  validator: string;
  principal: number; // SUI
  reward: number; // SUI
  status: string;
};

export async function getSuiStakes(owner: string): Promise<SuiStake[]> {
  const res = await fetch(SUI_RPC, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ jsonrpc: "2.0", id: 1, method: "suix_getStakes", params: [owner] }),
  });
  const json = await res.json();
  if (json.error) throw new Error(json.error.message);
  const out: SuiStake[] = [];
  for (const v of json.result ?? []) {
    for (const s of v.stakes ?? []) {
      out.push({
        validator: v.validatorAddress,
        principal: Number(s.principal) / 1e9,
        reward: Number(s.estimatedReward ?? 0) / 1e9,
        status: s.status,
      });
    }
  }
  return out;
}
