(() => {
  "use strict";

  const $ = (selector) => document.querySelector(selector);
  const els = {
    statusPill: $("#status-pill"), statusText: $("#status-text"), orb: $("#voice-orb"),
    start: $("#start-button"), stop: $("#stop-button"), support: $("#support-note"),
    messages: $("#messages"), empty: $("#empty-state"), form: $("#chat-form"), input: $("#message-input"),
    settingsToggle: $("#settings-toggle"), settings: $("#settings-panel"), settingsClose: $("#settings-close"),
    provider: $("#provider-select"), key: $("#api-key"), model: $("#model-select"),
    autoSpeak: $("#auto-speak"), saveKey: $("#save-key"), saveSettings: $("#save-settings"),
    clear: $("#clear-button")
  };

  const MODELS = {
    gemini: [
      ["gemini-2.5-flash", "Gemini 2.5 Flash"],
      ["gemini-2.5-flash-lite", "Gemini 2.5 Flash-Lite"]
    ],
    groq: [
      ["llama-3.3-70b-versatile", "Llama 3.3 70B"],
      ["openai/gpt-oss-120b", "GPT-OSS 120B"],
      ["llama-3.1-8b-instant", "Llama 3.1 8B Instant"]
    ],
    openrouter: [
      ["openrouter/free", "Roteador de modelos gratuitos"],
      ["google/gemma-3-27b-it:free", "Gemma 3 27B (grátis, se disponível)"],
      ["meta-llama/llama-3.3-70b-instruct:free", "Llama 3.3 70B (grátis, se disponível)"]
    ]
  };

  const state = {
    recognition: null, listening: false, waitingForCommand: false,
    conversation: [], lastInteraction: Date.now(), idleTimer: null,
    restartTimer: null, speaking: false, manualStop: false,
    wakeWord: "aeternus", pendingFinal: "", key: "", provider: "gemini",
    model: "gemini-2.5-flash", autoSpeak: true, saved: false
  };

  function setStatus(text, mode = "") {
    els.statusText.textContent = text;
    els.statusPill.className = "status-pill" + (mode ? " " + mode : "");
    els.orb.classList.toggle("listening", mode === "active");
    els.orb.classList.toggle("speaking", mode === "speaking");
  }

  function touch() {
    state.lastInteraction = Date.now();
    if (state.listening) scheduleIdleTimeout();
  }

  function scheduleIdleTimeout() {
    clearTimeout(state.idleTimer);
    state.idleTimer = setTimeout(() => {
      stopAssistant("Parei após 20 minutos sem interação. Toque em Ativar voz para recomeçar.");
    }, 20 * 60 * 1000);
  }

  function addMessage(role, text) {
    els.empty.hidden = true;
    const bubble = document.createElement("article");
    bubble.className = "message " + role;
    const sender = document.createElement("div");
    sender.className = "sender";
    sender.textContent = role === "user" ? "VOCÊ" : "AETERNUS";
    const body = document.createElement("div");
    body.textContent = text;
    bubble.append(sender, body);
    els.messages.appendChild(bubble);
    els.messages.scrollTop = els.messages.scrollHeight;
    state.conversation.push({ role, content: text });
  }

  function normalize(text) {
    return text.toLocaleLowerCase("pt-BR")
      .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9\s]/g, " ").replace(/\s+/g, " ").trim();
  }

  function findWakeWord(text) {
    const normalized = normalize(text);
    const variants = ["aeternus", "eternus", "aeterno"];
    for (const variant of variants) {
      const index = normalized.indexOf(variant);
      if (index >= 0) return { found: true, rest: normalized.slice(index + variant.length).trim() };
    }
    return { found: false, rest: "" };
  }

  function stopRecognitionOnly() {
    if (state.recognition) {
      try { state.recognition.onend = null; state.recognition.stop(); } catch {}
      state.recognition = null;
    }
    state.listening = false;
    clearTimeout(state.restartTimer);
  }

  function stopAssistant(message = "Assistente pausada.") {
    state.manualStop = true;
    state.waitingForCommand = false;
    clearTimeout(state.idleTimer);
    clearTimeout(state.restartTimer);
    stopRecognitionOnly();
    if ("speechSynthesis" in window) window.speechSynthesis.cancel();
    els.start.disabled = false;
    els.stop.disabled = true;
    setStatus("Pausada");
    els.support.textContent = message;
  }

  function startRecognition() {
    const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!Recognition) {
      setStatus("Voz não suportada", "warning");
      els.support.textContent = "Este navegador não oferece reconhecimento de voz. Tente uma versão atual do Chrome.";
      return false;
    }

    stopRecognitionOnly();
    const recognition = new Recognition();
    recognition.lang = "pt-BR";
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;
    state.recognition = recognition;

    recognition.onstart = () => {
      state.listening = true;
      els.start.disabled = true;
      els.stop.disabled = false;
      setStatus(state.waitingForCommand ? "Ouvindo seu pedido…" : "Esperando “Aeternus”…", "active");
      scheduleIdleTimeout();
    };

    recognition.onresult = (event) => {
      touch();
      for (let i = event.resultIndex; i < event.results.length; i++) {
        if (!event.results[i].isFinal) continue;
        const transcript = event.results[i][0].transcript.trim();
        if (!transcript) continue;
        handleRecognized(transcript);
      }
    };

    recognition.onerror = (event) => {
      if (["not-allowed", "service-not-allowed"].includes(event.error)) {
        stopAssistant("Permissão do microfone negada. Autorize o microfone nas configurações do navegador.");
      } else if (event.error === "audio-capture") {
        stopAssistant("Nenhum microfone disponível. Verifique o dispositivo.");
      } else if (event.error !== "no-speech" && event.error !== "aborted") {
        els.support.textContent = "Reconhecimento de voz: " + event.error + ". O navegador pode tentar reconectar.";
      }
    };

    recognition.onend = () => {
      state.listening = false;
      if (state.manualStop) return;
      clearTimeout(state.restartTimer);
      state.restartTimer = setTimeout(() => {
        if (!state.manualStop && Date.now() - state.lastInteraction < 20 * 60 * 1000) {
          startRecognition();
        } else if (!state.manualStop) {
          stopAssistant("Parei após 20 minutos sem interação.");
        }
      }, 500);
    };

    try {
      recognition.start();
      state.manualStop = false;
      return true;
    } catch (error) {
      els.support.textContent = "Não consegui iniciar o microfone: " + error.message;
      return false;
    }
  }

  function handleRecognized(transcript) {
    const match = findWakeWord(transcript);
    if (!state.waitingForCommand) {
      if (!match.found) return;
      touch();
      const tail = transcript.slice(Math.max(0, transcript.toLocaleLowerCase("pt-BR").indexOf("aeternus") + 8)).trim();
      if (tail.length > 1) {
        const command = tail.replace(/^[,.:;\s]+/, "");
        addMessage("user", command);
        void askAI(command);
      } else {
        state.waitingForCommand = true;
        setStatus("Pode falar, estou ouvindo.", "active");
        speak("Estou ouvindo.", false);
      }
      return;
    }

    state.waitingForCommand = false;
    touch();
    const command = transcript.trim();
    if (!command) return;
    if (normalize(command).includes("parar de ouvir") || normalize(command) === "parar voz") {
      stopAssistant("Você pediu para parar a escuta.");
      return;
    }
    addMessage("user", command);
    void askAI(command);
  }

  function speak(text, shouldTouch = true) {
    if (!("speechSynthesis" in window) || !text) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "pt-BR";
    utterance.rate = 1;
    utterance.pitch = 1;
    utterance.onstart = () => {
      state.speaking = true;
      setStatus("Falando…", "speaking");
    };
    utterance.onend = () => {
      state.speaking = false;
      if (shouldTouch) touch();
      if (state.listening && !state.manualStop) setStatus("Esperando “Aeternus”…", "active");
    };
    utterance.onerror = () => {
      state.speaking = false;
      if (state.listening && !state.manualStop) setStatus("Esperando “Aeternus”…", "active");
    };
    window.speechSynthesis.speak(utterance);
  }

  function providerConfig() {
    return {
      provider: state.provider,
      key: state.key.trim(),
      model: state.model
    };
  }

  async function requestAI(userText) {
    const cfg = providerConfig();
    if (!cfg.key) {
      return "Ainda preciso de uma chave de API. Abra ⚙ Configurações e adicione sua chave do provedor escolhido. Os planos gratuitos têm limites.";
    }

    const history = state.conversation
      .filter(item => item.role === "user" || item.role === "assistant")
      .slice(-12)
      .map(item => ({ role: item.role, content: item.content }));

    if (cfg.provider === "gemini") {
      const contents = history.map(item => ({
        role: item.role === "assistant" ? "model" : "user",
        parts: [{ text: item.content }]
      }));
      const response = await fetch(
        "https://generativelanguage.googleapis.com/v1beta/models/" + encodeURIComponent(cfg.model) + ":generateContent?key=" + encodeURIComponent(cfg.key),
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            systemInstruction: { parts: [{ text: "Seu nome é Aeternus. Você é uma assistente pessoal amigável e útil. Responda em português brasileiro, de forma natural e concisa. Não diga que fez ações que não executou." }] },
            contents,
            generationConfig: { temperature: 0.7, maxOutputTokens: 800 }
          })
        }
      );
      const data = await response.json();
      if (!response.ok) throw new Error(data?.error?.message || "Erro HTTP " + response.status);
      return data?.candidates?.[0]?.content?.parts?.map(part => part.text || "").join("").trim() || "Não recebi uma resposta de texto do modelo.";
    }

    const base = cfg.provider === "groq" ? "https://api.groq.com/openai/v1" : "https://openrouter.ai/api/v1";
    const headers = { "Content-Type": "application/json", "Authorization": "Bearer " + cfg.key };
    if (cfg.provider === "openrouter") headers["HTTP-Referer"] = location.origin;
    const messages = [
      { role: "system", content: "Seu nome é Aeternus. Você é uma assistente pessoal amigável e útil. Responda em português brasileiro, de forma natural e concisa. Não diga que fez ações que não executou." },
      ...history
    ];
    const response = await fetch(base + "/chat/completions", {
      method: "POST",
      headers,
      body: JSON.stringify({ model: cfg.model, messages, temperature: 0.7, max_tokens: 800 })
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data?.error?.message || "Erro HTTP " + response.status);
    return data?.choices?.[0]?.message?.content?.trim() || "Não recebi uma resposta de texto do modelo.";
  }

  async function askAI(text) {
    touch();
    setStatus("Pensando…", "warning");
    try {
      const answer = await requestAI(text);
      addMessage("assistant", answer);
      if (state.autoSpeak) speak(answer);
      else if (state.listening) setStatus("Esperando “Aeternus”…", "active");
    } catch (error) {
      const message = "Não consegui acessar a IA: " + error.message;
      addMessage("assistant", message);
      if (state.autoSpeak) speak(message);
      setStatus("Erro na conexão", "warning");
    } finally {
      touch();
    }
  }

  function populateModels(keepCurrent = true) {
    const provider = els.provider.value;
    const previous = keepCurrent ? els.model.value : "";
    els.model.replaceChildren();
    for (const [value, label] of MODELS[provider]) {
      const option = document.createElement("option");
      option.value = value;
      option.textContent = label;
      els.model.appendChild(option);
    }
    if (previous && MODELS[provider].some(item => item[0] === previous)) els.model.value = previous;
    else els.model.value = MODELS[provider][0][0];
  }

  function loadSettings() {
    try {
      const settings = JSON.parse(localStorage.getItem("aeternus.settings") || "{}");
      if (settings.provider && MODELS[settings.provider]) els.provider.value = settings.provider;
      populateModels(false);
      if (settings.model && MODELS[els.provider.value].some(item => item[0] === settings.model)) els.model.value = settings.model;
      els.autoSpeak.checked = settings.autoSpeak !== false;
      if (settings.saveKey === true && typeof settings.key === "string") {
        els.key.value = settings.key;
        els.saveKey.checked = true;
      }
    } catch {}
    state.provider = els.provider.value;
    state.model = els.model.value;
    state.key = els.key.value;
    state.autoSpeak = els.autoSpeak.checked;
  }

  function saveSettings() {
    state.provider = els.provider.value;
    state.model = els.model.value;
    state.key = els.key.value.trim();
    state.autoSpeak = els.autoSpeak.checked;
    const settings = {
      provider: state.provider,
      model: state.model,
      autoSpeak: state.autoSpeak,
      saveKey: els.saveKey.checked
    };
    if (els.saveKey.checked) settings.key = state.key;
    try {
      if (els.saveKey.checked) localStorage.setItem("aeternus.settings", JSON.stringify(settings));
      else {
        localStorage.setItem("aeternus.settings", JSON.stringify(settings));
      }
      els.settings.hidden = true;
      els.settingsToggle.setAttribute("aria-expanded", "false");
      els.support.textContent = "Configurações salvas neste navegador.";
    } catch {
      els.support.textContent = "Não foi possível salvar as configurações no navegador.";
    }
  }

  els.start.addEventListener("click", () => {
    touch();
    state.manualStop = false;
    if (startRecognition()) {
      setStatus("Esperando “Aeternus”…", "active");
      els.support.textContent = "A escuta fica ativa nesta página. Diga “Aeternus” para chamar.";
    }
  });

  els.stop.addEventListener("click", () => stopAssistant("Escuta parada. Toque em Ativar voz para recomeçar."));
  els.settingsToggle.addEventListener("click", () => {
    els.settings.hidden = !els.settings.hidden;
    els.settingsToggle.setAttribute("aria-expanded", String(!els.settings.hidden));
  });
  els.settingsClose.addEventListener("click", () => {
    els.settings.hidden = true;
    els.settingsToggle.setAttribute("aria-expanded", "false");
  });
  els.provider.addEventListener("change", () => populateModels(false));
  els.saveSettings.addEventListener("click", saveSettings);
  els.clear.addEventListener("click", () => {
    els.messages.replaceChildren();
    els.empty.hidden = false;
    els.messages.appendChild(els.empty);
    state.conversation = [];
  });

  els.form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const text = els.input.value.trim();
    if (!text) return;
    els.input.value = "";
    addMessage("user", text);
    touch();
    await askAI(text);
  });

  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible" && state.listening && !state.manualStop) touch();
  });
  window.addEventListener("beforeunload", () => {
    clearTimeout(state.idleTimer);
    clearTimeout(state.restartTimer);
    if (state.recognition) try { state.recognition.stop(); } catch {}
  });

  populateModels(false);
  loadSettings();
  setStatus("Pronta para iniciar");
})();
