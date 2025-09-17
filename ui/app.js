marked.setOptions({
    highlight: function (code, lang) {
        if (hljs.getLanguage(lang)) {
            return hljs.highlight(code, {language: lang}).value;
        }
        return hljs.highlightAuto(code).value;
    },
});

const textarea = document.getElementById("prompt");

function autoGrow() {
    textarea.style.height = "auto";
    textarea.style.height = Math.min(textarea.scrollHeight, 200) + "px";
}

textarea.addEventListener("input", autoGrow);
textarea.addEventListener("focus", autoGrow);

const messagesEl = document.getElementById("messages");
const inputEl = document.getElementById("prompt");
const stopButton = document.getElementById("stop");

const sessionId =
    Date.now().toString(36) + Math.random().toString(36).substring(2);
console.log("Session ID:", sessionId);

function scrollToBottom() {
    requestAnimationFrame(() => {
        messagesEl.scrollTop = messagesEl.scrollHeight;
    });
}

function addMessage(text, sender, markdown = false) {
    const div = document.createElement("div");
    div.className = `bubble ${sender}`;
    if (markdown && text) {
        div.innerHTML = marked.parse(text);
    } else {
        div.textContent = text;
    }
    messagesEl.appendChild(div);
    scrollToBottom();
    return div;
}

function addTypingIndicator() {
    const typing = document.createElement("div");
    typing.className = "typing bot";
    typing.id = "typing";
    typing.innerHTML = `<div class="dot"></div><div class="dot"></div><div class="dot"></div>`;
    messagesEl.appendChild(typing);
    scrollToBottom();
}

function removeTypingIndicator() {
    const typing = document.getElementById("typing");
    if (typing) typing.remove();
}

async function askModel(prompt) {
    if (!prompt) return;

    const sessionId =
        Date.now().toString(36) + Math.random().toString(36).substring(2); // new per request
    textarea.value = "";
    textarea.style.height = "auto";
    addMessage(prompt, "user");
    addTypingIndicator();
    stopButton.classList.add("show");

    let stopRequested = false;

    const stopGeneration = async () => {
        stopRequested = true;
        try {
            await fetch("http://localhost:3000/stop", {
                method: "POST",
                headers: {"Content-Type": "application/json"},
                body: JSON.stringify({sessionId}),
            });
        } catch (err) {
            console.error("Stop error:", err);
        }
        stopButton.classList.remove("show");
    };

    stopButton.onclick = stopGeneration;

    const res = await fetch("http://localhost:3000/ask", {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({prompt, sessionId}),
    });

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let fullText = "";

    removeTypingIndicator();
    const botDiv = addMessage("", "bot", true);

    while (true) {
        if (stopRequested) break;
        const {done, value} = await reader.read();
        if (done) break;
        fullText += decoder.decode(value, {stream: true});
        botDiv.innerHTML = marked.parse(fullText);
        botDiv
            .querySelectorAll("pre code")
            .forEach((block) => hljs.highlightElement(block));
        scrollToBottom();
    }

    stopButton.classList.remove("show");
}


async function stopGeneration() {
    try {
        const res = await fetch("http://localhost:3000/stop", {
            method: "POST",
            headers: {"Content-Type": "application/json"},
            body: JSON.stringify({sessionId}),
        });
        const result = await res.json();
        console.log("Stop result:", result);
        stopButton.classList.remove("show"); // Hide stop button
    } catch (error) {
        console.error("Error stopping generation:", error);
    }
}

inputEl.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        askModel(inputEl.value.trim());
    }
});

stopButton.addEventListener("click", stopGeneration);