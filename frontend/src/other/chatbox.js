import React, { useState, useEffect, useRef } from 'react';
import './ChatBox.css'; // Import your CSS file
import utsLogo from './uts.png'; // Import UTS logo
import utsHeader from './uts-header.jpg'; // Import header logo
import { HiOutlineChevronUp, HiOutlineChevronDown } from "react-icons/hi"; // Import icons
import { MdOutlineChatBubble } from "react-icons/md"; // Import chat bubble icon

const ChatBox = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState([]);
    const [userInput, setUserInput] = useState("");
    const [token, setToken] = useState(null);
    const messagesEndRef = useRef(null);

    useEffect(() => {
        const fetchToken = async () => {
            try {
                const response = await fetch('http://localhost:1000/start', {
                    method: 'POST',
                    headers: {
                        'X-Chatbot-Secret': process.env.REACT_APP_FRONTEND_SECRET,
                    }
                });
                if (response.ok) {
                    const data = await response.json();
                    setToken(data.token);
                } else {
                    console.error("Failed to fetch token.");
                }
            } catch (error) {
                console.error("Error fetching token:", error);
            }
        };
        fetchToken();
    }, []);

    useEffect(() => {
        if (isOpen) {
            messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
        }
    }, [messages, isOpen]);

    const toggleChatBox = () => setIsOpen(!isOpen);

    const handleInputChange = (e) => setUserInput(e.target.value);

    const handleSend = async () => {
        if (userInput.trim() && token) {
            setUserInput("");

            const newMessages = [...messages, { sender: "user", text: userInput }];
            setMessages(newMessages);

            try {
                const response = await fetch('http://localhost:1000/ask', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({ question: userInput })
                });

                if (response.ok) {
                    const data = await response.json();
                    setMessages([...newMessages, { sender: "bot", text: data.answer }]);
                } else {
                    console.error("Failed to fetch response from backend.");
                    setMessages([...newMessages, { sender: "bot", text: "Failed to fetch response from the server." }]);
                }
            } catch (error) {
                console.error("Error communicating with backend:", error);
                setMessages([...newMessages, { sender: "bot", text: "An error occurred. Please try again later." }]);
            }
        }
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter') {
            handleSend();
        }
    };

    return (
        <div className={`chatbox ${isOpen ? 'open' : ''}`}>
            {isOpen ? (
                <div className="chatbox-header" onClick={toggleChatBox}>
                    <img
                        src={utsHeader}
                        alt="UTS Logo"
                        className="uts-logo"
                        style={{ width: '50px', height: '50px', marginRight: '2px' }} // Inline CSS to adjust size
                    />
                    <span className="header-title">Centre for Social Justice & Inclusion Chatbot</span>
                    <HiOutlineChevronDown className="toggle-icon" onClick={toggleChatBox} />
                </div>
            ) : (
                <div className="chatbox-minimized" onClick={toggleChatBox}>
                    <MdOutlineChatBubble className="chat-bubble-icon" />
                    <span>Need to chat?</span>
                    <HiOutlineChevronUp className="toggle-icon" onClick={toggleChatBox} />
                </div>
            )}

            {isOpen && (
                <div className="chatbox-content">
                    <div className="chatbox-messages">
                        {messages.map((msg, index) => (
                            <div key={index} className={`message ${msg.sender}`}>
                                {msg.sender === "bot" ? (
                                    <div className="bot-message">
                                        <img src={utsLogo} alt="UTS Logo" className="uts-message-logo" />
                                        <div className="message-text">{msg.text}</div>
                                    </div>
                                ) : (
                                    <div className="user-message">
                                        <div className="message-text">{msg.text}</div>
                                    </div>
                                )}
                            </div>
                        ))}
                        <div ref={messagesEndRef} />
                    </div>
                    <div className="chatbox-input">
                        <input
                            type="text"
                            value={userInput}
                            onChange={handleInputChange}
                            onKeyPress={handleKeyPress} // Add this line to handle Enter key press
                            placeholder="Enter a message..."
                        />
                        <button onClick={handleSend}>Send</button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ChatBox;