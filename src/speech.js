import { spawn } from "node:child_process";

function runTermux(command, args = []) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { stdio: ["ignore", "pipe", "pipe"] });
    let stdout = "";
    let stderr = "";
    child.stdout.setEncoding("utf8");
    child.stderr.setEncoding("utf8");
    child.stdout.on("data", chunk => { stdout += chunk; });
    child.stderr.on("data", chunk => { stderr += chunk; });
    child.on("error", error => {
      if (error.code === "ENOENT") reject(new Error("Comando não encontrado. Instale o Termux:API e o pacote termux-api."));
      else reject(error);
    });
    child.on("close", code => {
      if (code === 0) resolve(stdout.trim());
      else reject(new Error(stderr.trim() || `O comando de voz terminou com código ${code}.`));
    });
  });
}

export async function speak(text) {
  const message = String(text ?? "").trim();
  if (!message) return false;
  await runTermux("termux-tts-speak", [message]);
  return true;
}

export async function listen() {
  const text = await runTermux("termux-speech-to-text");
  return text.trim();
}
