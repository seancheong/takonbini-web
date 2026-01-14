# Takonbini Web

Takonbini is a TanStack Start app for browsing Japanese convenience store products, with filters, product detail pages, and an image proxy for reliable loading.

## Features

- Product listing with filters, pagination, and SSR hydration
- Product detail pages
- Image proxy with browser + edge caching
- i18n (EN/JA/ZH) and theme switching

## Architecture Notes

See [architecture.md](architecture.md) for data flow and other architecture details.

## Requirements

- Node.js
- pnpm

## Environment

Create a `.env.local` file:

```
PRODUCTS_API_URL="http://localhost:3001"
PRODUCTS_API_KEY="your-api-key"
```

## Development

```
pnpm install
pnpm start
```

## Production

```
pnpm build
```

## Linting

```
pnpm lint
```
