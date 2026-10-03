let chatbotData = [];

const messages = document.getElementById("messages");
const input = document.getElementById("questionInput");
const sendButton = document.getElementById("sendButton");
const welcome = document.getElementById("welcome");


/* =========================
   LOAD DATASET
========================= */

async function loadChatbotData() {

    try {

        const response = await fetch("data/chatbot.json");

        if (!response.ok) {
            throw new Error("Could not load data/chatbot.json");
        }

        const data = await response.json();

        chatbotData = data.questions;

        console.log("SILI dataset loaded:", chatbotData.length);

    } catch (error) {

        console.error("Dataset error:", error);

        addBotMessage(
            "Sorry, SILI could not load its knowledge base."
        );
    }
}


/* =========================
   FIND QUESTION
========================= */

function findQuestion(userText) {

    const text = userText
        .toLowerCase()
        .trim();

    if (!text) {
        return null;
    }


    /*
        FIRST:
        Exact question match
    */

    let exactMatch = chatbotData.find(item =>
        item.question.toLowerCase() === text
    );

    if (exactMatch) {
        return exactMatch;
    }


    /*
        SECOND:
        Keyword match
    */

    let keywordMatch = chatbotData.find(item => {

        return item.keywords.some(keyword =>
            text.includes(keyword.toLowerCase())
        );

    });

    if (keywordMatch) {
        return keywordMatch;
    }


    /*
        THIRD:
        Basic word matching
    */

    const userWords = text
        .split(/\s+/)
        .filter(word => word.length > 2);


    let bestQuestion = null;
    let bestScore = 0;


    chatbotData.forEach(item => {

        const searchableText = (
            item.question + " " +
            item.keywords.join(" ")
        ).toLowerCase();


        let score = 0;


        userWords.forEach(word => {

            if (searchableText.includes(word)) {
                score++;
            }

        });


        if (score > bestScore) {

            bestScore = score;
            bestQuestion = item;

        }

    });


    if (bestScore > 0) {
        return bestQuestion;
    }


    return null;
}


/* =========================
   ADD USER MESSAGE
========================= */

function addUserMessage(text) {

    const row = document.createElement("div");

    row.className = "message-row user";


    const message = document.createElement("div");

    message.className = "message user";

    message.textContent = text;


    row.appendChild(message);

    messages.appendChild(row);

}


/* =========================
   ADD BOT MESSAGE
========================= */

function addBotMessage(text, relatedQuestions = []) {

    const row = document.createElement("div");

    row.className = "message-row bot";


    const wrapper = document.createElement("div");


    const message = document.createElement("div");

    message.className = "message bot";


    /*
        BOT HEADER
    */

    const header = document.createElement("div");

    header.className = "bot-header";


    const miniLogo = document.createElement("div");

    miniLogo.className = "bot-mini-logo";

    miniLogo.textContent = "S";


    const botName = document.createElement("span");

    botName.textContent = "SILI";


    header.appendChild(miniLogo);

    header.appendChild(botName);


    /*
        ANSWER
    */

    const answer = document.createElement("div");

    answer.textContent = text;


    message.appendChild(header);

    message.appendChild(answer);


    wrapper.appendChild(message);


    /*
        RELATED QUESTIONS
    */

    if (relatedQuestions.length > 0) {

        const relatedSection = document.createElement("div");

        relatedSection.className = "related-section";


        const title = document.createElement("div");

        title.className = "related-title";

        title.textContent = "You may also ask:";


        const list = document.createElement("div");

        list.className = "related-list";


        relatedQuestions.forEach(question => {

            const button = document.createElement("button");

            button.className = "related-question";

            button.textContent = question.question;


            button.addEventListener("click", () => {

                handleQuestion(question.question);

            });


            list.appendChild(button);

        });


        relatedSection.appendChild(title);

        relatedSection.appendChild(list);

        wrapper.appendChild(relatedSection);

    }


    row.appendChild(wrapper);

    messages.appendChild(row);


    scrollToBottom();

}


/* =========================
   HANDLE QUESTION
========================= */

function handleQuestion(questionText) {

    if (!questionText.trim()) {
        return;
    }


    /*
        Remove welcome screen
    */

    welcome.style.display = "none";


    /*
        Show user question
    */

    addUserMessage(questionText);


    /*
        Find predefined question
    */

    const question = findQuestion(questionText);


    /*
        No answer found
    */

    if (!question) {

        addBotMessage(
            "I couldn't find a predefined answer for that question. Please try asking about Silver Oak University, admissions, courses, campus, departments or other topics available in my knowledge base."
        );

        input.value = "";

        return;
    }


    /*
        Find 3 related questions
    */

    const relatedQuestions = question.related
        .map(id =>
            chatbotData.find(item => item.id === id)
        )
        .filter(Boolean)
        .slice(0, 3);


    /*
        Show answer
    */

    addBotMessage(
        question.answer,
        relatedQuestions
    );


    /*
        Clear input
    */

    input.value = "";

}


/* =========================
   SEND BUTTON
========================= */

sendButton.addEventListener("click", () => {

    handleQuestion(input.value);

});


/* =========================
   ENTER KEY
========================= */

input.addEventListener("keydown", event => {

    if (event.key === "Enter") {

        event.preventDefault();

        handleQuestion(input.value);

    }

});


/* =========================
   AUTO SCROLL
========================= */

function scrollToBottom() {

    setTimeout(() => {

        const container =
            document.querySelector(".chat-container");

        container.scrollTo({
            top: container.scrollHeight,
            behavior: "smooth"
        });

    }, 50);

}


/* =========================
   START SILI
========================= */

loadChatbotData();