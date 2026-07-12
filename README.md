# 🃏 Monopoly Deal Online

A real-time, 2D web implementation of the card game *Monopoly Deal*. Built with **React (Vite) + Tailwind CSS** on the frontend, and a type-safe **Node.js + TypeScript + Socket.io** state engine on the backend. Designed to be lightweight, unscalable but highly responsive, and hosted entirely for free to play with up to 5 friends.

---

## 🛠️ Tech Stack & Architecture

### Frontend (`/frontend`)
- **Framework:** React 18 + Vite (TypeScript layout)
- **Styling:** Tailwind CSS v4 (Modern CSS-first approach)
- **State & Real-time Client:** Context API + `socket.io-client`
- **Icons Library:** `lucide-react`
- **Linter Tool:** Oxlint (Ultra-fast Rust-based engine)

### Backend (`/backend`)
- **Runtime:** Node.js (ECMAScript Modules configuration)
- **Execution Engine:** `tsx` (Fast, native TypeScript watcher)
- **Real-time Engine:** Socket.io (In-memory room synchronization state tracking)
- **Server Scaffold:** Express

---

## 🚀 Local Workspace Execution

To fire up the environment locally on your machine, open two distinct terminal layers.

### 1. Start the Backend Server Engine
```bash
cd backend
npm install
npm run dev
```
*The server will boot up natively at `http://localhost:4000`.*

### 2. Start the Frontend Vite Interface
```bash
cd frontend
npm install
npm run dev
```
*The interface layout canvas will mount instantly at `http://localhost:5173`.*

---

## 🌐 Production Free Hosting Architecture

### Backend Web Service Engine
The backend engine operates as a continuous memory instance on **Render** (Free Instance tier). 
> **Important Note:** On the free tier, Render automatically puts services to sleep after 15 minutes of inactivity. When you open the game for the first time, it might take **50–60 seconds** for the server to wake up and allow room creation.

### Frontend Client Static Web app
The compiled layout layer is served statically on **GitHub Pages** or **Vercel** completely for free. 
