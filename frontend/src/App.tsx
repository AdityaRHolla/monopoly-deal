import React, { useState } from "react";
import { useGame, SocketProvider } from "./context/SocketContext";
import { Lobby } from "./components/Lobby";
import { GameBoard } from "./components/GameBoard";

function AppContent() {
  const { gameState, error, createRoom, joinRoom } = useGame();
  const [roomId, setRoomId] = useState("");
  const [name, setName] = useState("");

  // 1. If match status is playing, show the interactive game table
  if (gameState && gameState.status === "playing") {
    return <GameBoard />;
  }

  // 2. If inside a room but waiting for connections, render the Lobby screen
  if (gameState && gameState.status === "waiting") {
    return <Lobby />;
  }

  // 3. Default state: Render the Main Welcome Menu
  const handleCreate = () => {
    if (name.trim()) {
      createRoom(name.trim());
    }
  };

  const handleJoin = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim() && roomId.length === 4) {
      joinRoom(roomId.trim().toUpperCase(), name.trim());
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-slate-900 text-white">
      <header className="mb-8 text-center">
        <h1 className="text-4xl font-black tracking-wider text-red-500 uppercase drop-shadow-md">
          Monopoly Deal
        </h1>
        <p className="text-slate-400 text-sm font-medium mt-1">
          Play with friends locally or across the world
        </p>
      </header>

      <div className="w-full max-w-md p-6 rounded-xl bg-slate-800 shadow-2xl border border-slate-700">
        <div className="mb-6">
          <label className="block text-sm font-semibold text-slate-300 mb-2">
            Your Name
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Enter nickname"
            maxLength={14}
            className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-md text-white focus:outline-none focus:border-red-500 transition-all"
          />
        </div>

        <div className="flex flex-col gap-4">
          <button
            onClick={handleCreate}
            disabled={!name.trim()}
            className="w-full py-3 bg-green-600 hover:bg-green-500 disabled:bg-slate-700 text-white font-bold rounded-md transition-colors"
          >
            Create New Room
          </button>

          <div className="text-center text-xs font-bold text-slate-500">OR</div>

          <form onSubmit={handleJoin} className="flex gap-2">
            <input
              type="text"
              value={roomId}
              onChange={(e) => setRoomId(e.target.value.toUpperCase())}
              placeholder="CODE"
              maxLength={4}
              className="w-2/3 px-4 py-2 bg-slate-700 border border-slate-600 rounded-md tracking-widest text-center uppercase focus:outline-none focus:border-blue-500 transition-all"
            />
            <button
              type="submit"
              disabled={!name.trim() || roomId.length !== 4}
              className="w-1/3 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-700 text-white font-bold rounded-md transition-colors"
            >
              Join
            </button>
          </form>
        </div>

        {error && (
          <div className="mt-4 p-3 rounded bg-red-950 border border-red-900 text-red-400 text-xs text-center font-medium">
            {error}
          </div>
        )}
      </div>
    </div>
  );
}

// 4. Main App shell wrapper that mounts your global socket sync engine context
export default function App() {
  return (
    <React.StrictMode>
      <SocketProvider>
        <AppContent />
      </SocketProvider>
    </React.StrictMode>
  );
}
