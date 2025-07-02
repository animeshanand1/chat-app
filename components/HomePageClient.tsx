"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

function generateRoomCode(length = 6) {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let code = "";
  for (let i = 0; i < length; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

export default function HomePageClient() {
  const [roomCode, setRoomCode] = useState("");
  const router = useRouter();

  const handleJoin = (e: React.FormEvent) => {
    e.preventDefault();
    if (roomCode.trim().length > 0) {
      router.push(`/room/${roomCode.trim().toUpperCase()}`);
    }
  };

  const handleGenerate = () => {
    const code = generateRoomCode();
    setRoomCode(code);
    router.push(`/room/${code}`);
  };

  return (
    <main style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "100vh" }}>
      <h1>Welcome to Real-Time Chat</h1>
      <form onSubmit={handleJoin} style={{ marginBottom: 16 }}>
        <input
          type="text"
          placeholder="Enter Room Code"
          value={roomCode}
          onChange={e => setRoomCode(e.target.value.toUpperCase())}
          style={{ padding: 8, fontSize: 16, marginRight: 8 }}
        />
        <button type="submit" style={{ padding: 8, fontSize: 16 }}>Join Room</button>
      </form>
      <button onClick={handleGenerate} style={{ padding: 8, fontSize: 16 }}>Generate New Room</button>
    </main>
  );
}
