import { useState, useEffect, useRef } from "react";
import ReactMarkdown from "react-markdown";
import { FaArrowLeft, FaRegTrashAlt, FaMapMarkerAlt, FaPaperPlane } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import api from "../utils/axiosInstance";
import "./Chatbot.css";

// Large pool of suggestion prompts — 4 random ones shown each session
const ALL_SUGGESTIONS = [
  { emoji: "🍔", title: "Best burgers near me", desc: "Find top-rated burger spots in your area" },
  { emoji: "🍣", title: "Sushi spots tonight", desc: "Fresh sushi restaurants open now" },
  { emoji: "🌮", title: "Mexican restaurants", desc: "Discover top-rated Mexican food nearby" },
  { emoji: "🍕", title: "Pizza places close by", desc: "Cheesy, crispy pizza just around the corner" },
  { emoji: "🥗", title: "Vegetarian-friendly spots", desc: "Great restaurants with veggie-forward menus" },
  { emoji: "💑", title: "Romantic dinner spot", desc: "The perfect place for a special evening" },
  { emoji: "🍜", title: "Ramen or noodle soup", desc: "Warm, comforting bowls near you" },
  { emoji: "🥩", title: "Best steakhouse nearby", desc: "Prime cuts and great ambiance" },
  { emoji: "🍛", title: "Indian food cravings", desc: "Flavorful curries and naan near you" },
  { emoji: "☕", title: "Coffee & brunch spots", desc: "Chill spots for a relaxed morning" },
  { emoji: "🍱", title: "Quick lunch options", desc: "Fast, tasty meals for a busy day" },
  { emoji: "🍦", title: "Dessert places near me", desc: "Sweet endings to any meal" },
  { emoji: "🎉", title: "Group dining options", desc: "Large tables and shareable menus" },
  { emoji: "🐟", title: "Seafood restaurants", desc: "Fresh catches and ocean flavors" },
  { emoji: "🥪", title: "Best sandwich shops", desc: "Stacked deli subs and artisan sandwiches" },
];

const pickRandom = (arr, n) => {
  const shuffled = [...arr].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, n);
};

const Chatbot = () => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [showPrompts, setShowPrompts] = useState(true);
  const [error, setError] = useState(null);
  const [location, setLocation] = useState("");
  const [cuisine, setCuisine] = useState("");
  const [suggestions] = useState(() => pickRandom(ALL_SUGGESTIONS, 4));
  const navigate = useNavigate();
  const messagesEndRef = useRef(null);

  useEffect(() => {
    const fetchAll = async () => {
      // History
      try {
        const res = await api.get("/chatbot/history");
        if (res.data.sessions) {
          const msgs = [];
          res.data.sessions.forEach((s) =>
            s.conversations.forEach((c) => {
              msgs.push({ sender: "user", text: c.userMessage });
              msgs.push({ sender: "bot", text: c.botResponse });
            })
          );
          setMessages(msgs);
          if (msgs.length > 0) setShowPrompts(false);
        }
      } catch { /* history unavailable — start with empty messages */ }

      // Preferences
      try {
        const { data } = await api.get("/preferences");
        if (data.favoriteCuisines?.length) setCuisine(data.favoriteCuisines.join(", "));
      } catch { /* preferences unavailable — proceed without cuisine context */ }
    };

    fetchAll();
    fetchUserLocation();
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  const fetchUserLocation = () => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(async (pos) => {
      try {
        const res = await api.get(
          `/reverse-geocode?lat=${pos.coords.latitude}&lon=${pos.coords.longitude}`
        );
        const addr = res.data?.address;
        const city = addr?.city || addr?.town || addr?.suburb;
        if (city) setLocation(city);
      } catch { /* reverse geocode unavailable — location stays empty */ }
    });
  };

  const clearHistory = async () => {
    try {
      await api.delete("/chatbot/clear");
      setMessages([]);
      setShowPrompts(true);
    } catch {
      setError("Failed to clear chat history");
    }
  };

  const sendMessage = async (messageText) => {
    const text = (messageText || input).trim();
    if (!text || isTyping) return;

    setMessages((prev) => [...prev, { sender: "user", text }]);
    setInput("");
    setShowPrompts(false);
    setError(null);
    setIsTyping(true);

    try {
      const res = await api.post("/chatbot/ask", {
        message: text,
        location,
        cuisine,
        instruction: "focus on restaurant recommendations only, no recipes",
      });

      if (res.data.response) {
        setMessages((prev) => [...prev, { sender: "bot", text: res.data.response }]);
      } else {
        setError(res.data.error || "Failed to get response");
      }
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        { sender: "bot", text: err.response?.data?.error || "Sorry, something went wrong. Please try again." },
      ]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="cb-page">

      {/* Sidebar */}
      <div className="cb-sidebar">
        <div className="cb-sidebar-top">
          <div className="cb-logo">
            <img src="/logo.png" alt="MunchMate" className="cb-logo-img" />
            <span>MunchMate</span>
          </div>
          <button className="cb-back-btn" onClick={() => navigate("/home")}>
            <FaArrowLeft /> Home
          </button>
        </div>

        <div className="cb-sidebar-info">
          <p className="cb-sidebar-label">Session Context</p>
          <div className="cb-context-pill">
            <FaMapMarkerAlt />
            <span>{location || "Detecting location…"}</span>
          </div>
          {cuisine && (
            <div className="cb-context-pill">
              <span>🍽</span>
              <span>{cuisine}</span>
            </div>
          )}
          <button className="cb-edit-prefs" onClick={() => navigate("/profile")}>
            Edit Preferences
          </button>
        </div>

        {messages.length > 0 && (
          <button className="cb-clear-btn" onClick={clearHistory}>
            <FaRegTrashAlt /> Clear History
          </button>
        )}

        <div className="cb-sidebar-footer">
          Powered by MunchMate AI
        </div>
      </div>

      {/* Main chat area */}
      <div className="cb-main">

        {/* Messages */}
        <div className="cb-messages">
          {showPrompts && (
            <div className="cb-welcome">
              <h1>What are you craving?</h1>
              <p>Tell me what you're in the mood for and I'll find the perfect spot near you.</p>
              <div className="cb-suggestions">
                {suggestions.map((s, i) => (
                  <button
                    key={i}
                    className="cb-suggestion-card"
                    onClick={() => sendMessage(s.title)}
                  >
                    <span className="cb-suggestion-emoji">{s.emoji}</span>
                    <div>
                      <strong>{s.title}</strong>
                      <p>{s.desc}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((msg, i) => (
            <div key={i} className={`cb-msg cb-msg--${msg.sender}`}>
              {msg.sender === "bot" && (
                <div className="cb-msg-avatar">🍽</div>
              )}
              <div className="cb-msg-bubble">
                {msg.sender === "bot"
                  ? <ReactMarkdown>{msg.text}</ReactMarkdown>
                  : msg.text
                }
              </div>
            </div>
          ))}

          {isTyping && (
            <div className="cb-msg cb-msg--bot">
              <div className="cb-msg-avatar">🍽</div>
              <div className="cb-msg-bubble cb-typing">
                <span /><span /><span />
              </div>
            </div>
          )}

          {error && <p className="cb-error">{error}</p>}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="cb-input-area">
          <div className="cb-input-wrapper">
            <input
              className="cb-input"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask me anything about food near you…"
              disabled={isTyping}
            />
            <button
              className="cb-send-btn"
              onClick={() => sendMessage()}
              disabled={!input.trim() || isTyping}
            >
              <FaPaperPlane />
            </button>
          </div>
          <p className="cb-input-hint">Press Enter to send · Shift+Enter for new line</p>
        </div>

      </div>
    </div>
  );
};

export default Chatbot;