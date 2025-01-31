import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import type { APIEvent } from "solid-start";

const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.fixedWindow(5, "10 s"),
});

export async function GET(event: APIEvent) {
  const ip = event.request.headers.get("x-forwarded-for") ?? "127.0.0.1";
  const { success, pending, limit, reset, remaining } = await ratelimit.limit(
    `mw_${ip}`,
  );
  await pending;
  const headers = {
    "X-RateLimit-Limit": limit.toString(),
    "X-RateLimit-Remaining": remaining.toString(),
    "X-RateLimit-Reset": reset.toString(),
  };
  if (!success) {
    return new Response("Rate limit exceeded", {
      headers,
      status: 429,
    });
  }
  return new Response("You are fine", {
    headers,
  });
}
