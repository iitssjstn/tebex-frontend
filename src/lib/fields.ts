// Client-safe form definitions. The admin editors are generated from these, so adding a field here adds it to the UI.
import { CART_ICONS, CURRENCIES, DEFAULT_LABELS, FONTS, SECTION_LABELS, SOCIAL_ICONS, TIMEZONES, type BlockType, type SectionType } from "./constants";

export type FieldType = "text" | "textarea" | "url" | "image" | "color" | "select" | "checkbox" | "number" | "richtext" | "list";
export type FieldDef = {
  name: string;
  label: string;
  type: FieldType;
  help?: string;
  placeholder?: string;
  options?: { value: string; label: string }[];
  fields?: FieldDef[];
  itemTitle?: string;
  addLabel?: string;
  min?: number;
  max?: number;
  newItem?: Record<string, unknown>;
};

const opts = (list: readonly string[]) => list.map((v) => ({ value: v, label: v }));
const o = (pairs: [string, string][]) => pairs.map(([value, label]) => ({ value, label }));
const fontOptions = FONTS.map((f) => ({ value: f.name, label: f.name }));

export const BRANDING_FIELDS: FieldDef[] = [
  { name: "storeName", label: "Store name", type: "text" },
  { name: "description", label: "Store description", type: "textarea", help: "Used in search results and link previews unless SEO says otherwise." },
  { name: "logo", label: "Logo", type: "image" },
  { name: "favicon", label: "Favicon", type: "image", help: "A square image. Shown in the browser tab." },
  { name: "browserTitle", label: "Browser title", type: "text", help: "Leave empty to use the store name." },
  { name: "fontHeading", label: "Heading font", type: "select", options: fontOptions },
  { name: "fontBody", label: "Body font", type: "select", options: fontOptions },
  { name: "radius", label: "Corner radius (px)", type: "number", min: 0, max: 24 },
  { name: "buttonStyle", label: "Button style", type: "select", options: o([["bevel", "Raised (Minecraft style)"], ["solid", "Solid"], ["outline", "Outline"], ["soft", "Soft"]]) },
];

export const COLOR_FIELDS: FieldDef[] = [
  { name: "primary", label: "Primary colour", type: "color" },
  { name: "secondary", label: "Secondary colour", type: "color" },
  { name: "background", label: "Page background", type: "color" },
  { name: "card", label: "Card background", type: "color" },
  { name: "text", label: "Text", type: "color" },
  { name: "muted", label: "Muted text", type: "color" },
  { name: "border", label: "Borders", type: "color" },
  { name: "buttonBg", label: "Button background", type: "color" },
  { name: "buttonText", label: "Button text", type: "color" },
  { name: "navBg", label: "Navigation background", type: "color" },
  { name: "footerBg", label: "Footer background", type: "color" },
];

export const STORE_FIELDS: FieldDef[] = [
  { name: "title", label: "Store page title", type: "text" },
  { name: "currencyDisplay", label: "Show prices as", type: "select", options: o([["symbol", "Symbol (\u20ac4.99)"], ["code", "Code (4.99 EUR)"]]) },
  { name: "productStyle", label: "Product display", type: "select", options: o([["grid", "Grid"], ["list", "List"]]) },
  { name: "productsPerPage", label: "Products per page", type: "number", min: 4, max: 60 },
  { name: "defaultSort", label: "Default sorting", type: "select", options: o([["featured", "Featured first"], ["price-asc", "Price: low to high"], ["price-desc", "Price: high to low"], ["name", "Name (A-Z)"]]) },
  { name: "showDiscounts", label: "Show discounts", type: "checkbox" },
  { name: "showOriginalPrice", label: "Show original price when discounted", type: "checkbox" },
  { name: "showBadges", label: "Show badges", type: "checkbox" },
  { name: "enableSearch", label: "Enable product search", type: "checkbox" },
  { name: "enableProductDetails", label: "Enable product detail pages", type: "checkbox" },
];

export const CART_FIELDS: FieldDef[] = [
  { name: "enabled", label: "Enable the cart", type: "checkbox", help: "When off, product buttons are hidden." },
  { name: "icon", label: "Cart icon", type: "select", options: opts(CART_ICONS) },
  { name: "title", label: "Cart title", type: "text" },
  { name: "emptyMessage", label: "Empty cart message", type: "text" },
  { name: "checkoutText", label: "Checkout button text", type: "text" },
];

export const SERVER_FIELDS: FieldDef[] = [
  { name: "ip", label: "Server address", type: "text", placeholder: "play.example.com" },
  { name: "port", label: "Port", type: "number", min: 1, max: 65535 },
  { name: "edition", label: "Edition", type: "select", options: o([["java", "Java"], ["bedrock", "Bedrock"]]) },
  { name: "statusApi", label: "Status provider", type: "select", options: o([["mcstatus", "mcstatus.io"], ["mcsrvstat", "mcsrvstat.us"], ["custom", "Custom URL"]]) },
  { name: "customApiUrl", label: "Custom status URL", type: "url", help: "Use {host}, {port} and {edition}. The API must return JSON with online and players.online / players.max." },
  { name: "showStatus", label: "Show online/offline status", type: "checkbox" },
  { name: "showPlayers", label: "Show player count", type: "checkbox" },
];

export const DISCORD_FIELDS: FieldDef[] = [
  { name: "enabled", label: "Show the Discord section", type: "checkbox" },
  { name: "url", label: "Discord link", type: "url", placeholder: "https://discord.gg/..." },
  { name: "invite", label: "Invite code (optional)", type: "text" },
  { name: "buttonText", label: "Button text", type: "text" },
  { name: "sectionTitle", label: "Section title", type: "text" },
  { name: "sectionDescription", label: "Section description", type: "textarea" },
];

export const SEO_FIELDS: FieldDef[] = [
  { name: "title", label: "Site title", type: "text" },
  { name: "description", label: "Meta description", type: "textarea" },
  { name: "ogTitle", label: "Open Graph title", type: "text" },
  { name: "ogDescription", label: "Open Graph description", type: "textarea" },
  { name: "ogImage", label: "Open Graph image", type: "image", help: "Shown when the site is shared on Discord, Twitter and similar." },
  { name: "robotsIndex", label: "Allow search engines to index the site", type: "checkbox" },
  { name: "robotsFollow", label: "Allow search engines to follow links", type: "checkbox" },
];

export const SITE_FIELDS: FieldDef[] = [
  { name: "siteUrl", label: "Public site address", type: "text", placeholder: "https://store.example.com", help: "Used for checkout return links and sitemaps. Leave empty to detect it automatically." },
  { name: "currency", label: "Currency", type: "select", options: opts(CURRENCIES), help: "Only used for the demo store. With Tebex connected, prices use your Tebex currency." },
  { name: "timezone", label: "Timezone", type: "select", options: opts(TIMEZONES) },
];

const labelHelp: Partial<Record<keyof typeof DEFAULT_LABELS, string>> = { demoNotice: "Shown while Tebex is not connected." };
export const LABEL_FIELDS: FieldDef[] = (Object.keys(DEFAULT_LABELS) as (keyof typeof DEFAULT_LABELS)[]).map((k) => ({
  name: k,
  label: k.replace(/([A-Z])/g, " $1").replace(/^./, (c) => c.toUpperCase()),
  type: "text" as const,
  help: labelHelp[k],
}));

const linkFields: FieldDef[] = [
  { name: "label", label: "Label", type: "text" },
  { name: "url", label: "Link", type: "url" },
];

export const FOOTER_FIELDS: FieldDef[] = [
  { name: "title", label: "Footer title", type: "text" },
  { name: "description", label: "Footer description", type: "textarea" },
  {
    name: "columns",
    label: "Link columns",
    type: "list",
    itemTitle: "title",
    addLabel: "Add column",
    newItem: { title: "New column", links: [] },
    fields: [
      { name: "title", label: "Column title", type: "text" },
      { name: "links", label: "Links", type: "list", itemTitle: "label", addLabel: "Add link", newItem: { label: "Link", url: "" }, fields: linkFields },
    ],
  },
  { name: "legalLinks", label: "Legal links", type: "list", itemTitle: "label", addLabel: "Add legal link", newItem: { label: "Link", url: "" }, fields: linkFields },
  { name: "copyright", label: "Copyright text", type: "text" },
  { name: "showSocial", label: "Show social links", type: "checkbox" },
  { name: "showDiscord", label: "Show Discord button", type: "checkbox" },
  { name: "showServerIp", label: "Show server address", type: "checkbox" },
];

export const SOCIAL_FIELDS: FieldDef[] = [
  {
    name: "links",
    label: "Social links",
    type: "list",
    itemTitle: "name",
    addLabel: "Add social link",
    newItem: { name: "New link", url: "", icon: "link", enabled: true },
    fields: [
      { name: "name", label: "Name", type: "text" },
      { name: "url", label: "Link", type: "url" },
      { name: "icon", label: "Icon", type: "select", options: opts(SOCIAL_ICONS) },
      { name: "enabled", label: "Enabled", type: "checkbox" },
    ],
  },
];

export const NAV_FIELDS: FieldDef[] = [
  {
    name: "items",
    label: "Menu items",
    type: "list",
    itemTitle: "label",
    addLabel: "Add menu item",
    newItem: { label: "New item", url: "/", enabled: true, children: [] },
    fields: [
      { name: "label", label: "Label", type: "text" },
      { name: "url", label: "Link", type: "url", help: "Leave empty when this item only opens a dropdown." },
      { name: "enabled", label: "Enabled", type: "checkbox" },
      {
        name: "children",
        label: "Dropdown items",
        type: "list",
        itemTitle: "label",
        addLabel: "Add dropdown item",
        newItem: { label: "New item", url: "/", enabled: true },
        fields: [
          { name: "label", label: "Label", type: "text" },
          { name: "url", label: "Link", type: "url" },
          { name: "enabled", label: "Enabled", type: "checkbox" },
        ],
      },
    ],
  },
];

export const FAQ_FIELDS: FieldDef[] = [
  { name: "title", label: "Page title", type: "text" },
  { name: "intro", label: "Intro text", type: "textarea" },
  {
    name: "items",
    label: "Questions",
    type: "list",
    itemTitle: "question",
    addLabel: "Add question",
    newItem: { question: "New question", answer: "<p>Answer</p>", enabled: true },
    fields: [
      { name: "question", label: "Question", type: "text" },
      { name: "answer", label: "Answer", type: "richtext" },
      { name: "enabled", label: "Enabled", type: "checkbox" },
    ],
  },
];

// ---------- homepage sections ----------
const styleFields: FieldDef[] = [
  { name: "align", label: "Alignment", type: "select", options: o([["left", "Left"], ["center", "Centre"], ["right", "Right"]]) },
  { name: "paddingY", label: "Vertical spacing", type: "select", options: o([["sm", "Compact"], ["md", "Normal"], ["lg", "Roomy"]]) },
  { name: "background", label: "Background colour (optional)", type: "color" },
  { name: "backgroundImage", label: "Background image (optional)", type: "image" },
  { name: "overlay", label: "Image darkening (%)", type: "number", min: 0, max: 90 },
  { name: "textColor", label: "Text colour (optional)", type: "color" },
];

const section = (content: FieldDef[]): FieldDef[] => [...content, ...styleFields];

export const SECTION_FIELDS: Record<SectionType, FieldDef[]> = {
  hero: section([
    { name: "heading", label: "Heading", type: "text" },
    { name: "subtitle", label: "Subtitle", type: "textarea" },
    { name: "logo", label: "Logo (optional)", type: "image" },
    { name: "button1Text", label: "Button 1 text", type: "text" },
    { name: "button1Url", label: "Button 1 link", type: "url" },
    { name: "button2Text", label: "Button 2 text", type: "text" },
    { name: "button2Url", label: "Button 2 link", type: "url" },
    { name: "showServerIp", label: "Show server address", type: "checkbox" },
    { name: "showPlayerCount", label: "Show live player count", type: "checkbox" },
    { name: "height", label: "Height", type: "select", options: o([["md", "Medium"], ["lg", "Large"], ["full", "Full screen"]]) },
  ]),
  featuredProducts: section([
    { name: "title", label: "Title", type: "text" },
    { name: "subtitle", label: "Subtitle", type: "text" },
    { name: "count", label: "Number of products", type: "number", min: 1, max: 12, help: "Products marked Featured or Homepage in Admin > Products come first." },
  ]),
  categories: section([
    { name: "title", label: "Title", type: "text" },
    { name: "subtitle", label: "Subtitle", type: "text" },
  ]),
  serverStatus: section([
    { name: "title", label: "Title", type: "text" },
    { name: "description", label: "Description", type: "textarea" },
  ]),
  discord: section([{ name: "_note", label: "Text and link come from Admin > Discord.", type: "text" }]).filter((f) => f.name !== "_note"),
  promoBanner: section([
    { name: "text", label: "Banner text", type: "text" },
    { name: "buttonText", label: "Button text", type: "text" },
    { name: "buttonUrl", label: "Button link", type: "url" },
  ]),
  imageBanner: section([
    { name: "image", label: "Image", type: "image" },
    { name: "alt", label: "Image description (for screen readers)", type: "text" },
    { name: "link", label: "Link (optional)", type: "url" },
    { name: "height", label: "Height", type: "select", options: o([["sm", "Small"], ["md", "Medium"], ["lg", "Large"]]) },
  ]),
  text: section([
    { name: "title", label: "Title", type: "text" },
    { name: "body", label: "Text", type: "richtext" },
  ]),
  faq: section([
    { name: "title", label: "Title", type: "text" },
    { name: "limit", label: "Number of questions (0 = all)", type: "number", min: 0, max: 50, help: "Questions come from Admin > FAQ." },
  ]),
  testimonials: section([
    { name: "title", label: "Title", type: "text" },
    {
      name: "items",
      label: "Testimonials",
      type: "list",
      itemTitle: "name",
      addLabel: "Add testimonial",
      newItem: { name: "Player", role: "", quote: "", avatar: "" },
      fields: [
        { name: "name", label: "Name", type: "text" },
        { name: "role", label: "Role or rank", type: "text" },
        { name: "quote", label: "Quote", type: "textarea" },
        { name: "avatar", label: "Avatar", type: "image" },
      ],
    },
  ]),
  customHtml: section([{ name: "html", label: "Content", type: "richtext", help: "Scripts and inline styles are removed for safety." }]),
};

export const SECTION_TYPE_OPTIONS = (Object.keys(SECTION_LABELS) as SectionType[]).map((t) => ({ value: t, label: SECTION_LABELS[t] }));

// ---------- page blocks ----------
export const BLOCK_FIELDS: Record<BlockType, FieldDef[]> = {
  heading: [
    { name: "text", label: "Heading", type: "text" },
    { name: "level", label: "Size", type: "select", options: o([["h2", "Large"], ["h3", "Medium"], ["h4", "Small"]]) },
    { name: "align", label: "Alignment", type: "select", options: o([["left", "Left"], ["center", "Centre"], ["right", "Right"]]) },
  ],
  text: [{ name: "html", label: "Text", type: "richtext" }],
  image: [
    { name: "src", label: "Image", type: "image" },
    { name: "alt", label: "Image description (for screen readers)", type: "text" },
    { name: "caption", label: "Caption", type: "text" },
    { name: "width", label: "Width", type: "select", options: o([["narrow", "Narrow"], ["wide", "Wide"], ["full", "Full width"]]) },
  ],
  button: [
    { name: "text", label: "Button text", type: "text" },
    { name: "url", label: "Link", type: "url" },
    { name: "variant", label: "Style", type: "select", options: o([["primary", "Primary"], ["ghost", "Outline"]]) },
    { name: "align", label: "Alignment", type: "select", options: o([["left", "Left"], ["center", "Centre"], ["right", "Right"]]) },
  ],
  divider: [],
  spacer: [{ name: "size", label: "Size", type: "select", options: o([["sm", "Small"], ["md", "Medium"], ["lg", "Large"]]) }],
  html: [{ name: "html", label: "Content", type: "richtext", help: "Scripts and inline styles are removed for safety." }],
};
