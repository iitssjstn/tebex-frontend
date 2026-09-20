# Tebex storefront

A Minecraft webshop for Tebex with a complete admin panel in the browser. Everything a store owner changes (branding, colours, fonts, homepage, pages, navigation, footer, FAQ, media, product presentation, Tebex connection, SEO, backups, admins) is stored in the database and edited at `/admin`. No config files, `.env` files or source code need to be edited.

## Run it

```
docker compose up -d
```

Open `http://your-server:3000`. The first visit shows a setup wizard: administrator account, store details, optional Tebex connection. Data lives in the `storefront-data` volume, so updates (`docker compose up -d --build`) keep everything.

Put it behind a reverse proxy for HTTPS and your own domain. Forward `Host` and `X-Forwarded-Proto`; set the public address under Admin > Settings if you want it fixed.

### Without Docker

```
npm ci && npm run build && DATA_DIR=./data npm start
```

## Tebex

Admin > Tebex takes the **public token** (products and baskets), optionally the **private key**, and the **game server secret** (only for Orders and Customers). Secrets are encrypted at rest (AES-256-GCM); the key is generated on first run and stored in the data volume. Prices and packages always come from Tebex. Until Tebex is connected the store runs on editable demo products.

Checkout and payment happen on Tebex. Minecraft stores need the player to sign in through Tebex first; the cart handles that step.

## Locked out?

```
docker compose exec storefront node scripts/reset-password.mjs <username> <new-password>
```

## Backups

Admin > Backups creates a zip of the database and all images. The Tebex private key is encrypted with a key that stays on the server and is not in the zip, so enter it again when restoring onto a new server. Admin > Settings can export and import the store's look and content (without users or secrets).

## Development and tests

```
npm run dev
npm run lint && npm run typecheck && npm test
npm run build
# end-to-end (needs a build; uses a mock Tebex server):
MOCK_PORT=3199 node scripts/mock-tebex.mjs &
DATA_DIR=/tmp/sf TEBEX_HEADLESS_BASE=http://localhost:3199 TEBEX_PLUGIN_BASE=http://localhost:3199 npm start &
npm run smoke
```

`TEBEX_HEADLESS_BASE` and `TEBEX_PLUGIN_BASE` exist only for tests. Do not set them in production.
