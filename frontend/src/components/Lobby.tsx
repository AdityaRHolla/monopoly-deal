import React, { useState } from "react";
import { useGame } from "../context/SocketContext";
import { Shield, Users, Play, Copy, Check, Radio } from "lucide-react";

export const Lobby: React.FC = () => {
  const { gameState, socket, error } = useGame();
  const [copied, setCopied] = useState(false);

  if (!gameState || !socket) return null;

  const isHost = gameState.hostId === socket.id;

  const handleStartGame = () => {
    socket.emit("start_game", { roomId: gameState.roomId });
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(gameState.roomId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-slate-950 text-slate-100 font-sans">
      <div className="w-full max-w-md p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl relative overflow-hidden">
        {/* Decorative Background Glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-1 bg-linear-to-r from-transparent via-red-500 to-transparent blur-sm" />

        {/* Header Branding */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 text-[10px] font-black tracking-widest text-green-400 bg-green-950/40 border border-green-900/60 rounded-full uppercase">
            <Radio size={12} className="animate-pulse" />
            <span>Matchmaking Server</span>
          </div>

          <h2 className="mt-4 text-xs font-bold tracking-widest text-slate-500 uppercase">
            Room Access Code
          </h2>

          {/* Clickable Room Code Badge */}
          <button
            onClick={handleCopyCode}
            className="group mt-1 flex items-center gap-2 mx-auto px-4 py-2 bg-slate-950 border border-slate-800 rounded-xl hover:border-slate-700 transition-all active:scale-95 shadow-inner"
            title="Click to copy code"
          >
            <span className="text-3xl font-black tracking-widest text-red-500 font-mono">
              {gameState.roomId}
            </span>
            <div className="text-slate-500 group-hover:text-slate-300 transition-colors">
              {copied ? (
                <Check size={16} className="text-green-400" />
              ) : (
                <Copy size={16} />
              )}
            </div>
          </button>
          <p className="text-[11px] text-slate-400 mt-2">
            Share this code with friends. Max 5 players allowed.
          </p>
        </div>

        {/* Connected Players Card Stack */}
        <div className="mb-6 rounded-xl bg-slate-950/60 border border-slate-800/80 p-4">
          <div className="flex items-center justify-between mb-3 text-slate-400 border-b border-slate-900 pb-2.5">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider">
              <Users size={14} className="text-slate-500" />
              <span>Players Inside</span>
            </div>
            <span className="text-xs font-black font-mono px-2 py-0.5 bg-slate-900 border border-slate-800 rounded-md text-slate-300">
              {gameState.players.length} / 5
            </span>
          </div>

          <ul className="space-y-2">
            {gameState.players.map((player) => {
              const isPlayerHost = gameState.hostId === player.id;
              const isYou = player.id === socket.id;

              return (
                <li
                  key={player.id}
                  className={`flex items-center justify-between px-3 py-2.5 rounded-lg border transition-all duration-200 ${
                    isYou
                      ? "bg-slate-900 border-blue-500/30 shadow-md"
                      : "bg-slate-900/40 border-slate-800/50"
                  }`}
                >
                  <div className="flex items-center gap-2.5 truncate max-w-[75%]">
                    <div
                      className={`w-2 h-2 rounded-full shadow-sm ${isYou ? "bg-blue-400 shadow-blue-500/50" : "bg-slate-600"}`}
                    />
                    <span
                      className={`text-sm font-bold truncate ${isYou ? "text-white" : "text-slate-300"}`}
                    >
                      {player.name}
                    </span>
                    {isYou && (
                      <span className="text-[9px] font-black uppercase text-slate-500 bg-slate-950 border border-slate-800 px-1.5 py-0.5 rounded">
                        You
                      </span>
                    )}
                  </div>

                  {isPlayerHost && (
                    <div className="flex items-center gap-1 text-[10px] font-black uppercase tracking-wider text-amber-400 bg-amber-950/40 border border-amber-900/60 px-2 py-0.5 rounded-md shadow-sm">
                      <Shield size={12} className="text-amber-500" />
                      <span>Host</span>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        </div>

        {/* Dynamic Action Controls */}
        <div className="mt-6">
          {isHost ? (
            <button
              onClick={handleStartGame}
              disabled={gameState.players.length < 2}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-green-600 hover:bg-green-500 disabled:bg-slate-800 disabled:text-slate-500 disabled:border-transparent text-white font-black uppercase tracking-wider rounded-xl transition-all duration-200 shadow-lg shadow-green-900/20 active:scale-[0.98]"
            >
              <Play size={16} fill="currentColor" />
              <span>Launch Match</span>
            </button>
          ) : (
            <div className="flex items-center justify-center gap-2.5 py-3 px-4 bg-slate-950 border border-slate-800 text-slate-400 text-xs font-bold uppercase tracking-wider rounded-xl text-center">
              <span className="flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
              </span>
              <span>Waiting for host to launch...</span>
            </div>
          )}
        </div>

        {/* Central Error Pipeline Toast */}
        {error && (
          <div className="mt-4 p-3 rounded-lg bg-red-950/40 border border-red-900/40 text-red-400 text-xs font-bold text-center tracking-wide">
            {error}
          </div>
        )}
      </div>
    </div>
  );
};
