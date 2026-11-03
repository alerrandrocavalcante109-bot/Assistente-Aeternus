# Yukina — Serviço de tradução

Este repositório hospeda uma instância própria do **LibreTranslate** para o bot Yukina. O serviço usa modelos de tradução Argos Translate e não depende de uma API comercial.

## Implantação no Render

1. No Render, crie um **New Web Service** e conecte este repositório: `alerrandrocavalcante109-bot/Assistente-Aeternus`.
2. Selecione a branch `main) e o ambiente **Docker** (o Render também pode detectar o `render.yaml`).
3. Use o plano disponível na sua conta. O plano Free pode suspender o serviço quando estiver ocioso.
4. Aguarde o primeiro deploy: os modelos de idioma precisam ser baixados e carregados. A primeira inicialização pode demorar.
5. Quando estiver ativo, teste `https://SEU-SERVICO.onrender.com/languages`. A resposta deve ser uma lista de idiomas.

## Configuração no bot Yukina

No serviço do bot, configure:

- `LIBRETRANSLATE_URL`: URL pública do serviço, sem acrescentar `/translate`.

Exemplo: `https://yukina-translator.onrender.com`.

A integração atual do bot envia `POST /translate` com `q`, `source=auto` e `target=pt`.

## Idiomas e limites

Modelos habilitados: inglês, espanhol, francês, japonês, russo, chinês e português. O serviço limita o texto a 4.500 caracteres e a taxa geral a 15 requisições por minuto por cliente IP. Os créditos diários e limites por plano continuam sendo controlados pelo bot Yukina, não por este serviço.

## Observações

- O serviço é independente do processo principal do bot.
- A tradução é executada no próprio serviço com LibreTranslate/Argos Translate.
- Em hospedagem gratuita, o serviço pode “dormir” e a primeira solicitação após a suspensão pode demorar.
- O armazenamento efêmero pode exigir baixar os modelos novamente após recriações do contêiner.
- Não coloque chaves ou segredos neste repositório. Configure valores sensíveis nas variáveis do Render.
