# Ollama Chat Web App

A web-based chat interface powered by the **Ollama Gemma3 model** (`gemma3:270m`).  
Supports **streaming responses**, **stop generation**, **markdown**, and **code highlighting**.

---

## Features

- Real-time response streaming from Gemma3 model.
- Stop generation mid-response.
- Markdown support with syntax highlighting for code.
- Responsive and full-screen chat interface.

---

## Requirements

- **Ollama**: Must be installed and running locally.  
- **Gemma3 model**: `gemma3:270m` installed.  
- **Node.js / Bun runtime**: For running the backend server.  
- **Hono framework**: Lightweight HTTP server.

---

## Installation

1. **Install Ollama** (if not already installed):  
   Follow instructions at [https://ollama.com](https://ollama.com).

2. **Install Gemma3 model**:  

   ```bash
   ollama run gemma3:270m
   ```

3. **Clone this repository**:

   ```bash
   git clone https://github.com/safwa1/gemma3-demo
   cd gemma3-demo
   ```

4. **Install dependencies**:
   If using Bun:

   ```bash
   bun install
   ```

5. **Start the backend server**:

   ```bash
   bun run dev
   ```

   The server will run at `http://localhost:3000`.

6. **Open the frontend**:
   Open `http://localhost:3001` in a browser.

---

## Usage

1. Type your message in the input field.
2. Press **Enter** to send.
3. Responses will appear in real-time, streamed from Gemma3.
4. Click the **stop button** to stop generation mid-response.

---

## Backend Endpoints

- **POST /ask**

  - Starts a streaming response.
  - Request JSON:

    ```json
    {
      "prompt": "Your message here",
      "sessionId": "unique-session-id"
    }
    ```

- **POST /stop**

  - Stops a streaming generation.
  - Request JSON:

    ```json
    {
      "sessionId": "unique-session-id"
    }
    ```

---

## Frontend Features

- Full-screen chat area.
- Auto-growing input textarea.
- Typing indicator for bot.
- Markdown and syntax highlighting using `marked` and `highlight.js`.
- Stop button integrated with streaming responses.

---

## Notes

- Ensure **Ollama** is running and the **Gemma3 model** is active before starting the server.
- For real-time streaming, **modern browsers** with `ReadableStream` support are required.

---

## License

MIT License
