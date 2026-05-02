import { useState, useEffect, useRef } from "react";
import ReactMarkdown from "react-markdown";
import { FaArrowLeft, FaRegTrashAlt, FaMapMarkerAlt, FaPaperPlane } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { getChatHistory, sendMessage as sendChatMessage, clearHistory } from "../services/chatbotService";
import { reverseGeocode } from "../services/geoService";
import { usePreferences } from "../hooks/usePreferences";
import { ROUTES } from "../utils/routes";
import { getErrorMessage } from "../utils/errorHandler";
import { ALL_SUGGESTIONS, CHATBOT_INSTRUCTION, CHATBOT_SUGGESTIONS_COUNT } from "../utils/chatbotConstants";
import { pickRandom } from "../utils/arrayUtils";
import "./Chatbot.css";

/**
 * A reusable sidebar component for the Chatbot page to display context and actions.
 * 
 * @param {Object} props
 * @param {string} props.location - Current user location.
 * @param {string} props.cuisine - Cuisine preferences in string format.
 * @param {boolean} props.hasMessages - Flag indicating if there are messages to clear.
 * @param {function} props.onClear - Callback to clear the conversation history.
 * @param {function} props.onNavigate - Navigation routing.
 */
const ChatbotSidebar = ({ location, cuisine, hasMessages, onClear, onNavigate }) => (
  <div className="cb-sidebar">
    <div className="cb-sidebar-top">
      <div className="cb-logo">
        <img src="/logo.png" alt="MunchMate" className="cb-logo-img" />
        <span>MunchMate</span>
      </div>
      <button className="cb-back-btn" onClick={() => onNavigate(ROUTES.HOME)}>
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
      <button className="cb-edit-prefs" onClick={() => onNavigate(ROUTES.PROFILE)}>
        Edit Preferences
      </button>
    </div>

    {hasMessages && (
      <button className="cb-clear-btn" onClick={onClear}>
        <FaRegTrashAlt /> Clear History
      </button>
    )}

    <div className="cb-sidebar-footer">Powered by MunchMate AI</div>
  </div>
);

/**
 * A singular rendering implementation of a chatbot message wrapper.
 * 
 * @param {Object} props
 * @param {Object} props.msg - The message.
 * @param {boolean} props.isTyping - Whether to show typing UI.
 */
const ChatbotMessage = ({ msg, isTyping }) => {
  if (isTyping) {
    return (
      <div className="cb-msg cb-msg--bot">
        <div className="cb-msg-avatar">🍽</div>
        <div className="cb-msg-bubble cb-typing">
          <span /><span /><span />
        </div>
      </div>
    );
  }

  return (
    <div className={`cb-msg cb-msg--${msg.sender}`}>
      {msg.sender === "bot" && <div className="cb-msg-avatar">🍽</div>}
      <div className="cb-msg-bubble">
        {msg.sender === "bot" ? <ReactMarkdown>{msg.text}</ReactMarkdown> : msg.text}
      </div>
    </div>
  );
};

/**
 * The sophisticated AI Chat conversation interface integrating direct context references 
 * for geo-spatial coordinates and personal profile tastes.
 *
 * @component
 * @returns {JSX.Element} Chatbot view.
 */
const Chatbot = () => {
  const [messages,     setMessages    ] = useState([]);
  const [input,        setInput       ] = useState("");
  const [isTyping,     setIsTyping    ] = useState(false);
  const [showPrompts,  setShowPrompts ] = useState(true);
  const [error,        setError       ] = useState(null);
  const [location,     setLocation    ] = useState("");
  const [cuisine,      setCuisine     ] = useState("");
  const [prefsToast,   setPrefsToast  ] = useState(false);
  const [suggestions]                   = useState(() => pickRandom(ALL_SUGGESTIONS, CHATBOT_SUGGESTIONS_COUNT));
  const navigate        = useNavigate();
  const messagesEndRef  = useRef(null);

  const { preferences, refreshPreferences } = usePreferences();

  useEffect(() => {
    if (preferences?.favoriteCuisines?.length) {
      setCuisine(preferences.favoriteCuisines.join(", "));
    }
  }, [preferences]);

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const res = await getChatHistory();
        if (res.sessions) {
          const msgs = [];
          res.sessions.forEach((s) =>
            s.conversations.forEach((c) => {
              msgs.push({ sender: "user", text: c.userMessage });
              msgs.push({ sender: "bot",  text: c.botResponse  });
            })
          );
          setMessages(msgs);
          if (msgs.length > 0) setShowPrompts(false);
        }
      } catch { /* history unavailable — start with empty messages */ }
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
        const res  = await reverseGeocode(pos.coords.latitude, pos.coords.longitude);
        const addr = res?.address;
        const city = addr?.city || addr?.town || addr?.suburb;
        if (city) setLocation(city);
      } catch { /* reverse geocode unavailable */ }
    });
  };

  /**
   * Resets local state while destroying database conversation markers.
   */
  const handleClearHistory = async () => {
    try {
      await clearHistory();
      setMessages([]);
      setShowPrompts(true);
    } catch {
      setError("Failed to clear chat history");
    }
  };

  /**
   * Orchestrates appending messages directly locally and buffering via typing bubbles 
   * whilst delegating backend communications for replies.
   * 
   * @param {string} [messageText] - Defaults to input stream if bypassed natively.
   */
  const sendMessage = async (messageText) => {
    const text = (messageText || input).trim();
    if (!text || isTyping) return;

    setMessages((prev) => [...prev, { sender: "user", text }]);
    setInput("");
    setShowPrompts(false);
    setError(null);
    setIsTyping(true);

    try {
      const res = await sendChatMessage({ message: text, location, cuisine, instruction: CHATBOT_INSTRUCTION });
      if (res.response) {
        setMessages((prev) => [...prev, { sender: "bot", text: res.response }]);
        if (res.preferencesUpdated) {
          setPrefsToast(true);
          refreshPreferences();
          setTimeout(() => setPrefsToast(false), 4000);
        }
      } else {
        setError(res.error || "Failed to get response");
      }
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        { sender: "bot", text: getErrorMessage(err, "Sorry, something went wrong. Please try again.") },
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

      <ChatbotSidebar 
        location={location}
        cuisine={cuisine}
        hasMessages={messages.length > 0}
        onClear={handleClearHistory}
        onNavigate={navigate}
      />

      {/* Main chat area */}
      <div className="cb-main">
        <div className="cb-messages">
          {showPrompts && (
            <div className="cb-welcome">
              <h1>What are you craving?</h1>
              <p>Tell me what you're in the mood for and I'll find the perfect spot near you.</p>
              <div className="cb-suggestions">
                {suggestions.map((s, i) => (
                  <button key={i} className="cb-suggestion-card" onClick={() => sendMessage(s.title)}>
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
            <ChatbotMessage key={i} msg={msg} />
          ))}

          {isTyping && <ChatbotMessage isTyping />}

          {error && <p className="cb-error">{error}</p>}
          <div ref={messagesEndRef} />
        </div>

        {prefsToast && (
          <div className="cb-prefs-toast">
            Your food preferences were updated based on this conversation.
          </div>
        )}

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
