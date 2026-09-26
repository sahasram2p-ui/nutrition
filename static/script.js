// =====================================================
// Nutrition Assistant — Frontend chat logic
// =====================================================

const chatArea = document.getElementById("chatArea");
const messagesEl = document.getElementById("messages");
const welcomeScreen = document.getElementById("welcomeScreen");
const composerForm = document.getElementById("composerForm");
const messageInput = document.getElementById("messageInput");
const sendBtn = document.getElementById("sendBtn");

const sidebar = document.getElementById("sidebar");
const sidebarOverlay = document.getElementById("sidebarOverlay");
const menuBtn = document.getElementById("menuBtn");
const sidebarClose = document.getElementById("sidebarClose");

let isWaiting = false;

// -----------------------------------------------------
// Sidebar (mobile) toggle
// -----------------------------------------------------
function openSidebar() {
  sidebar.classList.add("open");
  sidebarOverlay.classList.add("show");
}

function closeSidebar() {
  sidebar.classList.remove("open");
  sidebarOverlay.classList.remove("show");
}

menuBtn.addEventListener("click", openSidebar);
sidebarClose.addEventListener("click", closeSidebar);
sidebarOverlay.addEventListener("click", closeSidebar);

// -----------------------------------------------------
// Quick suggestion / category buttons
// -----------------------------------------------------
document.querySelectorAll("[data-prompt]").forEach((btn) => {
  btn.addEventListener("click", () => {
    const prompt = btn.getAttribute("data-prompt");
    messageInput.value = prompt;
    closeSidebar();
    sendMessage(prompt);
  });
});

// -----------------------------------------------------
// Helpers
// -----------------------------------------------------
function scrollToBottom() {
  chatArea.scrollTop = chatArea.scrollHeight;
}

function hideWelcomeScreen() {
  if (welcomeScreen.style.display !== "none") {
    welcomeScreen.style.display = "none";
  }
}

function appendMessage(role, text) {
  const msg = document.createElement("div");
  msg.className = `msg ${role}`;

  const avatar = document.createElement("div");
  avatar.className = "msg-avatar";
  avatar.textContent = role === "user" ? "🧑" : "🥗";

  const bubble = document.createElement("div");
  bubble.className = "bubble";
  bubble.textContent = text;

  msg.appendChild(avatar);
  msg.appendChild(bubble);
  messagesEl.appendChild(msg);
  scrollToBottom();
  return bubble;
}

function appendTypingIndicator() {
  const msg = document.createElement("div");
  msg.className = "msg bot";
  msg.id = "typingIndicator";

  const avatar = document.createElement("div");
  avatar.className = "msg-avatar";
  avatar.textContent = "🥗";

  const bubble = document.createElement("div");
  bubble.className = "bubble typing";
  bubble.innerHTML = "<span></span><span></span><span></span>";

  msg.appendChild(avatar);
  msg.appendChild(bubble);
  messagesEl.appendChild(msg);
  scrollToBottom();
}

function removeTypingIndicator() {
  const el = document.getElementById("typingIndicator");
  if (el) el.remove();
}

function setSending(state) {
  isWaiting = state;
  sendBtn.disabled = state;
  messageInput.disabled = state;
}

// -----------------------------------------------------
// Core send logic
// -----------------------------------------------------
async function sendMessage(rawText) {
  const text = (rawText !== undefined ? rawText : messageInput.value).trim();

  if (!text || isWaiting) return;

  hideWelcomeScreen();
  appendMessage("user", text);
  messageInput.value = "";
  setSending(true);
  appendTypingIndicator();

  try {
    const response = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: text }),
    });

    const data = await response.json();
    removeTypingIndicator();

    if (data.success) {
      appendMessage("bot", data.reply);
    } else {
      const bubble = appendMessage("bot", data.error || "Something went wrong. Please try again.");
      bubble.closest(".msg").classList.add("error");
    }
  } catch (err) {
    removeTypingIndicator();
    const bubble = appendMessage("bot", "Network error. Please check your connection and try again.");
    bubble.closest(".msg").classList.add("error");
  } finally {
    setSending(false);
    messageInput.focus();
  }
}

// -----------------------------------------------------
// Event listeners
// -----------------------------------------------------
composerForm.addEventListener("submit", (e) => {
  e.preventDefault();
  sendMessage();
});

messageInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter" && !e.shiftKey) {
    e.preventDefault();
    sendMessage();
  }
});
