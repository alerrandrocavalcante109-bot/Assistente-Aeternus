import { spawn } from "node:child_process";

const MAX_OUTPUT = 64 * 1024;

function runTermux(command, args = [], { timeoutMs = 60000 } = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { stdio: ["ignore", "pipe", "pipe"] });
    let stdout = "";
    let stderr = "";
    let settled = false;

    const finish = (error, value) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      if (error) reject(error);
      else resolve(value);
    };

    const timer = setTimeout(() => {
      child.kill("SIGTERM");
      finish(new Error("A operação de voz demorou demais e foi interrompida."));
    }, timeoutMs);

    child.stdout.setEncoding("utf8");
    child.stderr.setEncoding("utf8");
    child.stdout.on("data", chunk => {
      stdout += chunk;
      if (stdout.length > MAX_OUTPUT) {
        child.kill("SIGTERM");
        finish(new Error("A resposta do serviço de voz foi grande demais."));
      }
    });
    child.stderr.on("data", chunk => {
      stderr += chunk;
      if (stderr.length > MAX_OUTPUT) stderr = stderr.slice(-MAX_OUTPUT);
    });
    child.on("error", error => {
      if (error.code === "ENOENT") {
        finish(new Error("Não encontrei o comando do Termux:API. Instale o app Termux:API e execute pkg install termux-api."));
      } else {
        finish(error);
      }
    });
    child.on("close", code => {
      if (code === 0) finish(null, stdout.trim());
      else finish(new Error(stderr.trim() || `O comando de voz terminou com código ${code}.`));
    });
  });
}

export async function speak(text, { rate, pitch, language } = {}) {
  const message = String(text ?? "").trim();
  if (!message) return false;

  const args = [];
  if (language) args.push("-l", String(language));
  if (Number.isFinite(rate)) args.push("-r", String(Math.min(4, Math.max(0.1, rate))));
  if (Number.isFinite(pitch)) args.push("-p", String(Math.min(2, Math.max(0.1, pitch))));
  args.push(message);

  await runTermux("termux-tts-speak", args, { timeoutMs: 90000 });
  return true;
}

export async function listen({ timeoutMs = 60000 } = {}) {
  const recognized = await runTermux("termux-speech-to-text", [], { timeoutMs });
  return recognized.trim();
}
