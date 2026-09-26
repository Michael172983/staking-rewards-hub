// Real Sui mainnet staking reader via the official Sui GraphQL endpoint.
// Queries all 0x3::staking_pool::StakedSui objects owned by an address.
const SUI_GRAPHQL = "https://graphql.mainnet.sui.io/graphql";

export type SuiStake = {
  validator: string; // staking pool id
  principal: number; // SUI
  reward: number; // not exposed on-object; 0 here
  status: string;
};

const QUERY = `query($owner: SuiAddress!) {
  objects(first: 50, filter: { owner: $owner, type: "0x3::staking_pool::StakedSui" }) {
    nodes { asMoveObject { contents { json } } }
  }
}`;

export async function getSuiStakes(owner: string): Promise<SuiStake[]> {
  const res = await fetch(SUI_GRAPHQL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query: QUERY, variables: { owner } }),
  });
  const json = await res.json();
  if (json.errors?.length) throw new Error(json.errors[0].message);
  return (json.data?.objects?.nodes ?? []).map((n: any) => {
    const c = n.asMoveObject.contents.json;
    return {
      validator: c.pool_id,
      principal: Number(c.principal) / 1e9,
      reward: 0,
      status: `epoch ${c.stake_activation_epoch}`,
    };
  });
}
