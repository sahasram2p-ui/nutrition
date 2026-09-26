"""
app.py

Flask backend for the Nutrition Assistant chatbot.

Exposes:
    GET  /                -> renders the chat UI (templates/index.html)
    POST /api/chat         -> receives {"message": "..."} and returns
                               {"success": true, "reply": "..."} or
                               {"success": false, "error": "..."}

The Gemini API key and model name are loaded from the .env file via
config.py and are never exposed to the frontend.
"""

from flask import Flask, render_template, request, jsonify
from google import genai

import config

app = Flask(__name__)

# ---------------------------------------------------------------------
# Initialize the Gemini client using the API key loaded from .env
# ---------------------------------------------------------------------
if not config.GEMINI_API_KEY:
    raise RuntimeError(
        "GEMINI_API_KEY is missing. Please set it in the .env file."
    )

client = genai.Client(api_key=config.GEMINI_API_KEY)


@app.route("/")
def index():
    """Render the main chat page."""
    return render_template(
        "index.html",
        chatbot_title=config.CHATBOT_TITLE,
        chatbot_subtitle=config.CHATBOT_SUBTITLE,
        chatbot_domain=config.CHATBOT_DOMAIN,
    )


@app.route("/api/chat", methods=["POST"])
def chat():
    """Handle a chat message and return the Gemini response as JSON."""
    try:
        data = request.get_json(silent=True) or {}
        user_message = (data.get("message") or "").strip()

        # ---- Basic validation ----
        if not user_message:
            return jsonify({
                "success": False,
                "error": "Please enter a message before sending."
            }), 400

        if len(user_message) > 2000:
            return jsonify({
                "success": False,
                "error": "Your message is too long. Please shorten it."
            }), 400

        # ---- Call the Gemini API with the domain-restricting system prompt ----
        response = client.models.generate_content(
            model=config.GEMINI_MODEL,
            contents=user_message,
            config={
                "system_instruction": config.SYSTEM_PROMPT,
            },
        )

        reply_text = (response.text or "").strip()

        if not reply_text:
            reply_text = (
                f"Sorry, I can answer only {config.CHATBOT_DOMAIN}-related questions."
            )

        return jsonify({"success": True, "reply": reply_text})

    except Exception as exc:  # noqa: BLE001 - return a friendly error to the UI
        return jsonify({
            "success": False,
            "error": f"Something went wrong while contacting the AI service: {exc}"
        }), 500


if __name__ == "__main__":
    app.run(debug=True, host="0.0.0.0", port=5000)
