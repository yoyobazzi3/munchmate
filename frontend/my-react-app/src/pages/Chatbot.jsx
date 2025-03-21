import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import "./Chatbot.css"; // Import the CSS file

const Chatbot = () => {
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState("");
    const [isTyping, setIsTyping] = useState(false);
    const [showPrompts, setShowPrompts] = useState(true);
    const chatboxRef = useRef(null);

    useEffect(() => {
        const fetchChatHistory = async () => {
            const token = localStorage.getItem("token");
            if (!token) return;

            try {
                const response = await axios.get("http://localhost:8000/chatbot/history", {
                    headers: { Authorization: `Bearer ${token}` },
                });
                setMessages(response.data);
            } catch (error) {
                console.error("Error fetching chat history:", error);
            }
        };

        fetchChatHistory();
    }, []);

    useEffect(() => {
        // Scroll to the bottom of the chatbox when new messages are added
        if (chatboxRef.current) {
            chatboxRef.current.scrollTop = chatboxRef.current.scrollHeight;
        }
    }, [messages]);

    const sendMessage = async () => {
      if (!input.trim()) return;
  
      const userMessage = { sender: "user", text: input };
      setMessages([...messages, userMessage]);
      setInput("");
  
      try {
          const token = localStorage.getItem("token");
          if (!token) {
              console.error("No token found. User must log in.");
              return;
          }
  
          setIsTyping(true);
  
          // Send the message to the backend and wait for the full response
          const response = await axios.post(
              "http://localhost:8000/chatbot/ask", // Use the new route
              { message: input },
              { headers: { Authorization: `Bearer ${token}` } }
          );
  
          const botMessage = { sender: "bot", text: response.data.response };
          setMessages((prev) => [...prev, botMessage]);
  
      } catch (error) {
          console.error("Error sending message:", error);
          // Display an error message to the user
          const errorMessage = { sender: "bot", text: "Sorry, something went wrong. Please try again." };
          setMessages((prev) => [...prev, errorMessage]);
      } finally {
          setIsTyping(false);
      }
  };

    const handlePromptClick = (prompt) => {
        setInput(prompt); // Set the input textbox with the prompt
        setShowPrompts(false); // Hide the prompts section
    };

    return (
        <div className="munchmate-container">
            <div className="header">
                <h1>MunchMate Assistant</h1>
                <p>Your personal AI food guide. Ask me about restaurants, cuisines, or food recommendations.</p>
            </div>

            {showPrompts && (
                <div className="sections">
                    <div
                        className="section"
                        onClick={() => handlePromptClick("Date Night Spots")}
                    >
                        <h2>Date Night Spots</h2>
                        <p>Find romantic restaurants for a special evening</p>
                    </div>
                    <div
                        className="section"
                        onClick={() => handlePromptClick("Healthy Lunch Ideas")}
                    >
                        <h2>Healthy Lunch Ideas</h2>
                        <p>Quick and nutritious meal suggestions</p>
                    </div>
                    <div
                        className="section"
                        onClick={() => handlePromptClick("Italian Cuisine Guide")}
                    >
                        <h2>Italian Cuisine Guide</h2>
                        <p>Discover authentic Italian dishes and flavors</p>
                    </div>
                    <div
                        className="section"
                        onClick={() => handlePromptClick("Dietary Accommodations")}
                    >
                        <h2>Dietary Accommodations</h2>
                        <p>Find places that cater to specific dietary needs</p>
                    </div>
                </div>
            )}

            <div className="chatbot-container">
                <div className="chatbox" ref={chatboxRef}>
                    {messages.map((msg, index) => (
                        <div key={index} className={`message ${msg.sender}`}>
                            {msg.text}
                        </div>
                    ))}
                    {isTyping && <div className="message bot">...</div>}
                </div>
                <div className="input-area">
                    <input
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder="Ask for food recommendations..."
                    />
                    <button onClick={sendMessage}>Send</button>
                </div>
            </div>

            <div className="footer">
                <p>Ask about food, restaurants, or cuisines...</p>
                <p className="powered-by">Powered by MunchMate AI • Find the perfect meal for any occasion</p>
            </div>
        </div>
    );
};

export default Chatbot;