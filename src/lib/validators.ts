import { z } from "zod";
import { BLOCK_TYPES, CART_ICONS, DEFAULT_LABELS, FONT_NAMES, PRESET_KEYS, SECTION_TYPES, SOCIAL_ICONS, THEME_PRESETS, CURRENCIES, type BlockType, type SectionType } from "./constants";
import { cleanHtml } from "./sanitize";

// ---------- primitives ----------
const str = (max: number, def = "") => z.string().max(max).default(def);
const hex = (def: string) => z.string().regex(/^#[0-9a-fA-F]{6}$/, "Use a hex colour like #FCD05C").default(def);
const hexOrEmpty = z.string().regex(/^(#[0-9a-fA-F]{6})?$/, "Use a hex colour like #FCD05C").default("");
/** Links may only be http(s), root-relative, anchors or mailto: (blocks javascript: and data: URLs). */
const link = z.string().max(2000).refine((v) => v === "" || /^(https?:\/\/|\/(?!\/)|#|mailto:)/i.test(v), "Use https://..., a path starting with /, or mailto:").default("");
const image = z.string().max(2000).refine((v) => v === "" || /^(\/media\/[\w.-]+|https?:\/\/)/i.test(v), "Use an uploaded image or an https:// URL").default("");
const bool = (def: boolean) => z.boolean().default(def);
const num = (min: number, max: number, def: number) => z.coerce.number().min(min).max(max).default(def);
const html = z.string().max(60000).default("").transform(cleanHtml);
const uid = z.string().min(1).max(40).default(() => Math.random().toString(36).slice(2, 10));

// ---------- settings ----------
export const BrandingSchema = z.object({
  storeName: str(80, "My Server Store"),
  description: str(400, "The official store of our Minecraft server."),
  logo: image,
  favicon: image,
  browserTitle: str(120, ""),
  fontHeading: z.enum(FONT_NAMES).default("Bricolage Grotesque"),
  fontBody: z.enum(FONT_NAMES).default("Figtree"),
  radius: num(0, 24, 4),
  buttonStyle: z.enum(["bevel", "solid", "outline", "soft"]).default("bevel"),
});

export const ThemeSchema = z.object({
  preset: z.enum([...PRESET_KEYS, "custom"]).default("dark"),
  primary: hex(THEME_PRESETS.dark.primary),
  secondary: hex(THEME_PRESETS.dark.secondary),
  background: hex(THEME_PRESETS.dark.background),
  card: hex(THEME_PRESETS.dark.card),
  text: hex(THEME_PRESETS.dark.text),
  muted: hex(THEME_PRESETS.dark.muted),
  border: hex(THEME_PRESETS.dark.border),
  buttonBg: hex(THEME_PRESETS.dark.buttonBg),
  buttonText: hex(THEME_PRESETS.dark.buttonText),
  navBg: hex(THEME_PRESETS.dark.navBg),
  footerBg: hex(THEME_PRESETS.dark.footerBg),
});

export const StoreSchema = z.object({
  title: str(120, "Store"),
  currencyDisplay: z.enum(["symbol", "code"]).default("symbol"),
  productsPerPage: num(4, 60, 12),
  defaultSort: z.enum(["featured", "price-asc", "price-desc", "name"]).default("featured"),
  productStyle: z.enum(["grid", "list"]).default("grid"),
  showDiscounts: bool(true),
  showOriginalPrice: bool(true),
  showBadges: bool(true),
  enableSearch: bool(true),
  enableProductDetails: bool(true),
  checkoutBehavior: z.enum(["redirect"]).default("redirect"),
});

export const CartSchema = z.object({
  enabled: bool(true),
  icon: z.enum(CART_ICONS).default("bag"),
  title: str(60, "Your cart"),
  emptyMessage: str(200, "Your cart is empty."),
  checkoutText: str(60, "Go to checkout"),
});

export const ServerSchema = z.object({
  ip: str(120, "play.example.com"),
  port: num(1, 65535, 25565),
  edition: z.enum(["java", "bedrock"]).default("java"),
  statusApi: z.enum(["mcstatus", "mcsrvstat", "custom"]).default("mcstatus"),
  customApiUrl: str(500, ""),
  showStatus: bool(true),
  showPlayers: bool(true),
});

export const DiscordSchema = z.object({
  enabled: bool(true),
  url: link,
  invite: str(120, ""),
  buttonText: str(60, "Join our Discord"),
  sectionTitle: str(120, "Join the community"),
  sectionDescription: str(500, "Get help, find players and hear about updates."),
});

export const SeoSchema = z.object({
  title: str(120, ""),
  description: str(300, ""),
  ogTitle: str(120, ""),
  ogDescription: str(300, ""),
  ogImage: image,
  robotsIndex: bool(true),
  robotsFollow: bool(true),
});

const FooterLink = z.object({ label: str(80, "Link"), url: link });
export const FooterSchema = z.object({
  title: str(80, ""),
  description: str(400, ""),
  columns: z.array(z.object({ title: str(80, "Column"), links: z.array(FooterLink).max(20).default([]) })).max(6).default([]),
  legalLinks: z.array(FooterLink).max(10).default([]),
  copyright: str(200, ""),
  showSocial: bool(true),
  showDiscord: bool(true),
  showServerIp: bool(true),
});

export const SocialSchema = z.object({
  links: z
    .array(z.object({ name: str(60, "Link"), url: link, icon: z.enum(SOCIAL_ICONS).default("link"), enabled: bool(true) }))
    .max(20)
    .default([]),
});

const NavChild = z.object({ label: str(60, "Item"), url: link, enabled: bool(true) });
export const NavigationSchema = z.object({
  items: z.array(z.object({ label: str(60, "Item"), url: link, enabled: bool(true), children: z.array(NavChild).max(12).default([]) })).max(12).default([]),
});

export const FaqSchema = z.object({
  title: str(120, "Frequently asked questions"),
  intro: str(500, ""),
  items: z.array(z.object({ question: str(300, "Question"), answer: html, enabled: bool(true) })).max(100).default([]),
});

export const SiteSchema = z.object({
  siteUrl: z.string().max(300).refine((v) => v === "" || /^https?:\/\/[^\s/]+\/?$/i.test(v), "Use a full address like https://store.example.com").default(""),
  timezone: str(60, "Europe/Amsterdam"),
  currency: z.enum(CURRENCIES).default("EUR"),
  setupComplete: bool(false),
});

export const TebexSchema = z.object({
  publicToken: str(200, ""),
  privateKeyEnc: str(2000, ""),
  secretKeyEnc: str(2000, ""),
  connected: bool(false),
  storeName: str(200, ""),
  lastTestAt: str(40, ""),
  lastTestOk: bool(false),
  lastError: str(300, ""),
});

const labelShape = Object.fromEntries(Object.entries(DEFAULT_LABELS).map(([k, v]) => [k, str(300, v)])) as Record<keyof typeof DEFAULT_LABELS, z.ZodDefault<z.ZodString>>;
export const LabelsSchema = z.object(labelShape);

// ---------- homepage sections ----------
const style = {
  background: hexOrEmpty,
  backgroundImage: image,
  overlay: num(0, 90, 55),
  align: z.enum(["left", "center", "right"]).default("left"),
  paddingY: z.enum(["sm", "md", "lg"]).default("md"),
  textColor: hexOrEmpty,
};

export const SECTION_CONFIG = {
  hero: z.object({ ...style, heading: str(160, "Welcome to our store"), subtitle: str(400, "Ranks, crates and perks that keep the server running."), logo: image, button1Text: str(60, "Browse the store"), button1Url: link.default("/store"), button2Text: str(60, ""), button2Url: link, showServerIp: bool(true), showPlayerCount: bool(true), height: z.enum(["md", "lg", "full"]).default("lg") }),
  featuredProducts: z.object({ ...style, title: str(120, "Featured"), subtitle: str(300, ""), count: num(1, 12, 4) }),
  categories: z.object({ ...style, title: str(120, "Shop by category"), subtitle: str(300, "") }),
  serverStatus: z.object({ ...style, title: str(120, "Server status"), description: str(300, "") }),
  discord: z.object({ ...style }),
  promoBanner: z.object({ ...style, text: str(300, "Limited-time offer"), buttonText: str(60, ""), buttonUrl: link }),
  imageBanner: z.object({ ...style, image, alt: str(200, ""), link, height: z.enum(["sm", "md", "lg"]).default("md") }),
  text: z.object({ ...style, title: str(160, ""), body: html }),
  faq: z.object({ ...style, title: str(120, ""), limit: num(0, 50, 0) }),
  testimonials: z.object({ ...style, title: str(120, "What players say"), items: z.array(z.object({ name: str(80, "Player"), role: str(80, ""), quote: str(600, ""), avatar: image })).max(12).default([]) }),
  customHtml: z.object({ ...style, html }),
} satisfies Record<SectionType, z.ZodTypeAny>;

export type SectionConfig<T extends SectionType> = z.infer<(typeof SECTION_CONFIG)[T]>;
export type Section = { id: string; type: SectionType; enabled: boolean; config: Record<string, unknown> };

const SectionShell = z.object({ id: uid, type: z.enum(SECTION_TYPES), enabled: bool(true), config: z.record(z.unknown()).default({}) });

export const HomeSchema = z
  .object({ sections: z.array(SectionShell).max(40).default([]) })
  .transform((v) => ({
    sections: v.sections.map((s) => ({ ...s, config: SECTION_CONFIG[s.type].parse(s.config) as Record<string, unknown> })),
  }));
export type HomeLayout = z.infer<typeof HomeSchema>;

// ---------- page blocks ----------
export const BLOCK_PROPS = {
  heading: z.object({ text: str(200, "Heading"), level: z.enum(["h2", "h3", "h4"]).default("h2"), align: z.enum(["left", "center", "right"]).default("left") }),
  text: z.object({ html }),
  image: z.object({ src: image, alt: str(200, ""), caption: str(300, ""), width: z.enum(["narrow", "wide", "full"]).default("wide") }),
  button: z.object({ text: str(80, "Button"), url: link, variant: z.enum(["primary", "ghost"]).default("primary"), align: z.enum(["left", "center", "right"]).default("left") }),
  divider: z.object({}),
  spacer: z.object({ size: z.enum(["sm", "md", "lg"]).default("md") }),
  html: z.object({ html }),
} satisfies Record<BlockType, z.ZodTypeAny>;

const BlockShell = z.object({ id: uid, type: z.enum(BLOCK_TYPES), props: z.record(z.unknown()).default({}) });
export const PageContentSchema = z
  .object({ title: str(160, "Untitled page"), blocks: z.array(BlockShell).max(200).default([]), seoTitle: str(160, ""), seoDescription: str(320, "") })
  .transform((v) => ({ ...v, blocks: v.blocks.map((b) => ({ ...b, props: BLOCK_PROPS[b.type].parse(b.props) as Record<string, unknown> })) }));
export type PageContent = z.infer<typeof PageContentSchema>;
export type Block = PageContent["blocks"][number];

// ---------- registry ----------
export const SCHEMAS = {
  branding: BrandingSchema,
  theme: ThemeSchema,
  store: StoreSchema,
  cart: CartSchema,
  server: ServerSchema,
  discord: DiscordSchema,
  seo: SeoSchema,
  footer: FooterSchema,
  social: SocialSchema,
  navigation: NavigationSchema,
  faq: FaqSchema,
  site: SiteSchema,
  tebex: TebexSchema,
  labels: LabelsSchema,
  "home.draft": HomeSchema,
  "home.published": HomeSchema,
} as const;

export type SettingKey = keyof typeof SCHEMAS;
export type SettingValue<K extends SettingKey> = z.output<(typeof SCHEMAS)[K]>;
