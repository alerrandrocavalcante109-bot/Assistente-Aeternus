export function getLocalResponse(input) {
  const text = input.trim().toLocaleLowerCase("pt-BR");

  if (["oi", "olá", "ola", "bom dia", "boa tarde", "boa noite"].includes(text)) {
    return "Olá! Eu sou a Aeternus. Como posso ajudar?";
  }
  if (text === "/ajuda" || text === "ajuda") {
    return [
      "Comandos disponíveis:",
      "/ajuda — mostra esta lista",
      "/voz — tenta reconhecer uma fala",
      "/falar texto — lê o texto em voz alta",
      "/status — mostra recursos configurados",
      "/sair — encerra o assistente",
      "",
      "Você também pode conversar por texto. Configure AI_API_KEY no arquivo .env para habilitar respostas por IA."
    ].join("\n");
  }
  if (text === "/status") {
    return "Aeternus está ativa. A integração de IA e a disponibilidade da voz dependem das configurações e dos aplicativos instalados.";
  }
  return null;
}
