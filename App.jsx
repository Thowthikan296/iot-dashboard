// src/App.jsx
import React, { useEffect, useState, useRef } from 'react';

export default function App() {
  const [messages, setMessages] = useState([]);
  const wsRef = useRef(null);

  // Function to get a fresh token from your Azure Function
  const getWebSocketUrl = async () => {
    const res = await fetch(import.meta.env.VITE_API_URL);
    const data = await res.json();
    return data.url; // API should return { url: "wss://..." }
  };

  const connectWebSocket = async () => {
    try {
      const wsUrl = await getWebSocketUrl();
      const ws = new WebSocket(wsUrl);

      ws.onopen = () => {
        console.log("WebSocket connected");
        setMessages(prev => [...prev, "Connected to IoT stream"]);
      };

      ws.onmessage = (event) => {
        setMessages(prev => [...prev, event.data]);
      };

      ws.onclose = (event) => {
        console.warn(`WebSocket closed: code=${event.code}, reason=${event.reason}`);
        setMessages(prev => [...prev, "Connection closed, retrying in 5s..."]);
        setTimeout(connectWebSocket, 5000); // auto-reconnect
      };

      ws.onerror = (err) => {
        console.error("WebSocket error", err);
        ws.close();
      };

      wsRef.current = ws;
    } catch (err) {
      console.error("Failed to connect WebSocket", err);
      setTimeout(connectWebSocket, 5000);
    }
  };

  useEffect(() => {
    connectWebSocket();
    return () => {
      if (wsRef.current) wsRef.current.close();
    };
  }, []);

  return (
    <div className="p-4 bg-gray-100 min-h-screen">
      <h1 className="text-2xl font-bold mb-4">IoT Live Dashboard</h1>
      <div className="bg-white shadow p-4 rounded">
        {messages.map((msg, idx) => (
          <div key={idx} className="border-b py-1">{msg}</div>
        ))}
      </div>
    </div>
  );
}
