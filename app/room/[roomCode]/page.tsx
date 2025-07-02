"use client";
import { useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import { io, Socket } from "socket.io-client";

// To configure the socket server URL, set NEXT_PUBLIC_SOCKET_URL in your .env file. Falls back to localhost:3000 if not set.
let socket: Socket | null = null;

export default function RoomPage() {
  const params = useParams();
  let roomCode = params.roomCode;
  if (Array.isArray(roomCode)) roomCode = roomCode[0];
  roomCode = typeof roomCode === "string" ? roomCode : "";

  const [messages, setMessages] = useState<{ text: string; gif?: string; sender: string }[]>([]);
  const [input, setInput] = useState("");
  const [showGif, setShowGif] = useState(false);
  const [gifUrl, setGifUrl] = useState("");
  const [username, setUsername] = useState<string | null>(null);
  const [usernameInput, setUsernameInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [hasMounted, setHasMounted] = useState(false);

  useEffect(() => {
    setHasMounted(true);
  }, []);

  useEffect(() => {
    console.log("roomCode:", roomCode, "username:", username);
    if (!roomCode) return;
    if (!socket) {
      socket = io(process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:3000");
    }
    if (username) {
      socket.emit("join-room", { roomCode, username });
      socket.on("receive-message", (msg) => {
        setMessages((prev) => [...prev, msg]);
      });
    }
    return () => {
      socket?.off("receive-message");
    };
  }, [roomCode, username]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if ((input.trim() || gifUrl) && username && roomCode) {
      const msg = gifUrl ? { text: input, gif: gifUrl, sender: username } : { text: input, sender: username };
      console.log("Sending message:", msg); // ✅ Add this log
      socket?.emit("send-message", { roomCode, message: msg });
      setInput("");
      setGifUrl("");
      setShowGif(false);
    }
  };
  

  // Placeholder for GIF picker
  const handleGif = () => {
    // In a real app, open a GIF picker here
    const demoGif = "https://media.giphy.com/media/JIX9t2j0ZTN9S/giphy.gif";
    setGifUrl(demoGif);
    setShowGif(false);
  };

  if (!hasMounted) {
    return null;
  }

  if (!roomCode) {
    return <main style={{ padding: 32 }}><h2>Invalid or missing room code.</h2></main>;
  }

  if (!username) {
    return (
      <main style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "100vh" }}>
        <h2>Enter your name to join the chat</h2>
        <form onSubmit={e => { e.preventDefault(); if (usernameInput.trim()) setUsername(usernameInput.trim()); }}>
          <input
            type="text"
            placeholder="Your name"
            value={usernameInput}
            onChange={e => setUsernameInput(e.target.value)}
            style={{ padding: 8, fontSize: 16, marginRight: 8 }}
          />
          <button type="submit" style={{ padding: 8, fontSize: 16 }}>Join</button>
        </form>
      </main>
    );
  }

  return (
    <main style={{ maxWidth: 500, margin: "40px auto", padding: 16, border: "1px solid #ccc", borderRadius: 8 }}>
      <h2>Room: {roomCode}</h2>
      <div style={{ minHeight: 300, maxHeight: 400, overflowY: "auto", marginBottom: 16, background: "#fafafa", padding: 8, borderRadius: 4 }}>
        {messages.map((msg, i) => {
          const isMe = msg.sender === username;
          const isSystem = msg.sender === 'System';
          return (
            <div
              key={i}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: isSystem ? 'center' : isMe ? 'flex-end' : 'flex-start',
                marginBottom: 12
              }}
            >
              {isSystem ? (
                <div style={{ color: '#888', fontSize: 13, marginBottom: 2 }}>{msg.text}</div>
              ) : (
                <>
                  <span style={{ fontWeight: 'bold', fontSize: 13, color: isMe ? '#007aff' : '#333', marginBottom: 2 }}>
                    {isMe ? 'You' : msg.sender}
                  </span>
                  <div
                    style={{
                      background: isMe ? '#dcf8c6' : '#fff',
                      border: '1px solid #e0e0e0',
                      borderRadius: 16,
                      padding: '8px 14px',
                      maxWidth: 300,
                      wordBreak: 'break-word',
                      boxShadow: isMe ? '0 1px 2px #b2f5ea' : '0 1px 2px #eee',
                    }}
                  >
                    {msg.text}
                    {msg.gif && <div><img src={msg.gif} alt="gif" style={{ maxHeight: 120, marginTop: 6 }} /></div>}
                  </div>
                </>
              )}
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>
      <form onSubmit={sendMessage} style={{ display: "flex", gap: 8 }}>
        <input
          type="text"
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder="Type a message..."
          style={{ flex: 1, padding: 8 }}
        />
        <button type="button" onClick={() => setShowGif(!showGif)} style={{ padding: 8 }}>
          GIF
        </button>
        <button type="submit" style={{ padding: 8 }}>Send</button>
      </form>
      {showGif && (
        <div style={{ marginTop: 8 }}>
          <button onClick={handleGif}>Pick Demo GIF</button>
        </div>
      )}
      {gifUrl && (
        <div style={{ marginTop: 8 }}>
          <img src={gifUrl} alt="Selected gif" style={{ maxHeight: 80 }} />
        </div>
      )}
    </main>
  );
} 