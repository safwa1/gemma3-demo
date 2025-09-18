import {Hono} from "hono";
import {cors} from "hono/cors";
import {getOllamaModels, getOllamaModelsDetailed} from "./ollama-cli";

const app = new Hono();

app.use("*", cors());

const activeControllers = new Map<string, AbortController>();

app.post("/ask", async (c) => {
    const {prompt, sessionId, model} = await c.req.json<{
        prompt: string;
        sessionId: string;
        model?: string;
    }>();

    const controller = new AbortController();
    activeControllers.set(sessionId, controller);

    c.req.raw.signal.addEventListener("abort", () => {
        controller.abort();
        activeControllers.delete(sessionId);
        console.log(`Client aborted request for session ${sessionId}`);
    });

    const response = await fetch("http://localhost:11434/api/generate", {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({
            model: model || "gemma3:1b",
            prompt,
            stream: true,
        }),
        signal: controller.signal,
    });

    if (!response.ok || !response.body) {
        activeControllers.delete(sessionId);
        return c.text("Failed to connect to Ollama", 500);
    }

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
                    const {done, value} = await reader.read();
                    if (done) break;

                    const chunk = decoder.decode(value, {stream: true});
                    for (const line of chunk.split("\n")) {
                        if (line.trim() !== "") {
                            try {
                                const data = JSON.parse(line);
                                if (data.response) {
                                    controllerStream.enqueue(
                                        new TextEncoder().encode(data.response)
                                    );
                                }
                            } catch {
                            }
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
            "Content-Type": "text/event-stream; charset=utf-8",
            "Cache-Control": "no-cache",
            Connection: "keep-alive",
            "Access-Control-Allow-Origin": "*",
        },
    });
});

app.post("/ask2", async (c) => {
    const { prompt, sessionId, systemPrompt, model } = await c.req.json<{
        prompt: string;
        sessionId: string;
        systemPrompt?: string;
        model?: string;
    }>();

    const controller = new AbortController();
    activeControllers.set(sessionId, controller);

    c.req.raw.signal.addEventListener("abort", () => {
        controller.abort();
        activeControllers.delete(sessionId);
        console.log(`Client aborted request for session ${sessionId}`);
    });

    const bodyPayload: any = {
        model: model || "deepseek-r1:1.5b",
        stream: true,
    };

    if (systemPrompt) {
        bodyPayload.prompt = `${systemPrompt}\n\nUser: ${prompt}`;
    } else {
        bodyPayload.prompt = prompt;
    }

    const response = await fetch("http://localhost:11434/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(bodyPayload),
        signal: controller.signal,
    });

    if (!response.ok || !response.body) {
        activeControllers.delete(sessionId);
        return c.text("Failed to connect to Ollama", 500);
    }

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
            "Content-Type": "text/event-stream; charset=utf-8",
            "Cache-Control": "no-cache",
            Connection: "keep-alive",
            "Access-Control-Allow-Origin": "*",
        },
    });
});

app.post("/stop", async (c) => {
    const {sessionId} = await c.req.json<{ sessionId: string }>();
    const controller = activeControllers.get(sessionId);
    if (controller) {
        controller.abort();
        activeControllers.delete(sessionId);
        return c.json({stopped: true});
    }
    return c.json({stopped: false});
});


// ==== OLLAMA ENDPOINTS ====

app.get('/models', async (c) => {
    try {
        const models = await getOllamaModels();
        return c.json({
            success: true,
            data: models,
            count: models.length
        });
    } catch (error) {
        console.error('Error in /models endpoint:', error);
        return c.json({
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error occurred'
        }, 500);
    }
});

app.get('/models/detailed', async (c) => {
    try {
        const models = await getOllamaModelsDetailed();
        return c.json({
            success: true,
            data: models,
            count: models.length
        });
    } catch (error) {
        console.error('Error in /models/detailed endpoint:', error);
        return c.json({
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error occurred'
        }, 500);
    }
});

app.get('/health', (c) => {
    return c.json({
        status: 'ok',
        message: 'Ollama API is running',
        timestamp: new Date().toISOString()
    });
});

app.get('/', (c) => {
    return c.json({
        message: 'Ollama Models API',
        endpoints: {
            '/models': 'GET - List all model names',
            '/models/detailed': 'GET - List all models with detailed information',
            '/health': 'GET - Health check'
        }
    });
});

export default app;
