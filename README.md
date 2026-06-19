# HideStock — Hide Price When Out of Stock

A Shopify embedded app that automatically hides product prices when inventory
reaches zero, replacing them with a custom message. Built with Remix, Polaris,
App Bridge, and a Theme App Extension. Runs on **Coolify** with **PostgreSQL**.

## Features

- Automatically hides prices when a product is sold out (`available == false`)
- Optionally hides the Add to Cart button
- Customizable replacement message (e.g. "Price on Request")
- Works on product pages, collection grids, featured sections and quick-view modals
- No page reload — uses a `MutationObserver` for dynamic content
- Redesigned Polaris admin with a live storefront preview
- Settings synced to a shop metafield so the storefront reads them with no API call

## Stack

| Layer      | Tech                                            |
|------------|-------------------------------------------------|
| Admin      | Remix + Shopify Polaris + App Bridge            |
| Storefront | Theme App Extension (Liquid + vanilla JS)       |
| Database   | PostgreSQL via Prisma                           |
| Hosting    | Coolify (Docker)                                |

## Environment variables

See `.env.example`. Required in production:

```
SHOPIFY_API_KEY=...
SHOPIFY_API_SECRET=...
SHOPIFY_APP_URL=https://<your-coolify-domain>
DATABASE_URL=postgresql://user:password@host:5432/hidestock
SCOPES=read_products,read_inventory,read_themes
```

Optional billing overrides: `APP_PLAN_NAME`, `APP_PLAN_PRICE`, `APP_PLAN_CURRENCY`,
`APP_TRIAL_DAYS`. Set `APP_HANDLE` to your Shopify app handle if it isn't `hidestock`.

## Local development

```bash
npm install
npm run dev          # shopify app dev (tunnel + dev store)
```

## Database

Migrations live in `prisma/migrations`. On container start, `npm run docker-start`
runs `prisma migrate deploy` before booting the server.

```bash
npx prisma generate
npx prisma migrate deploy
```

## Deployment (Coolify)

The repo ships a `Dockerfile`. Coolify builds the image and runs
`npm run docker-start` (which runs migrations then `remix-serve`). Provision a
PostgreSQL database in the same Coolify project and set `DATABASE_URL` plus the
Shopify env vars above. The app listens on port `3000`.

## License

MIT
