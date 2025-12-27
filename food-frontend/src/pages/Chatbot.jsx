import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import ReactMarkdown from 'react-markdown';
import "./Chatbot.css";

// If you don't have react-markdown installed, run:
// npm install react-markdown

const API_BASE_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:8000";

const Chatbot = () => {
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState("");
    const [isTyping, setIsTyping] = useState(false);
    const [showPrompts, setShowPrompts] = useState(true);
    const [error, setError] = useState(null);
    const [location, setLocation] = useState("");
    const [cuisine, setCuisine] = useState("");
    const [dietary, setDietary] = useState("");
    const [streamingText, setStreamingText] = useState("");
    const messagesContainerRef = useRef(null);

    // Setup axios instance with default configuration
    const api = axios.create({
        baseURL: API_BASE_URL,
        headers: {
            "Content-Type": "application/json"
        }
    });

    // Add auth token to all requests
    api.interceptors.request.use(config => {
        const token = localStorage.getItem("token");
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    }, error => {
        return Promise.reject(error);
    });

    // Fetch chat history on component mount
    useEffect(() => {
        const fetchChatHistory = async () => {
            const token = localStorage.getItem("token");
            if (!token) return;

            try {
                setError(null);
                const response = await api.get("/chatbot/history");

                if (response.data.success) {
                    // Convert the history to message format
                    const historyMessages = [];
                    
                    // Flatten the sessions structure
                    response.data.data.sessions.forEach(session => {
                        session.conversations.forEach(conv => {
                            historyMessages.push({ sender: "user", text: conv.userMessage });
                            historyMessages.push({ sender: "bot", text: conv.botResponse });
                        });
                    });
                    
                    setMessages(historyMessages);
                    
                    // If there are existing messages, hide the prompts
                    if (historyMessages.length > 0) {
                        setShowPrompts(false);
                    }
                }
            } catch (err) {
                console.error("Error fetching chat history:", err);
                setError("Failed to load chat history");
            }
        };

        fetchChatHistory();
        fetchUserLocation();
    }, []);

    // Auto-scroll to bottom when messages change
    useEffect(() => {
        if (messagesContainerRef.current) {
            messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
        }
    }, [messages, streamingText]);
    
    // Get user's location from browser
    const fetchUserLocation = () => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                async (position) => {
                    try {
                        // Convert coordinates to address using a reverse geocoding service
                        const response = await axios.get(
                            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${position.coords.latitude}&lon=${position.coords.longitude}`
                        );
                        
                        if (response.data && response.data.address) {
                            const address = response.data.address;
                            const locationStr = address.city || address.town || address.suburb;
                            if (locationStr) {
                                setLocation(locationStr);
                            }
                        }
                    } catch (err) {
                        console.error("Error fetching location details:", err);
                    }
                },
                (error) => {
                    console.log("Error getting location:", error);
                }
            );
        }
    };

    const clearHistory = async () => {
        try {
            const response = await api.delete("/chatbot/clear");
            if (response.data.success) {
                setMessages([]);
                setShowPrompts(true);
                setStreamingText("");
            }
        } catch (err) {
            console.error("Error clearing history:", err);
            setError("Failed to clear chat history");
        }
    };

    // Use simulated streaming with the regular endpoint
    const sendMessage = async () => {
        if (!input.trim()) return;

        const userMessage = { sender: "user", text: input };
        const userInput = input; // Store input before clearing
        setMessages(prev => [...prev, userMessage]);
        setInput("");
        setShowPrompts(false);
        setError(null);
        setStreamingText("");

        try {
            const token = localStorage.getItem("token");
            if (!token) {
                setError("Please login to continue");
                return;
            }

            setIsTyping(true);

            // Use the regular non-streaming endpoint
            const response = await api.post("/chatbot/ask", { 
                message: userInput,
                location: location,
                cuisine: cuisine,
                dietary: dietary,
                // Add specific instruction to focus on restaurants only
                instruction: "focus on restaurant recommendations only, no recipes"
            });

            if (response.data.success) {
                // Simulate streaming with the complete text
                const fullText = response.data.response;
                simulateStreamingText(fullText);
            } else {
                setError(response.data.error || "Failed to get response");
                setIsTyping(false);
            }
        } catch (err) {
            console.error("Error sending message:", err);
            setMessages(prev => [...prev, { 
                sender: "bot", 
                text: err.response?.data?.error || "Sorry, something went wrong. Please try again." 
            }]);
            setIsTyping(false);
        }
    };
    
    // Function to simulate streaming text
    const simulateStreamingText = async (fullText) => {
        let displayedText = "";
        
        // Process chunks of text at variable speeds
        for (let i = 0; i < fullText.length; i++) {
            // Randomize typing speed for realistic effect
            // Faster for spaces and punctuation, slower for other characters
            const char = fullText[i];
            const delay = char === ' ' || [',', '.', '!', '?'].includes(char) 
                ? 10 + Math.random() * 20   // Faster for spaces and punctuation
                : 15 + Math.random() * 35;  // Slower for regular characters
            
            await new Promise(resolve => setTimeout(resolve, delay));
            
            displayedText += char;
            setStreamingText(displayedText);
            
            // Scroll down as text appears
            if (messagesContainerRef.current) {
                messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
            }
        }
        
        // Add the complete message to the conversation
        setMessages(prev => [...prev, { 
            sender: "bot", 
            text: fullText 
        }]);
        
        // Clear the streaming text and typing indicator
        setStreamingText("");
        setIsTyping(false);
    };

    const handlePromptClick = (prompt) => {
        setInput(prompt);
        // Use setTimeout to ensure the input is set before sending
        setTimeout(() => {
            sendMessage();
        }, 10);
    };

    const handleKeyPress = (e) => {
        if (e.key === "Enter") {
            sendMessage();
        }
    };
    
    const handleClose = () => {
        // Handle closing the chatbot (navigate back or close modal)
        window.history.back();
    };

    // Render message content with markdown formatting
    const renderMessageContent = (text, isStreaming = false) => {
        return (
            <div className="formatted-text">
                <ReactMarkdown>{text}</ReactMarkdown>
                {isStreaming && <span className="cursor-blink"></span>}
            </div>
        );
    };

    return (
        <div className="munchmate-container">
            {/* Header */}
            <div className="header-container">
                <div className="nav-header">
                    <button className="back-button" onClick={handleClose}>
                        <svg width="24" height="24" viewBox="0 0 24 24">
                            <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"></path>
                        </svg>
                    </button>
                    <div className="location-icon">
                        <svg width="24" height="24" viewBox="0 0 24 24">
                            <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zM12 11.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"></path>
                        </svg>
                        MunchMate
                    </div>
                    <div className="ai-assistant-label">
                        AI Food Assistant
                    </div>
                    <button className="close-button" onClick={handleClose}>
                        Close
                    </button>
                </div>
            </div>
            
            {/* Main Content */}
            <div className="main-content" ref={messagesContainerRef}>
                {messages.length > 0 && (
                    <button onClick={clearHistory} className="clear-history-btn">
                        Clear History
                    </button>
                )}
                
                {showPrompts && (
                    <>
                        <div className="assistant-header">
                            <h1>MunchMate Assistant</h1>
                            <p>Your personal restaurant finder. Tell me what you're craving!</p>
                        </div>
                        
                        <div className="topics-grid">
                            {[
                                { 
                                    title: "Burgers near me", 
                                    desc: "Find the best burger joints in your area" 
                                },
                                { 
                                    title: "Mexican restaurants", 
                                    desc: "Discover top-rated Mexican food nearby" 
                                },
                                { 
                                    title: "Romantic dinner spot", 
                                    desc: "Find the perfect place for a special occasion" 
                                },
                                { 
                                    title: "Vegetarian-friendly", 
                                    desc: "Restaurants with great vegetarian options" 
                                }
                            ].map((item, index) => (
                                <div
                                    key={index}
                                    className="topic-card"
                                    onClick={() => handlePromptClick(item.title)}
                                >
                                    <h2>{item.title}</h2>
                                    <p>{item.desc}</p>
                                </div>
                            ))}
                        </div>
                    </>
                )}
                
                {/* Messages */}
                {!showPrompts && (
                    <div className="messages-container">
                        {messages.map((msg, index) => (
                            <div key={index} className={`message ${msg.sender}`}>
                                <div className="message-bubble">
                                    {msg.sender === 'bot' 
                                        ? renderMessageContent(msg.text)
                                        : msg.text
                                    }
                                </div>
                            </div>
                        ))}
                        
                        {/* Streaming text display */}
                        {streamingText && (
                            <div className="message bot">
                                <div className="message-bubble">
                                    {renderMessageContent(streamingText, true)}
                                </div>
                            </div>
                        )}
                        
                        {isTyping && !streamingText && (
                            <div className="typing-container">
                                <div className="typing-indicator">
                                    <div className="typing-dot"></div>
                                    <div className="typing-dot"></div>
                                    <div className="typing-dot"></div>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>
            
            {/* Input Area */}
            <div className="input-container">
                <div className="input-wrapper">
                    <input
                        className="input-field"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyPress={handleKeyPress}
                        placeholder="What food are you craving today?"
                        disabled={isTyping}
                    />
                    <button 
                        className="send-button"
                        onClick={sendMessage}
                        disabled={!input.trim() || isTyping}
                    >
                        <svg width="24" height="24" viewBox="0 0 24 24">
                            <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"></path>
                        </svg>
                    </button>
                </div>
            </div>
            
            {/* Footer */}
            <div className="footer">
                Powered by MunchMate AI • Find the perfect restaurant for any craving
            </div>
        </div>
    );
};

export default Chatbot;