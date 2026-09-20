// Client-safe constants shared by the public site, the admin panel and the validators.

export const THEME_PRESETS = {
  dark: { label: "Dark (Ember)", primary: "#FCD05C", secondary: "#FF6B35", background: "#110D0B", card: "#1A1411", text: "#F4ECE2", muted: "#A8998A", border: "#34291F", buttonBg: "#FCD05C", buttonText: "#1A1006", navBg: "#0D0A08", footerBg: "#0D0A08" },
  purple: { label: "Purple", primary: "#B78CFF", secondary: "#FF7AC6", background: "#0F0B16", card: "#171122", text: "#F1EBFA", muted: "#A197B5", border: "#2E2342", buttonBg: "#B78CFF", buttonText: "#160B2A", navBg: "#0B0812", footerBg: "#0B0812" },
  blue: { label: "Blue", primary: "#5CC8FF", secondary: "#7A8CFF", background: "#0A1017", card: "#101922", text: "#E8F1F8", muted: "#93A5B5", border: "#1F3040", buttonBg: "#5CC8FF", buttonText: "#04202E", navBg: "#070C12", footerBg: "#070C12" },
  red: { label: "Red", primary: "#FF5C5C", secondary: "#FFB35C", background: "#130B0B", card: "#1D1111", text: "#F8ECEC", muted: "#B39898", border: "#3D2222", buttonBg: "#FF5C5C", buttonText: "#2A0505", navBg: "#0D0707", footerBg: "#0D0707" },
  green: { label: "Green", primary: "#5CE08A", secondary: "#C8F05C", background: "#0A120D", card: "#101B14", text: "#E9F5EC", muted: "#95AD9C", border: "#203627", buttonBg: "#5CE08A", buttonText: "#04240F", navBg: "#070D09", footerBg: "#070D09" },
  orange: { label: "Orange", primary: "#FF9A3D", secondary: "#FFD23D", background: "#130E08", card: "#1D150C", text: "#F8EFE4", muted: "#B5A08A", border: "#3A2A16", buttonBg: "#FF9A3D", buttonText: "#2A1400", navBg: "#0D0905", footerBg: "#0D0905" },
} as const;
export type PresetKey = keyof typeof THEME_PRESETS;
export const PRESET_KEYS = Object.keys(THEME_PRESETS) as [PresetKey, ...PresetKey[]];

export const COLOR_KEYS = ["primary", "secondary", "background", "card", "text", "muted", "border", "buttonBg", "buttonText", "navBg", "footerBg"] as const;
export type ColorKey = (typeof COLOR_KEYS)[number];

/** Fonts are loaded from Google Fonts at runtime, so changing the font never needs a rebuild. */
export const FONTS: { name: string; weights: string; stack: string }[] = [
  { name: "System UI", weights: "", stack: "system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif" },
  { name: "Bricolage Grotesque", weights: "400;600;800", stack: "'Bricolage Grotesque', system-ui, sans-serif" },
  { name: "Unbounded", weights: "400;600;800", stack: "'Unbounded', system-ui, sans-serif" },
  { name: "Chakra Petch", weights: "400;600;700", stack: "'Chakra Petch', system-ui, sans-serif" },
  { name: "Outfit", weights: "400;600;800", stack: "'Outfit', system-ui, sans-serif" },
  { name: "Sora", weights: "400;600;800", stack: "'Sora', system-ui, sans-serif" },
  { name: "Rubik", weights: "400;600;800", stack: "'Rubik', system-ui, sans-serif" },
  { name: "Archivo", weights: "400;600;800", stack: "'Archivo', system-ui, sans-serif" },
  { name: "Space Grotesk", weights: "400;600;700", stack: "'Space Grotesk', system-ui, sans-serif" },
  { name: "Pixelify Sans", weights: "400;600;700", stack: "'Pixelify Sans', system-ui, sans-serif" },
  { name: "Playfair Display", weights: "400;600;800", stack: "'Playfair Display', Georgia, serif" },
  { name: "Figtree", weights: "400;600;700", stack: "'Figtree', system-ui, sans-serif" },
  { name: "Inter", weights: "400;600;700", stack: "'Inter', system-ui, sans-serif" },
  { name: "DM Sans", weights: "400;600;700", stack: "'DM Sans', system-ui, sans-serif" },
  { name: "Nunito Sans", weights: "400;600;700", stack: "'Nunito Sans', system-ui, sans-serif" },
  { name: "Source Sans 3", weights: "400;600;700", stack: "'Source Sans 3', system-ui, sans-serif" },
  { name: "Lora", weights: "400;600;700", stack: "'Lora', Georgia, serif" },
];
export const FONT_NAMES = FONTS.map((f) => f.name) as [string, ...string[]];

export const SECTION_TYPES = ["hero", "featuredProducts", "categories", "serverStatus", "discord", "promoBanner", "imageBanner", "text", "faq", "testimonials", "customHtml"] as const;
export type SectionType = (typeof SECTION_TYPES)[number];
export const SECTION_LABELS: Record<SectionType, string> = {
  hero: "Hero",
  featuredProducts: "Featured products",
  categories: "Categories",
  serverStatus: "Server status",
  discord: "Discord",
  promoBanner: "Promotional banner",
  imageBanner: "Image banner",
  text: "Text section",
  faq: "FAQ",
  testimonials: "Testimonials",
  customHtml: "Custom content",
};

export const BLOCK_TYPES = ["heading", "text", "image", "button", "divider", "spacer", "html"] as const;
export type BlockType = (typeof BLOCK_TYPES)[number];
export const BLOCK_LABELS: Record<BlockType, string> = {
  heading: "Heading",
  text: "Text",
  image: "Image",
  button: "Button",
  divider: "Divider",
  spacer: "Spacer",
  html: "Custom content",
};

export const SOCIAL_ICONS = ["discord", "youtube", "tiktok", "instagram", "x", "twitch", "website", "link"] as const;
export const CART_ICONS = ["bag", "cart", "crate"] as const;
export const ROLES = ["owner", "admin", "editor"] as const;
export type Role = (typeof ROLES)[number];

export const CURRENCIES = ["EUR", "USD", "GBP", "CAD", "AUD", "SEK", "NOK", "DKK", "PLN", "BRL", "CHF"] as const;
export const TIMEZONES = ["Europe/Amsterdam", "Europe/London", "Europe/Berlin", "Europe/Paris", "Europe/Madrid", "America/New_York", "America/Chicago", "America/Los_Angeles", "America/Sao_Paulo", "Asia/Tokyo", "Australia/Sydney", "UTC"] as const;

export const RESERVED_SLUGS = ["admin", "api", "setup", "store", "product", "cart", "checkout", "media", "pages", "_next", "faq", "login", "robots.txt", "sitemap.xml"];

/** Interface texts. Editable in Admin > Store settings > Interface texts so nothing is hard-coded. */
export const DEFAULT_LABELS = {
  addToCart: "Add to cart",
  viewDetails: "View details",
  cart: "Your cart",
  remove: "Remove",
  total: "Total",
  subtotal: "Subtotal",
  quantity: "Quantity",
  continueShopping: "Continue shopping",
  search: "Search",
  searchPlaceholder: "Search the store",
  noResults: "No products match your search.",
  emptyCategory: "There are no products in this category yet.",
  allCategories: "All products",
  sortBy: "Sort by",
  sortFeatured: "Featured",
  sortPriceAsc: "Price: low to high",
  sortPriceDesc: "Price: high to low",
  sortName: "Name (A-Z)",
  previous: "Previous",
  next: "Next",
  copyIp: "Copy server IP",
  copied: "Copied",
  online: "Online",
  offline: "Offline",
  statusUnavailable: "Status unavailable",
  playersOnline: "players online",
  couponPlaceholder: "Coupon or creator code",
  applyCode: "Apply",
  authTitle: "Sign in to continue",
  authText: "Tebex needs to know which account receives your purchase.",
  checkoutSuccessTitle: "Thank you for your purchase",
  checkoutSuccessText: "Your items are delivered automatically. This can take a minute.",
  backToStore: "Back to the store",
  backToHome: "Back to home",
  productNotFound: "This product could not be found.",
  demoNotice: "Demo store: nothing on this site can be purchased yet.",
  pageNotFound: "This page does not exist.",
  errorTitle: "Something went wrong",
  errorText: "Please try again in a moment.",
  discountLabel: "Save",
} as const;
export type LabelKey = keyof typeof DEFAULT_LABELS;
