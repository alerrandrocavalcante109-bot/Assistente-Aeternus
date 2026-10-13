import readline from "node:readline";
import { stdin, stdout } from "node:process";
import { config } from "./config.js";
import { replyTo } from "./assistant.js";
import { listen, speak } from "./speech.js";

const rl = readline.createInterface({ input: stdin, output: stdout, terminal: true });
let history = [];
let busy = false;

function ask(prompt = "\nVocê › ") {
  rl.question(prompt, async raw => {
    const input = raw.trim();
    if (!input) return ask();

    if (input === "/sair" || input === "sair") {
      console.log("Aeternus › Até logo!");
      rl.close();
      return;
    }

    if (busy) {
      console.log("Aeternus › Ainda estou processando a mensagem anterior.");
      return ask();
    }

    if (input === "/voz") {
      if (!config.termuxVoice) {
        console.log("Aeternus › A voz está desativada em TERMUX_VOICE.");
        return ask();
      }
      busy = true;
      try {
        console.log("Aeternus › Ouvindo… fale agora.");
        const recognized = await listen();
        if (recognized) {
          console.log(`Você (voz) › ${recognized}`);
          const result = await replyTo(recognized, history);
          history = result.history;
          console.log(`Aeternus › ${result.text}`);
        } else {
          console.log("Aeternus › Não reconheci uma frase. Tente novamente.");
        }
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
      const text = input.slice(7).trim();
      try {
        await speak(text);
        console.log("Aeternus › Leitura enviada para o Termux:API.");
      } catch (error) {
        console.log(`Aeternus › Não consegui falar: ${error.message}`);
      }
      return ask();
    }

    busy = true;
    try {
      const result = await replyTo(input, history);
      history = result.history;
      console.log(`\nAeternus › ${result.text}`);
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
