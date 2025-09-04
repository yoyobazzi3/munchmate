import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import ReactMarkdown from 'react-markdown';
import { useNavigate } from "react-router-dom"; // Import useNavigate
import { FaRegUser } from "react-icons/fa"; // Import FaRegUser
import "./Chatbot.css";

// If you don't have react-markdown installed, run:
// npm install react-markdown

const API_BASE_URL = process.env.REACT_APP_API_URL || "http://localhost:8000";

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

    // For profile dropdown
    const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
    const profileRef = useRef(null);
    const navigate = useNavigate(); // Initialize useNavigate

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
            if (!token) {
                // If no token, consider redirecting to login or showing a message
                // For now, we'll just not fetch history.
                // setError("Please login to view chat history."); // Optional: inform user
                setShowPrompts(true); // Show prompts if not logged in
                return;
            }

            try {
                setError(null);
                const response = await api.get("/chatbot/history");

                if (response.data.success) {
                    const historyMessages = [];
                    response.data.data.sessions.forEach(session => {
                        session.conversations.forEach(conv => {
                            historyMessages.push({ sender: "user", text: conv.userMessage });
                            historyMessages.push({ sender: "bot", text: conv.botResponse });
                        });
                    });
                    
                    setMessages(historyMessages);
                    if (historyMessages.length > 0) {
                        setShowPrompts(false);
                    }
                } else {
                     // Handle cases where success is false but no error thrown by axios
                    if(response.data.error === "User not found or no chat history") {
                        setShowPrompts(true);
                        setMessages([]);
                    } else {
                        setError(response.data.error || "Failed to load chat history");
                    }
                }
            } catch (err) {
                console.error("Error fetching chat history:", err);
                if (err.response && err.response.status === 401) {
                     setError("Session expired. Please login again.");
                     localStorage.removeItem("token"); // Clear invalid token
                     // Optionally navigate to login: navigate("/login");
                } else {
                    setError("Failed to load chat history");
                }
                setShowPrompts(true); // Fallback to showing prompts on error
            }
        };

        fetchChatHistory();
        fetchUserLocation();
    }, []); // Removed 'api' from dependencies as it's stable

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
                        const response = await axios.get(
                            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${position.coords.latitude}&lon=${position.coords.longitude}`
                        );
                        
                        if (response.data && response.data.address) {
                            const address = response.data.address;
                            const locationStr = address.city || address.town || address.village || address.hamlet || address.suburb || "your current location";
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
        const token = localStorage.getItem("token");
        if (!token) {
            setError("Please login to manage chat history.");
            return;
        }
        try {
            const response = await api.delete("/chatbot/clear");
            if (response.data.success) {
                setMessages([]);
                setShowPrompts(true);
                setStreamingText("");
                setError(null);
            } else {
                setError(response.data.error || "Failed to clear chat history");
            }
        } catch (err) {
            console.error("Error clearing history:", err);
            setError("Failed to clear chat history");
        }
    };

    const sendMessage = async () => {
        if (!input.trim()) return;

        const userMessage = { sender: "user", text: input };
        const userInput = input; 
        setMessages(prev => [...prev, userMessage]);
        setInput("");
        setShowPrompts(false);
        setError(null);
        setStreamingText("");

        const token = localStorage.getItem("token");
        if (!token) {
            setError("Please login to continue chatting.");
            setMessages(prev => [...prev, { 
                sender: "bot", 
                text: "It looks like you're not logged in. Please [login](/login) to save your chat and get personalized recommendations." 
            }]);
            return;
        }

        try {
            setIsTyping(true);
            const response = await api.post("/chatbot/ask", { 
                message: userInput,
                location: location,
                cuisine: cuisine,
                dietary: dietary,
                instruction: "focus on restaurant recommendations only, no recipes"
            });

            if (response.data.success) {
                const fullText = response.data.response;
                simulateStreamingText(fullText);
            } else {
                setError(response.data.error || "Failed to get response");
                setMessages(prev => [...prev, { sender: "bot", text: response.data.error || "Sorry, I couldn't process that." }]);
                setIsTyping(false);
            }
        } catch (err) {
            console.error("Error sending message:", err);
            let errorMessage = "Sorry, something went wrong. Please try again.";
            if (err.response) {
                errorMessage = err.response.data?.error || err.response.data?.message || errorMessage;
                if (err.response.status === 401) {
                    errorMessage = "Your session may have expired. Please [login](/login) again.";
                    localStorage.removeItem("token");
                }
            }
            setMessages(prev => [...prev, { sender: "bot", text: errorMessage }]);
            setIsTyping(false);
        }
    };
    
    const simulateStreamingText = async (fullText) => {
        let displayedText = "";
        for (let i = 0; i < fullText.length; i++) {
            const char = fullText[i];
            const delay = char === ' ' || [',', '.', '!', '?'].includes(char) 
                ? 10 + Math.random() * 20  
                : 15 + Math.random() * 35; 
            
            await new Promise(resolve => setTimeout(resolve, delay));
            displayedText += char;
            setStreamingText(displayedText);
            
            if (messagesContainerRef.current) {
                messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
            }
        }
        
        setMessages(prev => [...prev, { sender: "bot", text: fullText }]);
        setStreamingText("");
        setIsTyping(false);
    };

    const handlePromptClick = (prompt) => {
        setInput(prompt);
        setTimeout(() => { // Ensure input state is updated before sending
            sendMessage();
        }, 0);
    };

    const handleKeyPress = (e) => {
        if (e.key === "Enter" && !e.shiftKey) { // Send on Enter, allow Shift+Enter for newline
            e.preventDefault(); // Prevents newline in input when sending
            sendMessage();
        }
    };
    
    const handleNavigateBack = () => {
        window.history.back();
    };

    // Profile Dropdown Logic
    const toggleProfileDropdown = () => {
        setIsProfileDropdownOpen(!isProfileDropdownOpen);
    };

    const handleSignOut = () => {
        localStorage.removeItem("token"); // Clear token
        setIsProfileDropdownOpen(false); // Close dropdown
        // Clear chat messages and show prompts, or navigate to login
        setMessages([]);
        setShowPrompts(true);
        setError(null); 
        navigate("/"); // Navigate to landing page
    };

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (profileRef.current && !profileRef.current.contains(event.target)) {
                setIsProfileDropdownOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);


    const renderMessageContent = (text, isStreaming = false) => {
        // Custom link renderer for ReactMarkdown to use navigate
        const LinkRenderer = ({ href, children }) => {
            if (href.startsWith('/')) { // Internal link
                return <a href={href} onClick={(e) => { e.preventDefault(); navigate(href); }}>{children}</a>;
            }
            return <a href={href} target="_blank" rel="noopener noreferrer">{children}</a>; // External link
        };

        return (
            <div className="formatted-text">
                <ReactMarkdown components={{ a: LinkRenderer }}>{text}</ReactMarkdown>
                {isStreaming && <span className="cursor-blink"></span>}
            </div>
        );
    };


    return (
        <div className="munchmate-container">
            {/* Header */}
            <div className="header-container">
                <div className="nav-header">
                    <button className="back-button" onClick={handleNavigateBack}>
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"></path>
                        </svg>
                    </button>
                    <div className="location-icon">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zM12 11.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"></path>
                        </svg>
                        MunchMate
                    </div>
                    {/* <div className="ai-assistant-label">
                        AI Food Assistant
                    </div> */}
                    {/* Profile Icon and Dropdown */}
                    <div className="user-profile-chatbot" ref={profileRef}>
                        <FaRegUser className="profile-icon-chatbot" onClick={toggleProfileDropdown} />
                        {isProfileDropdownOpen && (
                            <div className="profile-dropdown-chatbot">
                                <button onClick={handleSignOut} className="dropdown-button-chatbot">
                                    Sign Out
                                </button>
                                {/* Add more items here if needed, e.g., Profile page */}
                                {/* <button onClick={() => { navigate('/user-profile'); setIsProfileDropdownOpen(false); }} className="dropdown-button-chatbot">
                                    Profile
                                </button> */}
                            </div>
                        )}
                    </div>
                </div>
            </div>
            
            {/* Main Content */}
            <div className="main-content" ref={messagesContainerRef}>
                {messages.length > 0 && ( // Show clear history only if there are messages AND user is potentially logged in
                    localStorage.getItem("token") && // Check token to avoid showing for logged-out generated messages
                    <button onClick={clearHistory} className="clear-history-btn">
                        Clear History
                    </button>
                )}
                 {error && <div className="error-message-chat">{renderMessageContent(error)}</div>}
                
                {showPrompts && (
                    <>
                        <div className="assistant-header">
                            <h1>MunchMate Assistant</h1>
                            <p>Your personal restaurant finder. Tell me what you're craving{location ? ` in ${location}` : ""}!</p>
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
                
                {!showPrompts && (
                    <div className="messages-container">
                        {messages.map((msg, index) => (
                            <div key={index} className={`message ${msg.sender}`}>
                                <div className="message-bubble">
                                    {msg.sender === 'bot' 
                                        ? renderMessageContent(msg.text)
                                        : msg.text // User messages are plain text
                                    }
                                </div>
                            </div>
                        ))}
                        
                        {streamingText && (
                            <div className="message bot">
                                <div className="message-bubble">
                                    {renderMessageContent(streamingText, true)}
                                </div>
                            </div>
                        )}
                        
                        {isTyping && !streamingText && messages.length > 0 && messages[messages.length -1].sender === 'user' && (
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
            
            <div className="input-container">
                <div className="input-wrapper">
                    <input
                        className="input-field"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyPress={handleKeyPress}
                        placeholder="What food are you craving today?"
                        disabled={isTyping && streamingText} // Disable input while bot is fully "typing" (streaming)
                    />
                    <button 
                        className="send-button"
                        onClick={sendMessage}
                        disabled={!input.trim() || (isTyping && streamingText)}
                    >
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"></path>
                        </svg>
                    </button>
                </div>
            </div>
            
            <div className="footer">
                Powered by MunchMate AI • Find the perfect restaurant for any craving
            </div>
        </div>
    );
};

export default Chatbot;