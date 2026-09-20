import type { Metadata } from "next";
import { getSetting } from "@/lib/settings";
import { StoreView, type StoreSearch } from "./StoreView";

export const dynamic = "force-dynamic";
export const generateMetadata = (): Metadata => ({ title: getSetting("store").title });

export default function StorePage({ searchParams }: { searchParams: StoreSearch }) {
  return <StoreView searchParams={searchParams} />;
}
