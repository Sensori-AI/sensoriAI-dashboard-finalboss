import React, { useState, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Send, Bot, User } from "lucide-react";

type Role = "user" | "assistant";
interface Message { id: string; role: Role; content: string; }

/**
 * Modos de resposta do assistente
 */
const AGRO_MODES = {
  concise: {
    id: "concise",
    name: "Conciso (Recomendação rápida)",
    system:
      "Você é um assistente agronômico amigável e prático. Responda em português, de forma concisa e direta."
  },
  detailed: {
    id: "detailed",
    name: "Detalhado (Explicações e referências)",
    system:
      "Você é um especialista agronômico empático. Responda em português com explicações completas."
  },
  safety: {
    id: "safety",
    name: "Segurança (foco em segurança e LGPD)",
    system:
      "Você é um assistente com foco em segurança operacional e LGPD. Destaque riscos e procedimentos."
  }
} as const;


/* -----------------------------
   EXTRAÇÃO DE TEXTO DO ASSISTENTE
--------------------------------*/
function extractAssistantFromResponseObject(obj: any, rawTextFallback?: string): string {
  if (!obj) return rawTextFallback ?? "Desculpe — resposta inválida.";

  if (typeof obj.assistant === "string") {
    return obj.assistant;
  }

  const raw = obj.raw ?? obj;
  try {
    const choice = raw?.choices?.[0];
    if (choice?.message?.content) return choice.message.content;
    if (choice?.text) return choice.text;
  } catch {}

  if (rawTextFallback) return rawTextFallback;
  return "Desculpe — não consegui processar a resposta.";
}


/* ================================
   COMPONENTE PRINCIPAL
=================================*/
export const ConsultantChatbot: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([
    { id: "1", role: "assistant", content: "Olá! Sou o assistente virtual da SensoriAI. Como posso ajudar?" }
  ]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [agroMode, setAgroMode] = useState<keyof typeof AGRO_MODES>("concise");
  const [error, setError] = useState<string | null>(null);
  const sessionIdRef = useRef<string>(Date.now().toString());

  // Append incremental
  const appendAssistantChunk = (chunk: string) => {
    setMessages(prev => {
      const last = prev[prev.length - 1];
      if (!last || last.role !== "assistant") {
        return [...prev, { id: Date.now().toString(), role: "assistant", content: chunk }];
      }
      return [
        ...prev.slice(0, -1),
        { ...last, content: last.content + chunk }
      ];
    });
  };

  // Extrator de objetos JSON do streaming
  function extractJsonObjectsFromChunk(chunkStr: string): any[] {
    const objs: any[] = [];
    const blocks = chunkStr.split(/\r?\n\r?\n/);
    for (const block of blocks) {
      if (!block) continue;
      const lines = block.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
      for (const line of lines) {
        if (line === "data: [DONE]") {
          objs.push({ done: true });
          continue;
        }
        if (line.startsWith("data:")) {
          const after = line.replace("data:", "").trim();
          try { objs.push(JSON.parse(after)); }
          catch { objs.push({ raw: after }); }
        }
      }
    }
    return objs;
  }

  /* --------------------------------------------
     handleSend — CHAMANDO O BACKEND DO VERCEL
  ---------------------------------------------*/
  const handleSend = async () => {
    if (!input.trim() || sending) return;

    setError(null);
    setSending(true);

    const userMsg: Message = { id: Date.now().toString(), role: "user", content: input.trim() };
    setMessages(prev => [...prev, userMsg]);
    setInput("");

    // monta histórico
    const systemMsg = { role: "system", content: AGRO_MODES[agroMode].system };
    const history = [...messages, userMsg].slice(-10).map(m => ({ role: m.role, content: m.content }));

    try {
      /* STREAMING — chamando rota segura do Vercel */
      const resp = await fetch("/api/openrouter/stream", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          messages: [systemMsg, ...history], 
          sessionId: sessionIdRef.current 
        })
      });

      if (!resp.ok) {
        const txt = await resp.text();
        throw new Error(`Erro no stream: ${txt}`);
      }

      const reader = resp.body?.getReader();
      if (!reader) throw new Error("Streaming não disponível.");

      const decoder = new TextDecoder();
      let done = false;

      // placeholder inicial
      setMessages(prev => [...prev, { id: Date.now().toString(), role: "assistant", content: "" }]);

      while (!done) {
        const { value, done: d } = await reader.read();
        if (d) break;
        if (!value) continue;

        const chunk = decoder.decode(value, { stream: true });
        const parsed = extractJsonObjectsFromChunk(chunk);

        for (const obj of parsed) {
          if (obj?.done) { done = true; break; }

          let delta = "";
          if (obj?.choices?.[0]?.delta?.content) {
            delta += obj.choices[0].delta.content;
          } else if (obj?.raw) {
            delta += obj.raw;
          }

          if (delta.trim()) appendAssistantChunk(delta);
        }
      }

      /* Após stream, pedir versão final limpa (sem cortes do stream) */
      const finalResp = await fetch("/api/openrouter/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          messages: [systemMsg, ...history], 
          sessionId: sessionIdRef.current,
          save: true
        })
      });

      const finalTxt = await finalResp.text();
      let finalJson;
      try { finalJson = JSON.parse(finalTxt); } 
      catch { finalJson = { assistant: finalTxt }; }

      const finalAssistant = extractAssistantFromResponseObject(finalJson, finalTxt);

      setMessages(prev => {
        const last = prev[prev.length - 1];
        if (last.role === "assistant") {
          return [
            ...prev.slice(0, -1),
            { ...last, content: finalAssistant }
          ];
        }
        return [...prev, { id: Date.now().toString(), role: "assistant", content: finalAssistant }];
      });

    } catch (err: any) {
      console.error(err);
      setError(err.message ?? "Erro inesperado.");
    } finally {
      setSending(false);
    }
  };

  /* --------------------------------------------
     RETORNO JSX
  ---------------------------------------------*/
  return (
    <Card className="h-full flex flex-col">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bot className="h-5 w-5 text-primary" />
          Assistente Virtual
        </CardTitle>
      </CardHeader>

      <CardContent className="flex-1 flex flex-col gap-4 p-4">

        {/* MODO */}
        <div className="flex gap-2 items-center">
          <label className="text-sm">Modo:</label>
          <select
            value={agroMode}
            onChange={e => setAgroMode(e.target.value as any)}
            className="p-2 border rounded"
          >
            {Object.values(AGRO_MODES).map(m => (
              <option key={m.id} value={m.id}>{m.name}</option>
            ))}
          </select>
        </div>

        {/* CHAT */}
        <ScrollArea className="flex-1 pr-4">
          <div className="space-y-4">
            {messages.map(m => (
              <div key={m.id} className={`flex gap-3 ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                
                {m.role === "assistant" && (
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                    <Bot className="h-4 w-4 text-primary" />
                  </div>
                )}

                <div className={`rounded-lg p-3 max-w-[80%] ${
                  m.role === "user" 
                    ? "bg-primary text-primary-foreground" 
                    : "bg-muted"
                }`}>
                  <p className="text-sm whitespace-pre-wrap">{m.content}</p>
                </div>

                {m.role === "user" && (
                  <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
                    <User className="h-4 w-4 text-primary-foreground" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </ScrollArea>

        {error && <div className="text-sm text-destructive">{error}</div>}

        {/* INPUT */}
        <div className="flex gap-2">
          <Input
            placeholder={sending ? "Enviando..." : "Digite sua pergunta..."}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === "Enter" && handleSend()}
            disabled={sending}
            className="flex-1"
          />
          <Button size="icon" onClick={handleSend} disabled={sending}>
            <Send className="h-4 w-4" />
          </Button>
        </div>

      </CardContent>
    </Card>
  );
};
