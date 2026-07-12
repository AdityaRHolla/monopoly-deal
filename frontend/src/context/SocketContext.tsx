import React, { createContext, useContext, useState, useEffect } from "react";
import { io, Socket } from "socket.io-client";
import type { GameRoom } from "../types";
import type { ReactNode } from "react";

interface SocketContextType {
  gameState: GameRoom | null;
  error: string;
  socket: Socket | null;
  createRoom: (playerName: string) => void;
  joinRoom: (roomId: string, playerName: string) => void;
  setError: React.Dispatch<React.SetStateAction<string>>;
}

const SocketContext = createContext<SocketContextType | undefined>(undefined);

export const useGame = () => {
  const context = useContext(SocketContext);
  if (!context) throw new Error("useGame must be used within a SocketProvider");
  return context;
};

export const SocketProvider = ({ children }: { children: ReactNode }) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [gameState, setGameState] = useState<GameRoom | null>(null);
  const [error, setError] = useState<string>("");

  useEffect(() => {
    // Connects to your backend node server port
    const socketInstance = io("http://localhost:4000");
    setSocket(socketInstance);

    // Listens for room updates from the backend
    socketInstance.on("room_created", (room: GameRoom) => {
      setGameState(room);
      setError("");
    });

    socketInstance.on("room_updated", (room: GameRoom) => {
      setGameState(room);
      setError("");
    });

    socketInstance.on("error_message", ({ message }: { message: string }) => {
      setError(message);
    });

    return () => {
      socketInstance.disconnect();
    };
  }, []);

  const createRoom = (playerName: string) => {
    if (socket) socket.emit("create_room", { playerName });
  };

  const joinRoom = (roomId: string, playerName: string) => {
    if (socket) socket.emit("join_room", { roomId, playerName });
  };

  return (
    <SocketContext.Provider
      value={{ gameState, error, socket, createRoom, joinRoom, setError }}
    >
      {children}
    </SocketContext.Provider>
  );
};
