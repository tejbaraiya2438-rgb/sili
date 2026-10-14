/* ==========================================
   SILI-PRO | Main Frontend Controller
   Silver Oak University Campus Assistant
   ========================================== */

"use strict";

const SILI = (() => {
    const elements = {
        welcome: document.getElementById("welcome"),
        messages: document.getElementById("messages"),
        input: document.getElementById("messageInput"),
        send: document.getElementById("sendButton"),
        newChat: document.getElementById("newChat"),
        mic: document.getElementById("micButton"),
        sidebar: document.getElementById("sidebar"),
        menu: document.getElementById("menuButton"),
        closeSidebar: document.getElementById("closeSidebar"),
        toast: document.getElementById("toast")
    };

    let isSending = false;
    let activeController = null;
    let toastTimer = null;

    const API_URL = "/api/chat";

    function showToast(message) {
        if (!elements.toast) return;

        elements.toast.textContent = message;
        elements.toast.classList.add("show");

        clearTimeout(toastTimer);
        toastTimer = setTimeout(() => {
            elements.toast.classList.remove("show");
        }, 3000);
    }

    function closeSidebar() {
        elements.sidebar?.classList.remove("open");
    }

    function openSidebar() {
        elements.sidebar?.classList.add("open");
    }

    function scrollToLatest() {
        requestAnimationFrame(() => {
            window.scrollTo({
                top: document.body.scrollHeight,
                behavior: "smooth"
            });

            elements.messages?.lastElementChild?.scrollIntoView({
                behavior: "smooth",
                block: "nearest"
            });
        });
    }

    function createMessage(role, text) {
        const isUser = role === "user";

        const wrapper = document.createElement("article");
        wrapper.className = `message ${isUser ? "user" : "assistant"}`;

        const avatar = document.createElement("div");
        avatar.className = "message-avatar";
        avatar.textContent = isUser ? "Y" : "S";
        avatar.setAttribute("aria-hidden", "true");

        const content = document.createElement("div");
        content.className = "message-content";

        const name = document.createElement("div");
        name.className = "message-name";
        name.textContent = isUser ? "You" : "SILI";

        const bubble = document.createElement("div");
        bubble.className = "message-bubble";
        bubble.textContent = text;

        content.append(name, bubble);
        wrapper.append(avatar, content);
        elements.messages.appendChild(wrapper);

        return { wrapper, content, bubble };
    }

    function addAssistantTools(content, text) {
        const tools = document.createElement("div");
        tools.className = "message-tools";

        const copyButton = document.createElement("button");
        copyButton.type = "button";
        copyButton.className = "message-tool";
        copyButton.textContent = "Copy";

        copyButton.addEventListener("click", async () => {
            try {
                await navigator.clipboard.writeText(text);
                showToast("Response copied");
            } catch {
                showToast("Copy is not available in this browser");
            }
        });

        tools.appendChild(copyButton);

        if (
            window.SILIVoice &&
            typeof window.SILIVoice.speak === "function"
        ) {
            const speakButton = document.createElement("button");
            speakButton.type = "button";
            speakButton.className = "message-tool";
            speakButton.textContent = "🔊 Listen";

            speakButton.addEventListener("click", () => {
                window.SILIVoice.speak(text);
            });

            tools.appendChild(speakButton);
        }

        content.appendChild(tools);
    }

    function showTyping() {
        const message = createMessage("assistant", "");
        message.wrapper.classList.add("typing-message");

        const indicator = document.createElement("div");
        indicator.className = "typing-indicator";
        indicator.setAttribute("aria-label", "SILI is thinking");

        for (let i = 0; i < 3; i++) {
            indicator.appendChild(document.createElement("span"));
        }

        message.bubble.appendChild(indicator);
        return message.wrapper;
    }

    function setSending(value) {
        isSending = value;
        elements.send.disabled = value || !elements.input.value.trim();
        elements.input.disabled = value;

        elements.send.innerHTML = value ? "<span>…</span>" : "<span>↑</span>";

        if (!value) {
            elements.input.disabled = false;
        }
    }

    function resizeInput() {
        elements.input.style.height = "auto";
        elements.input.style.height =
            Math.min(elements.input.scrollHeight, 160) + "px";
    }

    function extractReply(data) {
        if (!data || typeof data !== "object") {
            throw new Error("The server returned an invalid response.");
        }

        const reply =
            data.reply ??
            data.response ??
            data.answer ??
            data.message ??
            data.data?.reply;

        if (typeof reply !== "string" || !reply.trim()) {
            throw new Error(
                data.detail ||
                data.error ||
                "SILI did not return a response. Please try again."
            );
        }

        return reply.trim();
    }

    async function askBackend(message) {
        activeController = new AbortController();

        const response = await fetch(API_URL, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Accept": "application/json"
            },
            body: JSON.stringify({ message }),
            signal: activeController.signal
        });

        let data;

        try {
            data = await response.json();
        } catch {
            throw new Error(
                "The server response was not valid JSON. Check the backend."
            );
        }

        if (!response.ok) {
            const detail =
                typeof data.detail === "string"
                    ? data.detail
                    : `Request failed (${response.status}).`;

            throw new Error(detail);
        }

        return extractReply(data);
    }

    async function sendMessage(prefilledMessage, source = "text") {
        if (isSending) return;

        const message = (
            typeof prefilledMessage === "string"
                ? prefilledMessage
                : elements.input.value
        ).trim();

        if (!message) return;

        if (message.length > 1000) {
            showToast("Please keep your message under 1000 characters.");
            return;
        }

        // Only microphone-originated questions get automatic voice replies.
        const shouldAutoSpeak = source === "voice";

        // Typed input must never trigger automatic speech.
        // Also stop any previous speech when a typed question is sent.
        if (!shouldAutoSpeak && window.SILIVoice &&
            typeof window.SILIVoice.stopSpeaking === "function") {
            window.SILIVoice.stopSpeaking();
        }

        console.log(
            "[SILI] Input mode:",
            shouldAutoSpeak ? "VOICE — auto-speak enabled" : "TEXT — auto-speak disabled"
        );
        console.log("[SILI DEBUG] Input source:", source,
                    "| Automatic voice:", shouldAutoSpeak);

        if (elements.welcome) {
            elements.welcome.hidden = true;
        }

        createMessage("user", message);

        elements.input.value = "";
        resizeInput();
        closeSidebar();
        setSending(true);
        scrollToLatest();

        const typing = showTyping();
        scrollToLatest();

        try {
            const reply = await askBackend(message);

            typing.remove();

            const assistantMessage = createMessage("assistant", reply);
            addAssistantTools(assistantMessage.content, reply);

            // Voice question: speak automatically.
            // Typed question: text only; user can tap Listen.
            if (
                shouldAutoSpeak &&
                window.SILIVoice &&
                typeof window.SILIVoice.speak === "function"
            ) {
                if (shouldAutoSpeak) {
                    window.SILIVoice.speak(reply);
                }
            }

        } catch (error) {
            typing.remove();

            if (error.name === "AbortError") {
                return;
            }

            console.error("SILI request failed:", error);

            const errorMessage =
                error instanceof TypeError
                    ? "I couldn't connect to the server. Make sure SILI-PRO's backend is running and try again."
                    : error.message || "Something went wrong. Please try again.";

            const assistantMessage = createMessage("assistant", errorMessage);
            assistantMessage.wrapper.classList.add("error-message");

            const retry = document.createElement("button");
            retry.type = "button";
            retry.className = "message-tool";
            retry.textContent = "Try again";

            retry.addEventListener("click", () => {
                sendMessage(message, source);
            });

            assistantMessage.content.appendChild(retry);

        } finally {
            activeController = null;
            setSending(false);
            elements.input.focus();
            scrollToLatest();
        }
    }

    function resetChat() {
        if (activeController) {
            activeController.abort();
            activeController = null;
        }

        isSending = false;
        elements.messages.replaceChildren();
        elements.input.value = "";
        resizeInput();
        setSending(false);
        closeSidebar();

        if (elements.welcome) {
            elements.welcome.hidden = false;
        }

        if (
            window.SILIVoice &&
            typeof window.SILIVoice.stopSpeaking === "function"
        ) {
            window.SILIVoice.stopSpeaking();
        }

        elements.input.focus();
    }

    function bindSuggestions() {
        document.querySelectorAll("[data-prompt]").forEach(button => {
            button.addEventListener("click", () => {
                const prompt = button.getAttribute("data-prompt");
                if (prompt) sendMessage(prompt, "text");
            });
        });
    }

    function bindNavigation() {
        document.querySelectorAll(".nav-item").forEach(button => {
            button.addEventListener("click", () => {
                document.querySelectorAll(".nav-item").forEach(item => {
                    item.classList.remove("active");
                });

                button.classList.add("active");
            });
        });
    }

    function bindVoiceInput() {
        if (!elements.mic) return;

        elements.mic.addEventListener("click", () => {
            if (
                window.SILIVoice &&
                typeof window.SILIVoice.toggleListening === "function"
            ) {
                window.SILIVoice.toggleListening(
                    transcript => {
                        if (transcript && transcript.trim()) {
                            sendMessage(transcript.trim(), "voice");
                        }
                    },
                    message => showToast(message)
                );
            } else {
                showToast("Voice input is not available yet.");
            }
        });
    }

    function init() {
        elements.send.addEventListener("click", () => {
            sendMessage(undefined, "text");
        });

        elements.input.addEventListener("input", () => {
            resizeInput();
            elements.send.disabled =
                isSending || !elements.input.value.trim();
        });

        elements.input.addEventListener("keydown", event => {
            if (
                event.key === "Enter" &&
                !event.shiftKey &&
                !event.isComposing
            ) {
                event.preventDefault();
                sendMessage(undefined, "text");
            }
        });

        elements.newChat.addEventListener("click", resetChat);
        elements.menu?.addEventListener("click", openSidebar);
        elements.closeSidebar?.addEventListener("click", closeSidebar);

        document.addEventListener("keydown", event => {
            if (event.key === "Escape") closeSidebar();
        });

        document.addEventListener("click", event => {
            if (
                window.innerWidth <= 650 &&
                elements.sidebar?.classList.contains("open") &&
                !elements.sidebar.contains(event.target) &&
                !elements.menu?.contains(event.target)
            ) {
                closeSidebar();
            }
        });

        bindSuggestions();
        bindNavigation();
        bindVoiceInput();
        resizeInput();

        console.log("SILI-PRO frontend initialized.");
    }

    return {
        init,
        sendMessage,
        resetChat,
        showToast
    };
})();

document.addEventListener("DOMContentLoaded", SILI.init);
