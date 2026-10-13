# Aeternus — Assistente por Voz

Aplicação web estática que roda no navegador. A interface usa a voz do navegador para detectar a palavra de ativação **“Aeternus”**, ouvir pedidos, consultar um provedor de IA escolhido e ler as respostas em voz alta.

## Abrir

O ponto de entrada é [index.html](./index.html). O projeto pode ser publicado como site estático em GitHub Pages ou Cloudflare Pages.

## Recursos iniciais

- Interface responsiva em português.
- Ativação por voz com SpeechRecognition / Web Speech API quando disponível.
- Palavra de ativação: “Aeternus”.
- Síntese de voz com SpeechSynthesis do navegador.
- Conversa por texto como alternativa.
- Pausa automática da escuta após 20 minutos sem interação.
- Seleção entre Google Gemini, Groq e OpenRouter.
- Configuração opcional de chave e modelo por usuário.

## APIs de IA

A aplicação inclui conectores diretos para:
- Google Gemini API: https://ai.google.dev/
- Groq API: https://console.groq.com/
- OpenRouter API: https://openrouter.ai/

Esses serviços podem oferecer cotas gratuitas ou modelos gratuitos, mas não são ilimitados nem necessariamente anônimos. Consulte as regras e limites atuais de cada provedor e gere sua própria chave. A disponibilidade de modelos muda com o tempo.

## Configuração

1. Publique o repositório como site estático ou abra-o em um servidor local seguro.
2. Abra o site em um navegador compatível, como uma versão atual do Chrome.
3. Toque em **Ativar voz** e autorize o microfone.
4. Abra ⚙ e escolha um provedor, informe sua chave e selecione um modelo.
5. Diga “Aeternus” e, após a ativação, faça seu pedido.

A ativação do microfone exige uma ação inicial do usuário. O navegador pode interromper o reconhecimento, exigir nova permissão ou depender de conexão com um serviço de reconhecimento de fala. O site não consegue garantir escuta permanente quando a aba está suspensa, o navegador é fechado ou o dispositivo restringe a atividade em segundo plano.

## Privacidade e segurança

- Não existe chave de API compartilhada embutida no repositório.
- A chave é enviada diretamente do navegador ao provedor escolhido.
- Se marcar “Guardar a chave neste dispositivo”, ela fica no armazenamento local do navegador. Não use essa opção em dispositivos compartilhados.
- O texto enviado ao provedor de IA sai do navegador e fica sujeito às políticas do provedor.
- Use apenas chaves próprias e revogue-as se acreditar que foram expostas.

## Arquivos

- `index.html`: interface.
- `styles.css`: estilo responsivo.
- `app.js`: ativação por voz, conversa e conectores de IA.
- `src/`: protótipo anterior em Node.js/Termux, mantido como referência por enquanto.

## Limitações desta primeira versão

- O navegador exige toque inicial para começar a escuta.
- O reconhecimento depende do suporte do navegador e pode usar serviços externos.
- A escuta pode reiniciar quando o navegador a interrompe, mas não há garantia de execução contínua em segundo plano.
- A chave pessoal do provedor é necessária para obter respostas de IA.
