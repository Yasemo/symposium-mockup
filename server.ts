// Symposium UI Mockup - Deno Server
// Run with: deno run --allow-net --allow-read server.ts

const port = parseInt(Deno.env.get("PORT") || "3000");

// MIME types
const mimeTypes: Record<string, string> = {
  ".html": "text/html",
  ".css": "text/css",
  ".js": "application/javascript",
  ".json": "application/json",
  ".png": "image/png",
  ".svg": "image/svg+xml",
};

async function handler(req: Request): Promise<Response> {
  const url = new URL(req.url);
  let path = url.pathname;

  // Default to index.html
  if (path === "/") {
    path = "/index.html";
  }

  // API routes
  if (path.startsWith("/api/")) {
    return handleAPI(path, req);
  }

  // Static files
  try {
    const filePath = `./client${path}`;
    const ext = path.substring(path.lastIndexOf("."));
    const contentType = mimeTypes[ext] || "application/octet-stream";
    
    const file = await Deno.readFile(filePath);
    return new Response(file, {
      headers: { "Content-Type": contentType },
    });
  } catch {
    return new Response("Not Found", { status: 404 });
  }
}

async function handleAPI(path: string, _req: Request): Promise<Response> {
  const dataPath = path.replace("/api/", "./data/") + ".json";
  
  try {
    const data = await Deno.readTextFile(dataPath);
    return new Response(data, {
      headers: { "Content-Type": "application/json" },
    });
  } catch {
    return new Response(JSON.stringify({ error: "Not found" }), {
      status: 404,
      headers: { "Content-Type": "application/json" },
    });
  }
}

console.log(`
╔═══════════════════════════════════════════════════════════╗
║                                                           ║
║   SYMPOSIUM UI MOCKUP                                     ║
║   ─────────────────                                       ║
║                                                           ║
║   Server running at http://localhost:${port}                 ║
║                                                           ║
║   Dieter Rams inspired minimalist interface               ║
║                                                           ║
╚═══════════════════════════════════════════════════════════╝
`);

Deno.serve({ port }, handler);
