"use client";

import { useEffect } from "react";
import { useCart } from "@/components/public/cart";

/** The order is finished, so the basket cookie is dropped and the next visit starts with an empty cart. */
export function ClearCart() {
  const { clear } = useCart();
  useEffect(() => {
    void clear();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return null;
}
