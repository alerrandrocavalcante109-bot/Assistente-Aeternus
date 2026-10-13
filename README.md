# Aeternus — Assistente pessoal para Termux

Assistente pessoal modular em Node.js, pensado para Android com Termux. A primeira versão oferece uma interface de terminal em português, entrada/saída de voz via Termux:API quando disponível, comandos locais seguros e uma camada de IA configurável por provedor compatível com a API da OpenAI.

> **Estado:** base inicial do projeto. A integração de IA é opcional e depende de configurar uma chave própria. Nenhuma chave ou segredo deve ser enviado ao GitHub.

## Requisitos

- Android com [Termux](https://termux.dev/) instalado de uma fonte confiável.
- Node.js 20 ou superior (instalável com `pkg install nodejs`).
- Opcional: app Termux:API e pacote `termux-api` para fala e reconhecimento de voz.
- Opcional: uma chave de API de um provedor compatível com o formato da OpenAI.

## Instalação

```bash
pkg update && pkg upgrade
pkg install nodejs
pkg install termux-api
git clone https://github.com/alerrandrocavalcante109-bot/Assistente-Aeternus.git
cd Assistente-Aeternus
npm install
cp .env.example .env
nano .env
npm start
```

Edite `.env` para configurar o provedor. Sem chave de API, o modo local continua funcionando com comandos básicos.

## Uso

- Digite uma mensagem e pressione Enter.
- `/ajuda` mostra os comandos.
- `/voz` tenta reconhecer fala com `termux-speech-to-text`.
- `/falar texto` usa `termux-tts-speak`, se instalado.
- `/sair` encerra o assistente.

## Execução em segundo plano

Para reduzir interrupções durante sessões longas, pode-se usar `termux-wake-lock` e configurar o Termux:Boot. O Android pode restringir microfone, rede e processos em segundo plano, especialmente com a tela bloqueada; por isso, esta versão **não promete escuta contínua por palavra de ativação**. Use os recursos de voz de forma explícita.

## Segurança

- Nunca coloque tokens ou chaves no código ou em commits.
- Comandos locais usam uma lista permitida; não há execução arbitrária de texto do modelo no shell.
- Revise qualquer ação local antes de ampliar as permissões.
- O conteúdo enviado ao provedor de IA pode sair do dispositivo. Não envie senhas, tokens ou dados sensíveis.

## Estrutura

- `src/index.js`: interface de terminal e ciclo principal.
- `src/assistant.js`: lógica de conversa e integração opcional com IA.
- `src/config.js`: leitura e validação de configuração.
- `src/speech.js`: integração opcional com Termux:API.
- `src/safe-commands.js`: comandos locais permitidos.

## Licença

Ainda não definida.
