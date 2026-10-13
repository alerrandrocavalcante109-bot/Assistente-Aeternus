import { config } from "./config.js";
import { getLocalResponse } from "./safe-commands.js";

const SYSTEM_PROMPT = [
  "Seu nome é Aeternus.",
  "Você é uma assistente pessoal útil, clara, cuidadosa e natural.",
  "Responda em português brasileiro, a menos que a pessoa peça outro idioma.",
  "Não afirme que executou ações no dispositivo se isso não aconteceu.",
  "Nunca peça nem exponha senhas, tokens ou chaves secretas.",
  "Não forneça comandos de terminal destrutivos como se fossem ações necessárias."
].join(" ");

export async function replyTo(userText, history = []) {
  const local = getLocalResponse(userText);
  if (local !== null) return { text: local, history };

  if (!config.apiKey) {
    return {
      text: "Ainda estou no modo local, sem uma chave de IA configurada. Posso responder aos comandos /ajuda e /status. Para ativar a conversa com IA, configure AI_API_KEY no arquivo .env.",
      history
    };
  }

  const messages = [
    { role: "system", content: SYSTEM_PROMPT },
    ...history.slice(-12),
    { role: "user", content: userText }
  ];

  let response;
  try {
    response = await fetch(`${config.baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${config.apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: config.model,
        messages,
        temperature: 0.7
      }),
      signal: AbortSignal.timeout(45000)
    });
  } catch (error) {
    return { text: `Não consegui conectar ao serviço de IA: ${error.message}`, history };
  }

  if (!response.ok) {
    const detail = (await response.text()).slice(0, 500);
    return {
      text: `O serviço de IA respondeu com erro HTTP ${response.status}. Confira a URL, o modelo e a chave no .env. ${detail}`,
      history
    };
  }

  const data = await response.json();
  const answer = data?.choices?.[0]?.message?.content;
  if (typeof answer !== "string" || !answer.trim()) {
    return { text: "O serviço de IA não retornou uma resposta de texto válida.", history };
  }

  const nextHistory = [
    ...history,
    { role: "user", content: userText },
    { role: "assistant", content: answer.trim() }
  ].slice(-12);

  return { text: answer.trim(), history: nextHistory };
}
