export async function chatOnce(prompt, system) {
  const res = await fetch("/api/chat/once", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ prompt, system })
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || "Request failed");
  return json.text;
}

export function chatStreamFetch({ messages, system, onChunk, onDone, onError }) {
  fetch("/api/chat/stream", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ messages, system })
  })
    .then(async (res) => {
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        chunk.split("\n\n").forEach((line) => {
          if (!line.startsWith("data: ")) return;
          const payload = line.slice(6);
          if (payload === "[DONE]") return onDone?.();
          try {
            const { text } = JSON.parse(payload);
            if (text) onChunk?.(text);
          } catch {}
        });
      }
      onDone?.();
    })
    .catch((err) => onError?.(err));
}
