"use client";

import { useState, useRef, useEffect } from "react";
import { MessageCircle, X, Send } from "lucide-react";
import { streamChatResponse } from "@/app/actions/chat";

interface Message {
    id: string;
    role: "user" | "bot";
    text: string;
}

interface ChatWidgetProps {
    context: string;
}

const MAX_MESSAGES = 20;
const SESSION_LIMIT = 10;

export default function ChatWidget({ context }: ChatWidgetProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState("");
    const [isStreaming, setIsStreaming] = useState(false);
    const [messageCount, setMessageCount] = useState(0);

    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Auto-scroll to bottom of messages
    useEffect(() => {
        if (messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
        }
    }, [messages, isStreaming]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const trimmedInput = input.trim();
        if (!trimmedInput || isStreaming || messageCount >= SESSION_LIMIT) return;

        // Add User message
        const userMsg: Message = { id: crypto.randomUUID(), role: "user", text: trimmedInput };

        setMessages((prev) => {
            const updated = [...prev, userMsg];
            return updated.length > MAX_MESSAGES ? updated.slice(updated.length - MAX_MESSAGES) : updated;
        });

        setInput("");
        setIsStreaming(true);
        setMessageCount((prev) => prev + 1);

        // Initial bot message placeholder
        const botMsgId = crypto.randomUUID();
        setMessages((prev) => {
            const updated: Message[] = [...prev, { id: botMsgId, role: "bot", text: "" }];
            return updated.length > MAX_MESSAGES ? updated.slice(updated.length - MAX_MESSAGES) : updated;
        });

        try {
            const stream = await streamChatResponse(trimmedInput, context);
            const reader = stream.getReader();

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                // value is a string chunk
                setMessages((prev) => {
                    const lastMsg = prev[prev.length - 1];
                    if (lastMsg && lastMsg.id === botMsgId) {
                        return [
                            ...prev.slice(0, prev.length - 1),
                            { ...lastMsg, text: lastMsg.text + value },
                        ];
                    }
                    return prev;
                });
            }
        } catch (error) {
            console.error("Chat error:", error);
            setMessages((prev) => {
                const lastMsg = prev[prev.length - 1];
                if (lastMsg && lastMsg.id === botMsgId) {
                    return [
                        ...prev.slice(0, prev.length - 1),
                        { ...lastMsg, text: lastMsg.text + "\n(Netzwerkfehler)" },
                    ];
                }
                return prev;
            });
        } finally {
            setIsStreaming(false);
        }
    };

    return (
        <div
            style={{
                position: "absolute",
                bottom: 24,
                right: 24,
                zIndex: 50,
                fontFamily: "system-ui, sans-serif",
            }}
        >
            {!isOpen && (
                <button
                    onClick={() => setIsOpen(true)}
                    style={{
                        width: 56,
                        height: 56,
                        borderRadius: 28,
                        border: "1px solid rgba(255,255,255,0.1)",
                        background: "rgba(0,0,0,0.6)",
                        backdropFilter: "blur(12px)",
                        color: "#fff",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        cursor: "pointer",
                        boxShadow: "0 8px 32px rgba(0,0,0,0.3)",
                        transition: "transform 0.2s ease",
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.transform = "scale(1.05)")}
                    onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
                >
                    <MessageCircle size={28} />
                </button>
            )}

            {isOpen && (
                <div
                    style={{
                        width: 320,
                        height: 480,
                        borderRadius: 16,
                        border: "1px solid rgba(255,255,255,0.1)",
                        background: "rgba(0,0,0,0.7)",
                        backdropFilter: "blur(20px)",
                        boxShadow: "0 12px 48px rgba(0,0,0,0.5)",
                        display: "flex",
                        flexDirection: "column",
                        overflow: "hidden",
                        animation: "fadeIn 0.2s ease-out forwards",
                    }}
                >
                    {/* Header */}
                    <div
                        style={{
                            padding: "16px",
                            borderBottom: "1px solid rgba(255,255,255,0.1)",
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            background: "rgba(255,255,255,0.05)",
                        }}
                    >
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            <MessageCircle size={20} color="#00aaff" />
                            <h3 style={{ margin: 0, fontSize: 16, color: "#fff", fontWeight: 600 }}>
                                Produktberater
                            </h3>
                        </div>
                        <button
                            onClick={() => setIsOpen(false)}
                            style={{
                                background: "transparent",
                                border: "none",
                                color: "rgba(255,255,255,0.6)",
                                cursor: "pointer",
                                padding: 4,
                                display: "flex",
                            }}
                            aria-label="Schließen"
                        >
                            <X size={20} />
                        </button>
                    </div>

                    {/* Messages Area */}
                    <div
                        style={{
                            flex: 1,
                            overflowY: "auto",
                            padding: "16px",
                            display: "flex",
                            flexDirection: "column",
                            gap: 12,
                        }}
                    >
                        {messages.length === 0 && (
                            <p style={{ color: "rgba(255,255,255,0.5)", fontSize: 14, textAlign: "center", marginTop: "auto", marginBottom: "auto" }}>
                                Stellen Sie Fragen zu unserem Produkt. Ich helfe gerne weiter!
                            </p>
                        )}

                        {messages.map((msg) => (
                            <div
                                key={msg.id}
                                style={{
                                    alignSelf: msg.role === "user" ? "flex-end" : "flex-start",
                                    maxWidth: "85%",
                                    padding: "10px 14px",
                                    borderRadius: 12,
                                    borderBottomRightRadius: msg.role === "user" ? 2 : 12,
                                    borderBottomLeftRadius: msg.role === "bot" ? 2 : 12,
                                    background: msg.role === "user" ? "rgba(0, 170, 255, 0.8)" : "rgba(255,255,255,0.1)",
                                    color: "#fff",
                                    fontSize: 14,
                                    lineHeight: 1.5,
                                    wordBreak: "break-word",
                                    whiteSpace: "pre-wrap",
                                }}
                            >
                                {msg.text}
                                {msg.role === "bot" && isStreaming && msg === messages[messages.length - 1] && (
                                    <span style={{
                                        display: "inline-block",
                                        width: 6,
                                        height: 14,
                                        background: "rgba(255,255,255,0.8)",
                                        marginLeft: 4,
                                        verticalAlign: "middle",
                                        animation: "blink 1s step-end infinite"
                                    }} />
                                )}
                            </div>
                        ))}
                        <div ref={messagesEndRef} />
                    </div>

                    {/* Input Area */}
                    <div
                        style={{
                            padding: "16px",
                            borderTop: "1px solid rgba(255,255,255,0.1)",
                            background: "rgba(0,0,0,0.3)",
                        }}
                    >
                        {messageCount >= SESSION_LIMIT ? (
                            <p style={{ margin: 0, fontSize: 13, color: "#ff4444", textAlign: "center" }}>
                                Chat-Limit erreicht. Kontaktieren Sie uns direkt.
                            </p>
                        ) : (
                            <form onSubmit={handleSubmit} style={{ display: "flex", gap: 8 }}>
                                <input
                                    type="text"
                                    value={input}
                                    onChange={(e) => setInput(e.target.value)}
                                    placeholder="Ihre Frage..."
                                    disabled={isStreaming}
                                    style={{
                                        flex: 1,
                                        background: "rgba(255,255,255,0.1)",
                                        border: "1px solid rgba(255,255,255,0.2)",
                                        borderRadius: 8,
                                        padding: "10px 14px",
                                        color: "#fff",
                                        fontSize: 14,
                                        outline: "none",
                                    }}
                                />
                                <button
                                    type="submit"
                                    disabled={!input.trim() || isStreaming}
                                    style={{
                                        background: "rgba(0, 170, 255, 0.2)",
                                        border: "1px solid #00aaff",
                                        borderRadius: 8,
                                        width: 42,
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        color: "#00aaff",
                                        cursor: !input.trim() || isStreaming ? "not-allowed" : "pointer",
                                        opacity: !input.trim() || isStreaming ? 0.5 : 1,
                                        transition: "all 0.2s ease",
                                    }}
                                >
                                    <Send size={18} />
                                </button>
                            </form>
                        )}
                        <div style={{ textAlign: "center", marginTop: 8 }}>
                            <span style={{ fontSize: 11, color: "rgba(255,255,255,0.4)" }}>
                                {SESSION_LIMIT - messageCount} Nachrichten übrig
                            </span>
                        </div>
                    </div>
                </div>
            )}
            <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px) scale(0.95); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0; }
        }
      `}</style>
        </div>
    );
}
