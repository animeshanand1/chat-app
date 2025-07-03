"use client";
import { useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import { io, Socket } from "socket.io-client";

// To configure the socket server URL, set NEXT_PUBLIC_SOCKET_URL in your .env file. Falls back to localhost:3000 if not set.
let socket: Socket | null = null;

async function uploadToCloudinary(file: File) {
  const url = `https://api.cloudinary.com/v1_1/dxa6nrlld/auto/upload`;
  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', 'dscbxoj0');

  const res = await fetch(url, {
    method: 'POST',
    body: formData,
  });
  if (!res.ok) throw new Error('Upload failed');
  return res.json(); // Contains .secure_url
}

export default function RoomPage() {
  const params = useParams();
  let roomCode = params.roomCode;
  if (Array.isArray(roomCode)) roomCode = roomCode[0];
  roomCode = typeof roomCode === "string" ? roomCode : "";

  const [messages, setMessages] = useState<{ text: string; gif?: string; image?: string; video?: string; sender: string }[]>([]);
  const [input, setInput] = useState("");
  const [showGif, setShowGif] = useState(false);
  const [gifUrl, setGifUrl] = useState("");
  const [username, setUsername] = useState<string | null>(null);
  const [usernameInput, setUsernameInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [hasMounted, setHasMounted] = useState(false);
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [mediaPreview, setMediaPreview] = useState<string>("");

  useEffect(() => {
    setHasMounted(true);
  }, []);

  useEffect(() => {
    console.log("roomCode:", roomCode, "username:", username);
    if (!roomCode) return;
    if (!socket) {
      socket = io("https://chat-app-production-9bba.up.railway.app" || "http://localhost:3000");
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

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setMediaFile(file);
      const reader = new FileReader();
      reader.onload = (ev) => {
        setMediaPreview(ev.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    let msg: any = { text: input, sender: username };

    if (gifUrl) msg.gif = gifUrl;

    if (mediaFile) {
      // Upload to Cloudinary
      const result = await uploadToCloudinary(mediaFile);
      const type = mediaFile.type;
      if (type === "image/gif") msg.gif = result.secure_url;
      else if (type.startsWith("image/")) msg.image = result.secure_url;
      else if (type.startsWith("video/")) msg.video = result.secure_url;
    }

    socket?.emit("send-message", { roomCode, message: msg });
    setInput("");
    setGifUrl("");
    setShowGif(false);
    setMediaFile(null);
    setMediaPreview("");
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
                    {msg.image && <div><img src={msg.image} alt="img" style={{ maxHeight: 120, marginTop: 6 }} /></div>}
                    {msg.video && <div><video src={msg.video} controls style={{ maxHeight: 120, marginTop: 6 }} /></div>}
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
        <input
          type="file"
          accept="image/*,video/*,image/gif"
          style={{ display: "none" }}
          id="media-upload"
          onChange={handleFileChange}
        />
        <label htmlFor="media-upload" style={{ padding: 8, cursor: "pointer", background: "#eee", borderRadius: 4 }}>
          📎
        </label>
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
      {mediaPreview && (
        <div style={{ marginTop: 8 }}>
          {mediaFile?.type.startsWith("image/") && <img src={mediaPreview} alt="preview" style={{ maxHeight: 80 }} />}
          {mediaFile?.type.startsWith("video/") && <video src={mediaPreview} controls style={{ maxHeight: 120 }} />}
        </div>
      )}
    </main>
  );
} 
