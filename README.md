# Ollama Chat Web App

A sleek web-based chat interface powered by your local Ollama models. Now includes a professional model selector and per-request model control.

Supports streaming responses, stop generation, markdown rendering, and code syntax highlighting.

---

## Features

- Real-time streaming responses from Ollama.  
- Professional chat UI with a polished custom dropdown to choose the model.  
- Per-request model selection (e.g., gemma3:270m, gemma3:1b, deepseek-r1:1.5b).  
- Stop generation mid-response.  
- Markdown support with syntax highlighting for code blocks.  
- Responsive, full-screen chat interface.

---

## Requirements

- Ollama installed and running locally.  
- Models installed in Ollama (at least one of):
  - `gemma3:270m`
  - `gemma3:1b`
  - `deepseek-r1:1.5b`
- Bun (or Node-compatible Bun runtime) to run the dev servers.  
- Hono framework is used on the backend (already included via dependencies).

---

## Installation

1) Install Ollama (if not installed):  
   https://ollama.com

2) Pull one or more models you want to use, for example:

   ```bash
   ollama run gemma3:270m
   ollama run gemma3:1b
   ollama run deepseek-r1:1.5b
   ```

3) Clone this repository:

   ```bash
   git clone https://github.com/safwa1/gemma3-demo
   cd gemma3-demo
   ```

4) Install dependencies (Bun):

   ```bash
   bun install
   ```

5) Start the app (backend + UI):

   ```bash
   bun run dev
   ```

   - Backend API: http://localhost:3000  
   - Frontend UI: http://localhost:3001

---

## Usage

- Choose a model using the dropdown in the input area.  
- Type your message, then press Enter to send.  
- Responses stream in real time.  
- Click the stop button to cancel an in-progress generation.

---

## Backend Endpoints

- POST /ask
  - Streams a completion from the selected or default model.
  - Request JSON:

    ```json
    {
      "prompt": "Your message here",
      "sessionId": "unique-session-id",
      "model": "gemma3:270m"
    }
    ```

  - Notes: `model` is optional; defaults to `gemma3:1b` when not provided.

- POST /ask2
  - Alternative endpoint supporting an optional system prompt.
  - Request JSON:

    ```json
    {
      "prompt": "Your message here",
      "sessionId": "unique-session-id",
      "systemPrompt": "You are a helpful assistant...",
      "model": "deepseek-r1:1.5b"
    }
    ```

  - Notes: `model` is optional; defaults to `deepseek-r1:1.5b` when not provided.

- POST /stop
  - Stops a streaming generation for the given session.
  - Request JSON:

    ```json
    { "sessionId": "unique-session-id" }
    ```

---

## Testing with test.http

You can quickly exercise the endpoints using the included test file:

- test.http contains example requests for /ask, /ask2, and /stop, including how to pass the `model` parameter.

---


## Notes

- Ensure Ollama is running and that the models you plan to use are already pulled.  
- Modern browsers with ReadableStream support are required for streaming.

---

## License

MIT License
