# Architecture Notes

## Product Listing Pagination

### Data Flow (SSR + Client)
1) **Route Loader (SSR)**  
   - Prefetch the first page of products using TanStack Query.
   - Store the result in the query cache for hydration.

2) **Client Hydration**  
   - React Query hydrates the prefetched page on first render.
   - UI shows the first page immediately without a loading flash.

3) **Paginated Fetching**  
   - Use `useInfiniteQuery` with:
     - `queryFn` calling `/products?cursor=...`
     - `getNextPageParam` reading `nextCursor` from the API response.
   - When user clicks “Load more” (or an observer hits the sentinel), fetch the next page.

4) **Rendering**  
   - Flatten `data.pages` into a single array for rendering.
   - Use list virtualization (`@tanstack/react-virtual`) for large lists.
     - Only render the visible window of items and recycle DOM nodes.
     - Keeps the DOM small even if many pages are loaded in memory.
     - Optional: cap in-memory pages (e.g. keep last N pages) to limit memory further.

```mermaid
sequenceDiagram
  autonumber
  participant Browser
  participant Router
  participant Query as QueryClient
  participant API

  Browser->>Router: Request /
  Router->>Query: Prefetch products page 1
  Query->>API: GET /products
  API-->>Query: { products, nextCursor }
  Query-->>Router: Cache hydrated
  Router-->>Browser: SSR HTML + dehydrated cache

  Browser->>Query: Hydrate cache
  Browser->>Query: useInfiniteQuery (page 1)
  Query-->>Browser: Render page 1

  Browser->>Query: Load more (cursor)
  Query->>API: GET /products?cursor=...
  API-->>Query: { products, nextCursor }
  Query-->>Browser: Append next page
```
