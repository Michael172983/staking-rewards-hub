import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { Toaster } from "@/components/ui/sonner";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { getSuiStakes, type SuiStake } from "@/lib/sui";
import { screenAll } from "@/lib/intercepta";

const CONTRACTS = {
  lido: "0xae7ab96520de3a18e5e111b5eaab095312d7fe84",
  rocketpool: "0xae78736cd615f374d3085123a210448e74fc6393",
  eigenlayer: "0x858646372cc42e1a627fce94aa7a7033e7cf075a",
};

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "YieldReclaim — Recover Your Staking Yield" },
      {
        name: "description",
        content:
          "One-click recovery of accrued staking yield across protocols. Built for ETHGlobal.",
      },
      { property: "og:title", content: "YieldReclaim — Recover Your Staking Yield" },
      {
        property: "og:description",
        content:
          "One-click recovery of accrued staking yield across protocols. Built for ETHGlobal.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Index,
});

type Position = {
  id: string;
  protocol: string;
  asset: string;
  staked: number;
  yieldAccrued: number;
  apy: number;
  claimed: boolean;
};

const INITIAL_POSITIONS: Position[] = [
  { id: "1", protocol: "Lido", asset: "stETH", staked: 4.2, yieldAccrued: 0.0831, apy: 3.2, claimed: false },
  { id: "2", protocol: "Rocket Pool", asset: "rETH", staked: 1.75, yieldAccrued: 0.0412, apy: 2.9, claimed: false },
  { id: "3", protocol: "EigenLayer", asset: "ETH", staked: 2.0, yieldAccrued: 0.0677, apy: 4.1, claimed: false },
];

function randomAddress() {
  const chars = "0123456789abcdef";
  let s = "0x";
  for (let i = 0; i < 40; i++) s += chars[Math.floor(Math.random() * 16)];
  return s;
}

function Index() {
  const [address, setAddress] = useState<string | null>(null);
  const [connecting, setConnecting] = useState(false);
  const [positions, setPositions] = useState<Position[]>(INITIAL_POSITIONS);
  const [harvesting, setHarvesting] = useState<string | null>(null);
  const [suiAddr, setSuiAddr] = useState("");
  const [suiStakes, setSuiStakes] = useState<SuiStake[] | null>(null);
  const [suiLoading, setSuiLoading] = useState(false);

  const totalYield = positions
    .filter((p) => !p.claimed)
    .reduce((sum, p) => sum + p.yieldAccrued, 0);
  const totalStaked = positions.reduce((sum, p) => sum + p.staked, 0);

  const connect = () => {
    setConnecting(true);
    setTimeout(() => {
      setAddress(randomAddress());
      setConnecting(false);
      toast.success("Wallet connected");
    }, 800);
  };

  const harvest = (id: string) => {
    setHarvesting(id);
    setTimeout(() => {
      setPositions((prev) =>
        prev.map((p) => (p.id === id ? { ...p, claimed: true } : p)),
      );
      setHarvesting(null);
      const pos = positions.find((p) => p.id === id);
      toast.success(`Recovered ${pos?.yieldAccrued.toFixed(4)} ETH from ${pos?.protocol}`);
    }, 1200);
  };

  const harvestAll = async () => {
    setHarvesting("all");
    const results = await screenAll(Object.values(CONTRACTS));
    const bad = results.find((r) => r.verdict === "flagged");
    if (bad) {
      setHarvesting(null);
      toast.error(`Intercepta blocked ${bad.address.slice(0, 8)}…: ${bad.reason}`);
      return;
    }
    toast.message(`Intercepta: ${results.length} contracts passed screening ✓`);
    setTimeout(() => {
      setPositions((prev) => prev.map((p) => ({ ...p, claimed: true })));
      setHarvesting(null);
      toast.success(`Recovered ${totalYield.toFixed(4)} ETH total 🎉`);
    }, 1200);
  };

  const loadSui = async () => {
    setSuiLoading(true);
    try {
      const s = await getSuiStakes(suiAddr.trim());
      setSuiStakes(s);
      toast.success(`Loaded ${s.length} Sui stake(s) from mainnet`);
    } catch (e) {
      toast.error(`Sui RPC error: ${(e as Error).message}`);
    } finally {
      setSuiLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Toaster />
      {/* Header */}
      <header className="border-b">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-4">
          <div className="flex items-center gap-2">
            <span className="text-xl">⚡</span>
            <span className="text-lg font-bold tracking-tight">YieldReclaim</span>
            <Badge variant="secondary">ETHGlobal</Badge>
          </div>
          {address ? (
            <Badge variant="outline" className="font-mono">
              {address.slice(0, 6)}…{address.slice(-4)}
            </Badge>
          ) : (
            <Button onClick={connect} disabled={connecting} size="sm">
              {connecting ? "Connecting…" : "Connect Wallet"}
            </Button>
          )}
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-10">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold tracking-tight">
            Recover your staking yield
          </h1>
          <p className="mt-2 text-muted-foreground">
            One click to harvest accrued rewards across all your staking positions.
          </p>
        </div>

        {/* Stats */}
        <div className="mb-6 grid grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Total Staked</CardDescription>
              <CardTitle className="text-2xl">{totalStaked.toFixed(2)} ETH</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Claimable Yield</CardDescription>
              <CardTitle className="text-2xl text-primary">
                {totalYield.toFixed(4)} ETH
              </CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Positions</CardDescription>
              <CardTitle className="text-2xl">{positions.length}</CardTitle>
            </CardHeader>
          </Card>
        </div>

        {/* Positions */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Your Positions</CardTitle>
              <Button
                onClick={harvestAll}
                disabled={!address || totalYield === 0 || harvesting !== null}
              >
                {harvesting === "all" ? "Harvesting…" : "Harvest All"}
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-1">
            {positions.map((p, i) => (
              <div key={p.id}>
                {i > 0 && <Separator className="my-3" />}
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold">{p.protocol}</span>
                      <Badge variant="outline">{p.asset}</Badge>
                      <span className="text-xs text-muted-foreground">
                        APY {p.apy}%
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Staked {p.staked} ETH · Yield{" "}
                      <span className={p.claimed ? "" : "font-medium text-foreground"}>
                        {p.yieldAccrued.toFixed(4)} ETH
                      </span>
                    </p>
                  </div>
                  {p.claimed ? (
                    <Badge variant="secondary">Claimed ✓</Badge>
                  ) : (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => harvest(p.id)}
                      disabled={!address || harvesting !== null}
                    >
                      {harvesting === p.id ? "…" : "Recover"}
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Sui staking (live mainnet)</CardTitle>
            <CardDescription>Reads real stakes via Sui JSON-RPC suix_getStakes.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex gap-2">
              <input
                value={suiAddr}
                onChange={(e) => setSuiAddr(e.target.value)}
                placeholder="0x… Sui address"
                className="flex-1 rounded-md border bg-background px-3 py-2 font-mono text-sm"
              />
              <Button onClick={loadSui} disabled={suiLoading || !suiAddr}>
                {suiLoading ? "…" : "Load"}
              </Button>
            </div>
            {suiStakes?.length === 0 && (
              <p className="text-sm text-muted-foreground">No stakes found.</p>
            )}
            {suiStakes?.map((s, i) => (
              <div key={i} className="flex justify-between rounded-md border p-3 text-sm">
                <span className="font-mono">{s.validator.slice(0, 10)}…</span>
                <span>{s.principal.toFixed(2)} SUI · +{s.reward.toFixed(4)} ({s.status})</span>
              </div>
            ))}
          </CardContent>
        </Card>

        {!address && (
          <p className="mt-4 text-center text-sm text-muted-foreground">
            Connect your wallet to recover yield.
          </p>
        )}

        <footer className="mt-12 text-center text-xs text-muted-foreground">
          Built for ETHGlobal · Demo frontend, no real funds at risk
        </footer>
      </main>
    </div>
  );
}
