/**
 * Forward a request to an upstream service and pipe the response back.
 */
export async function proxyRequest(req, res, { baseUrl, timeoutMs, stripPrefix }) {
  const suffix = req.originalUrl.replace(stripPrefix, "") || "/";
  const target = new URL(suffix, baseUrl.endsWith("/") ? baseUrl : `${baseUrl}/`);

  // Preserve query string from the incoming request
  const incoming = new URL(req.originalUrl, "http://gateway.local");
  target.search = incoming.search;

  const headers = {
    accept: req.headers.accept || "application/json",
    "content-type": req.headers["content-type"] || "application/json",
    "x-request-id": req.requestId,
    "x-forwarded-by": "hermes-gateway",
  };

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const init = {
      method: req.method,
      headers,
      signal: controller.signal,
    };

    if (req.method !== "GET" && req.method !== "HEAD" && req.body !== undefined) {
      init.body = JSON.stringify(req.body);
    }

    const upstream = await fetch(target, init);
    const contentType = upstream.headers.get("content-type") || "";
    const body = contentType.includes("application/json")
      ? await upstream.json()
      : await upstream.text();

    res.status(upstream.status);
    res.setHeader("X-Upstream", target.origin);
    if (contentType) res.setHeader("Content-Type", contentType);

    if (typeof body === "string") {
      res.send(body);
    } else {
      res.json(body);
    }
  } catch (err) {
    if (err.name === "AbortError") {
      err.status = 504;
      err.message = "Upstream request timed out";
    } else {
      err.status = err.status || 502;
      err.message = err.message || "Upstream request failed";
    }
    throw err;
  } finally {
    clearTimeout(timer);
  }
}
