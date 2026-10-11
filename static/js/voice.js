"use strict";

window.SILIVoice = (() => {
let recognition = null;
let listening = false;
let currentAudio = null;
let audioUrl = null;

function setMicState(active) {
    listening = active;
    const mic = document.getElementById("micButton");

    if (mic) {
        mic.classList.toggle("listening", active);
        mic.setAttribute(
            "aria-label",
            active ? "Stop listening" : "Start voice input"
        );
    }
}

function stopSpeaking() {
    if (currentAudio) {
        currentAudio.pause();
        currentAudio.src = "";
        currentAudio = null;
    }

    if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
        audioUrl = null;
    }

    if ("speechSynthesis" in window) {
        window.speechSynthesis.cancel();
    }
}

async function speak(text) {
    const cleanText = String(text || "").trim();
    if (!cleanText) return;

    stopSpeaking();

    try {
        const response = await fetch("/api/speech", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Accept": "audio/mpeg"
            },
            body: JSON.stringify({ text: cleanText })
        });

        if (!response.ok) {
            browserSpeak(cleanText);
            return;
        }

        const audioBlob = await response.blob();

        if (!audioBlob.size) {
            browserSpeak(cleanText);
            return;
        }

        audioUrl = URL.createObjectURL(audioBlob);
        currentAudio = new Audio(audioUrl);

        currentAudio.onended = () => stopSpeaking();
        currentAudio.onerror = () => {
            stopSpeaking();
            browserSpeak(cleanText);
        };

        await currentAudio.play();
    } catch {
        browserSpeak(cleanText);
    }
}

function browserSpeak(text) {
    if (!("speechSynthesis" in window)) return;

    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "en-IN";
    utterance.rate = 1;

    window.speechSynthesis.speak(utterance);
}

function toggleListening(onResult, onError) {
    const SpeechRecognition =
        window.SpeechRecognition ||
        window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
        if (typeof onError === "function") {
            onError("Voice input is not supported by this browser.");
        }
        return;
    }

    if (listening && recognition) {
        recognition.stop();
        setMicState(false);
        return;
    }

    recognition = new SpeechRecognition();
    recognition.lang = "en-IN";
    recognition.interimResults = true;
    recognition.continuous = false;

    recognition.onstart = () => setMicState(true);

    recognition.onresult = (event) => {
        let transcript = "";

        for (let i = event.resultIndex; i < event.results.length; i++) {
            transcript += event.results[i][0].transcript;
        }

        if (transcript.trim() && typeof onResult === "function") {
            onResult(transcript.trim());
        }
    };

    recognition.onerror = (event) => {
        setMicState(false);

        if (typeof onError === "function") {
            onError(
                event.error === "not-allowed"
                    ? "Please allow microphone access in your browser."
                    : "Voice input failed. Please try again."
            );
        }
    };

    recognition.onend = () => {
        setMicState(false);
        recognition = null;
    };

    try {
        recognition.start();
    } catch {
        setMicState(false);

        if (typeof onError === "function") {
            onError("Could not start the microphone. Try again.");
        }
    }
}

return {
    speak,
    stopSpeaking,
    toggleListening
};

})();
