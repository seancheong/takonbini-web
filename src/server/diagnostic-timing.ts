import { definePlugin } from "nitro";

export default definePlugin((app) => {
 const starts = new WeakMap<object, number>();
 app.hooks.hook("request", (event) => { starts.set(event, performance.now()); });
 app.hooks.hook("response", (response, event) => {
  const start = starts.get(event);
  if (start !== undefined) response.headers.append("server-timing", `handler;dur=${(performance.now() - start).toFixed(1)}`);
 });
});
