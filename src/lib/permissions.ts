import type { Role } from "./constants";
import type { SettingKey } from "./validators";

export type Capability = "content" | "store" | "integrations" | "system";

const ROLE_CAPS: Record<Role, Capability[]> = {
  owner: ["content", "store", "integrations", "system"],
  admin: ["content", "store", "integrations"],
  editor: ["content"],
};

export const can = (role: Role, cap: Capability): boolean => ROLE_CAPS[role].includes(cap);

export const SETTING_CAP: Record<SettingKey, Capability> = {
  branding: "content",
  theme: "content",
  server: "content",
  discord: "content",
  seo: "content",
  footer: "content",
  social: "content",
  navigation: "content",
  faq: "content",
  "home.draft": "content",
  "home.published": "content",
  store: "store",
  cart: "store",
  labels: "store",
  tebex: "integrations",
  site: "system",
};
