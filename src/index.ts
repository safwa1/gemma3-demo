import { Hono } from "hono";
import { cors } from "hono/cors";

const app = new Hono();

app.use("*", cors());

const activeControllers = new Map<string, AbortController>();

app.post("/ask", async (c) => {
  const { prompt, sessionId } = await c.req.json<{
    prompt: string;
    sessionId: string;
  }>();

  const controller = new AbortController();
  activeControllers.set(sessionId, controller);

  const response = await fetch("http://localhost:11434/api/generate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "gemma3:270m",
      prompt,
      stream: true,
    }),
    signal: controller.signal,
  });

  const stream = new ReadableStream({
    async start(controllerStream) {
      const reader = response.body?.getReader();
      if (!reader) {
        controllerStream.close();
        activeControllers.delete(sessionId);
        return;
      }

      const decoder = new TextDecoder();
      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value, { stream: true });
          for (const line of chunk.split("\n")) {
            if (line.trim() !== "") {
              try {
                const data = JSON.parse(line);
                if (data.response) {
                  controllerStream.enqueue(
                    new TextEncoder().encode(data.response)
                  );
                }
              } catch {}
            }
          }
        }
      } catch (err: any) {
        console.log("Stream aborted:", err.message);
      } finally {
        controllerStream.close();
        activeControllers.delete(sessionId);
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Access-Control-Allow-Origin": "*",
    },
  });
});

app.post("/stop", async (c) => {
  const { sessionId } = await c.req.json<{ sessionId: string }>();
  const controller = activeControllers.get(sessionId);
  if (controller) {
    controller.abort();
    activeControllers.delete(sessionId);
    return c.json({ stopped: true });
  }
  return c.json({ stopped: false });
});

export default app;
