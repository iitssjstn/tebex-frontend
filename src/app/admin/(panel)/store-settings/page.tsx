import { SettingsForm } from "@/components/admin/SettingsForm";
import { requireUser } from "@/lib/auth";
import { CART_FIELDS, LABEL_FIELDS, STORE_FIELDS } from "@/lib/fields";
import { getSetting } from "@/lib/settings";

export const metadata = { title: "Store settings" };

export default function StoreSettingsPage() {
  requireUser("store");
  return (
    <>
      <h1>Store settings</h1>
      <p className="lead">How products are listed, how the cart behaves, and the wording of buttons and messages across the store.</p>
      <h2>Product listing</h2>
      <SettingsForm settingKey="store" initial={getSetting("store") as unknown as Record<string, unknown>} fields={STORE_FIELDS} />
      <h2 style={{ marginTop: "2rem" }}>Cart</h2>
      <SettingsForm settingKey="cart" initial={getSetting("cart") as unknown as Record<string, unknown>} fields={CART_FIELDS} />
      <h2 style={{ marginTop: "2rem" }}>Interface texts</h2>
      <SettingsForm settingKey="labels" initial={getSetting("labels") as unknown as Record<string, unknown>} fields={LABEL_FIELDS} />
    </>
  );
}
