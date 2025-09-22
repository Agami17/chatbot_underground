// apps/web/src/App.jsx
// --------------------
// Komponen utama UI chat. Menangani:
// - state percakapan (messages)
// - input user & system prompt
// - tombol kirim (stream / non-stream)
// - streaming accumulator (accRef) supaya teks masuk bertahap
// - layout card di tengah (pakai wrapper .page & .app)

import { useState, useRef, useEffect } from "react";
import { chatStreamFetch, chatOnce } from "./api";
import "./style.css";

// Helper: bersihin Markdown tapi PERTAHANKAN numbering & bullet
function toPlainWithLabels(s = "") {
  return s
    .replace(/```[\s\S]*?```/g, "")        // buang code block
    .replace(/`([^`]+)`/g, "$1")           // buang inline code
    .replace(/\*\*(.*?)\*\*/g, "$1")       // hilangkan **bold**
    .replace(/\*(.*?)\*/g, "$1")           // hilangkan *italic*
    .replace(/^#{1,6}\s*/gm, "")           // hilangkan heading markdown
    .replace(/^\s*[-*+]\s+/gm, "• ")       // pertahankan bullet -> ganti ke "• "
    .replace(/^\s*(\d+)\.\s*/gm, (_, n) => `${n}. `) // pertahankan numbering "1. "
    .replace(/[ \t]+/g, " ")               // rapikan spasi
    .replace(/\n{3,}/g, "\n\n")            // rapikan newline
    .trim();
}

export default function App() {
  // ========== STATE ==========
  const [messages, setMessages] = useState([]);     // [{role: "user"|"assistant", content}]
  const [input, setInput] = useState("");           // isi input bar
  const [system, setSystem] = useState("You are a helpful, concise assistant."); // system prompt
  const [loading, setLoading] = useState(false);    // ngunci tombol saat request jalan

  // Accumulator teks untuk streaming
  const accRef = useRef("");

  // Auto-scroll ke bawah setiap ada pesan baru
  const chatBoxRef = useRef(null);
  useEffect(() => {
    chatBoxRef.current?.scrollTo({ top: chatBoxRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  // ========= KIRIM PESAN =========
  // stream=true => SSE (nampilin bertahap); false => tunggu jawaban penuh
  const send = (stream = true) => {
    if (!input.trim()) return; // validasi

    // dorong pesan user ke history
    const nextMessages = [...messages, { role: "user", content: input }];
    setMessages(nextMessages);

    // reset UI
    setInput("");
    setLoading(true);
    accRef.current = "";

    if (stream) {
      // ---- MODE STREAMING ----
      chatStreamFetch({
        messages: nextMessages,
        system,
        onChunk: (chunkText) => {
          accRef.current += chunkText; // gabung chunk
          // render bubble assistant yang bertumbuh
          setMessages([...nextMessages, { role: "assistant", content: accRef.current }]);
        },
        onDone: () => setLoading(false),
        onError: () => setLoading(false),
      });
    } else {
      // ---- MODE NON-STREAM (sekali respon) ----
      chatOnce(input, system)
        .then((fullText) => setMessages([...nextMessages, { role: "assistant", content: fullText }]))
        .finally(() => setLoading(false));
    }
  };

  // Enter kirim (stream), Shift+Enter baris baru
  const onKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send(true);
    }
  };

  // Bersihkan chat
  const clearChat = () => {
    setMessages([]);
    accRef.current = "";
  };

  // ========== RENDER ==========
  return (
    <div className="page">{/* center whole app di tengah layar (lihat style.css) */}
      <div className="app">{/* card utama */}
        {/* HEADER */}
        <header className="app__header">
          <div className="brand"><span className="logo">🚀</span> Gumi Chat</div>
          <div className="meta">Model: {import.meta.env.VITE_MODEL || "gemini-2.5-flash"}</div>
        </header>

        {/* SYSTEM PROMPT */}
        <section className="system">
          <label>System Prompt</label>
          <textarea
            rows={2}
            value={system}
            onChange={(e) => setSystem(e.target.value)}
            spellCheck={false}
            placeholder="Contoh: Tulis paragraf rapi. Jika perlu, gunakan bullet/nomor."
          />
        </section>

        {/* AREA CHAT */}
        <section className="chat" ref={chatBoxRef}>
          {messages.map((m, i) => (
            <div key={i} className={`msg ${m.role}`}>
              <div className="bubble">
                {/* user: tampil apa adanya; assistant: bersih tapi label tetap */}
                {m.role === "assistant" ? toPlainWithLabels(m.content) : m.content}
              </div>
            </div>
          ))}

          {/* Indikator loading sederhana */}
          {loading && (
            <div className="msg assistant">
              <div className="bubble bubble--typing">mengetik…</div>
            </div>
          )}
        </section>

        {/* COMPOSER */}
        <section className="composer">
          <input
            type="text"
            placeholder="Tanya apa aja..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={onKeyDown}
          />
          <button className="btn" disabled={loading} onClick={() => send(true)}>Stream</button>
          <button className="btn btn--ghost" disabled={loading} onClick={() => send(false)}>Send</button>
          <button className="btn btn--danger" disabled={loading || messages.length === 0} onClick={clearChat}>Clear</button>
        </section>
      </div>
    </div>
  );
}
