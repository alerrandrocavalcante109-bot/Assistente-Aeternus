import readline from "node:readline";
import { stdin, stdout } from "node:process";
import { config } from "./config.js";
import { replyTo } from "./assistant.js";
import { listen, speak } from "./speech.js";

const rl = readline.createInterface({ input: stdin, output: stdout, terminal: true });
let history = [];
let busy = false;
let voiceConversation = false;

function showHelp() {
  console.log([
    "Comandos de voz:",
    "/voz — ouve uma frase, responde e fala a resposta",
    "/conversar — inicia conversa por voz em turnos",
    "/parar-voz — encerra o modo de conversa por voz após o turno atual",
    "/falar texto — lê um texto em voz alta",
    "/silencio — alterna a fala automática das respostas",
    "/ajuda — mostra ajuda",
    "/status — mostra o estado do assistente",
    "/sair — encerra"
  ].join("\n"));
}

let speakReplies = true;

async function processMessage(text, { fromVoice = false } = {}) {
  const result = await replyTo(text, history);
  history = result.history;
  console.log(`\nAeternus › ${result.text}`);
  if (speakReplies && config.termuxVoice) {
    try {
      await speak(result.text, { language: "pt-BR" });
    } catch (error) {
      console.log(`Aeternus (voz) › Não consegui reproduzir a resposta: ${error.message}`);
    }
  }
  return result;
}

async function voiceTurn() {
  console.log("Aeternus › Ouvindo… fale depois do sinal do Android.");
  const recognized = await listen();
  if (!recognized) {
    console.log("Aeternus › Não reconheci uma frase. Tente novamente.");
    return false;
  }
  console.log(`Você (voz) › ${recognized}`);
  if (["parar voz", "parar a voz", "encerrar conversa"].includes(recognized.toLocaleLowerCase("pt-BR").trim())) {
    voiceConversation = false;
    console.log("Aeternus › Conversa por voz encerrada.");
    return false;
  }
  await processMessage(recognized, { fromVoice: true });
  return true;
}

async function startVoiceConversation() {
  if (!config.termuxVoice) {
    console.log("Aeternus › A voz está desativada. Ajuste TERMUX_VOICE=true no .env.");
    return;
  }
  voiceConversation = true;
  console.log("Aeternus › Modo de conversa por voz ativado. Fale por turnos; diga “parar voz” para encerrar.");
  while (voiceConversation) {
    try {
      const gotInput = await voiceTurn();
      if (!gotInput) {
        if (voiceConversation) continue;
        break;
      }
    } catch (error) {
      console.log(`Aeternus › Erro de voz: ${error.message}`);
      voiceConversation = false;
      break;
    }
  }
}

function ask() {
  if (busy || voiceConversation) return;
  rl.question("\nVocê › ", async raw => {
    const input = raw.trim();
    if (!input) return ask();

    if (input === "/sair" || input.toLocaleLowerCase("pt-BR") === "sair") {
      console.log("Aeternus › Até logo!");
      rl.close();
      return;
    }

    if (input === "/ajuda" || input === "ajuda") {
      showHelp();
      return ask();
    }

    if (input === "/status") {
      console.log(`Aeternus › IA: ${config.apiKey ? "configurada" : "modo local"}; voz: ${config.termuxVoice ? "habilitada por configuração" : "desativada"}; fala automática: ${speakReplies ? "ligada" : "desligada"}.`);
      return ask();
    }

    if (input === "/silencio") {
      speakReplies = !speakReplies;
      console.log(`Aeternus › Fala automática ${speakReplies ? "ativada" : "desativada"}.`);
      return ask();
    }

    if (input === "/parar-voz") {
      voiceConversation = false;
      console.log("Aeternus › Nenhuma conversa por voz está ativa no terminal.");
      return ask();
    }

    if (input === "/conversar") {
      busy = true;
      try {
        await startVoiceConversation();
      } finally {
        busy = false;
      }
      return ask();
    }

    if (input === "/voz") {
      if (!config.termuxVoice) {
        console.log("Aeternus › A voz está desativada em TERMUX_VOICE.");
        return ask();
      }
      busy = true;
      try {
        await voiceTurn();
      } catch (error) {
        console.log(`Aeternus › Não consegui usar o reconhecimento de voz: ${error.message}`);
      } finally {
        busy = false;
      }
      return ask();
    }

    if (input.startsWith("/falar ")) {
      if (!config.termuxVoice) {
        console.log("Aeternus › A voz está desativada em TERMUX_VOICE.");
        return ask();
      }
      busy = true;
      try {
        const text = input.slice(7).trim();
        await speak(text, { language: "pt-BR" });
        console.log("Aeternus › Leitura enviada para o Termux:API.");
      } catch (error) {
        console.log(`Aeternus › Não consegui falar: ${error.message}`);
      } finally {
        busy = false;
      }
      return ask();
    }

    busy = true;
    try {
      await processMessage(input);
    } catch (error) {
      console.error(`\nAeternus › Erro inesperado: ${error.message}`);
    } finally {
      busy = false;
    }
    ask();
  });
}

console.log("╭────────────────────────────────────╮");
console.log("│       AETERNUS · ASSISTENTE        │");
console.log("╰────────────────────────────────────╯");
console.log("Modo: Termux / Node.js");
console.log(`IA: ${config.apiKey ? "configurada" : "modo local"} | Voz: ${config.termuxVoice ? "habilitada (se instalada)" : "desativada"}`);
console.log("Digite /ajuda para ver os comandos ou /sair para encerrar.");
ask();

rl.on("close", () => {
  voiceConversation = false;
  process.exitCode = 0;
});
