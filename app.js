const STORAGE_KEYS = {
  settings: "memoflow-ai-settings",
  history: "memoflow-ai-history",
  profile: "memoflow-ai-profile",
  notes: "memoflow-ai-notes",
  moments: "memoflow-ai-moments",
  experiments: "memoflow-ai-experiments"
};

const defaultAvatar =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 96 96'%3E%3Crect width='96' height='96' rx='28' fill='%2315171b'/%3E%3Ccircle cx='48' cy='35' r='16' fill='%23fff' fill-opacity='.92'/%3E%3Cpath d='M20 82c4-18 17-28 28-28s24 10 28 28' fill='%23fff' fill-opacity='.92'/%3E%3C/svg%3E";

const state = {
  mode: "dashboard",
  activeHistoryId: null,
  activeExperimentId: null,
  editingTodoId: null,
  editingNoteId: null,
  selectedNoteTag: "",
  pendingExperimentImage: "",
  history: [],
  notes: [],
  moments: [],
  experiments: [],
  profile: {
    name: "",
    role: "",
    email: "",
    note: "",
    avatar: defaultAvatar
  },
  settings: {
    provider: "proxy",
    apiKey: "",
    model: "gpt-4.1-mini",
    endpoint: "/api/chat"
  }
};

const modeConfig = {
  dashboard: {
    title: "Dashboard",
    stat: "首页",
    eyebrow: "Overview"
  },
  todo: {
    title: "TODOlist",
    stat: "TODO",
    eyebrow: "Structured Output",
    prompt: "请把用户输入整理成 TODOlist。只输出表格式纯文本，每行一个事项，格式为：日期 时间 事件。不要输出标题、解释、下一步、建议或空行。日期或时间不明确时写未定。"
  },
  note: {
    title: "随时笔记",
    stat: "笔记",
    eyebrow: "Quick Notes"
  },
  moment: {
    title: "朋友圈",
    stat: "动态",
    eyebrow: "Moments"
  },
  experiment: {
    title: "实验记录",
    stat: "实验",
    eyebrow: "Lab Log"
  }
};

const dashboardView = document.querySelector("#dashboardView");
const dashboardPanel = document.querySelector("#dashboardPanel");
const dashboardAiSummary = document.querySelector("#dashboardAiSummary");
const dashboardReport = document.querySelector("#dashboardReport");
const generateTodayButton = document.querySelector("#generateTodayButton");
const generateWeekButton = document.querySelector("#generateWeekButton");
const messages = document.querySelector("#messages");
const chatView = document.querySelector("#chatView");
const noteView = document.querySelector("#noteView");
const momentFeedView = document.querySelector("#momentFeedView");
const experimentView = document.querySelector("#experimentView");
const globalSearchInput = document.querySelector("#globalSearchInput");
const clearSearchButton = document.querySelector("#clearSearchButton");
const searchResults = document.querySelector("#searchResults");
const chatForm = document.querySelector("#chatForm");
const userInput = document.querySelector("#userInput");
const noteInput = document.querySelector("#noteInput");
const noteTagList = document.querySelector("#noteTagList");
const momentInput = document.querySelector("#momentInput");
const momentImageInput = document.querySelector("#momentImageInput");
const experimentTitleInput = document.querySelector("#experimentTitleInput");
const experimentStepInput = document.querySelector("#experimentStepInput");
const experimentImageInput = document.querySelector("#experimentImageInput");
const experimentImageUrlInput = document.querySelector("#experimentImageUrlInput");
const experimentImagePreview = document.querySelector("#experimentImagePreview");
const experimentStatus = document.querySelector("#experimentStatus");
const noteEditStatus = document.querySelector("#noteEditStatus");
const newNoteButton = document.querySelector("#newNoteButton");
const saveNoteButton = document.querySelector("#saveNoteButton");
const noteToTodoButton = document.querySelector("#noteToTodoButton");
const clearMomentButton = document.querySelector("#clearMomentButton");
const publishMomentButton = document.querySelector("#publishMomentButton");
const newExperimentButton = document.querySelector("#newExperimentButton");
const exportExperimentButton = document.querySelector("#exportExperimentButton");
const addExperimentStepButton = document.querySelector("#addExperimentStepButton");
const resultOutput = document.querySelector("#resultOutput");
const todoSummaryList = document.querySelector("#todoSummaryList");
const noteList = document.querySelector("#noteList");
const momentComposer = document.querySelector("#momentComposer");
const experimentList = document.querySelector("#experimentList");
const momentFeedList = document.querySelector("#momentFeedList");
const resultTitle = document.querySelector("#resultTitle");
const resultEyebrow = document.querySelector("#resultEyebrow");
const statItems = document.querySelector("#statItems");
const statItemsLabel = document.querySelector("#statItemsLabel");
const statMode = document.querySelector("#statMode");
const submitButton = document.querySelector("#submitButton");
const clearButton = document.querySelector("#clearButton");
const copyButton = document.querySelector("#copyButton");
const clearHistoryButton = document.querySelector("#clearHistoryButton");
const historyPanel = document.querySelector("#historyPanel");
const historyList = document.querySelector("#historyList");
const profileButton = document.querySelector("#profileButton");
const profileAvatarPreview = document.querySelector("#profileAvatarPreview");
const profileNamePreview = document.querySelector("#profileNamePreview");
const profileModal = document.querySelector("#profileModal");
const profileModalAvatar = document.querySelector("#profileModalAvatar");
const avatarFileInput = document.querySelector("#avatarFileInput");
const avatarUrlInput = document.querySelector("#avatarUrlInput");
const profileNameInput = document.querySelector("#profileNameInput");
const profileRoleInput = document.querySelector("#profileRoleInput");
const profileEmailInput = document.querySelector("#profileEmailInput");
const profileNoteInput = document.querySelector("#profileNoteInput");
const saveProfileButton = document.querySelector("#saveProfileButton");
const showProfileButton = document.querySelector("#showProfileButton");
const settingsButton = document.querySelector("#settingsButton");
const settingsModal = document.querySelector("#settingsModal");
const providerSelect = document.querySelector("#providerSelect");
const apiKeyInput = document.querySelector("#apiKeyInput");
const modelInput = document.querySelector("#modelInput");
const endpointInput = document.querySelector("#endpointInput");
const saveSettingsButton = document.querySelector("#saveSettingsButton");
const demoButton = document.querySelector("#demoButton");

loadSettings();
loadHistory();
loadNotes();
loadMoments();
loadExperiments();
loadProfile();
bindEvents();
renderProfile();
renderNoteTags();
setMode(state.mode, { restoreLatest: true });
refreshOpeningMessage();

function bindEvents() {
  document.querySelectorAll(".mode-pill").forEach((button) => {
    button.addEventListener("click", () => setMode(button.dataset.mode, { restoreLatest: true }));
  });

  window.addEventListener("resize", () => {
    const activeButton = document.querySelector(".mode-pill.active");
    if (activeButton) moveModeIndicator(activeButton);
  });

  generateTodayButton.addEventListener("click", () => generateReview("today"));
  generateWeekButton.addEventListener("click", () => generateReview("week"));

  globalSearchInput.addEventListener("input", renderGlobalSearch);
  clearSearchButton.addEventListener("click", () => {
    globalSearchInput.value = "";
    renderGlobalSearch();
    globalSearchInput.focus();
  });

  newExperimentButton.addEventListener("click", startNewExperiment);
  addExperimentStepButton.addEventListener("click", saveExperimentStep);
  exportExperimentButton.addEventListener("click", exportActiveExperiment);
  experimentImageInput.addEventListener("change", handleExperimentImageFile);
  experimentImageUrlInput.addEventListener("input", () => {
    state.pendingExperimentImage = experimentImageUrlInput.value.trim();
    renderExperimentImagePreview();
  });
  experimentStepInput.addEventListener("paste", handleExperimentPaste);
  experimentTitleInput.addEventListener("input", updateActiveExperimentTitle);

  chatForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const text = userInput.value.trim();
    if (!text) return;

    addMessage("user", text);
    userInput.value = "";
    setBusy(true);

    try {
      const commandResult = handleTodoCommand(text);
      if (commandResult) {
        addMessage("ai", commandResult);
        updateResult(commandResult);
        return;
      }

      const summary = canUseConfiguredAi()
        ? await requestAiSummary(text)
        : createDemoSummary(text);
      const cleanSummary = normalizeOutput(summary);
      const record = saveRecord(text, cleanSummary);
      addMessage("ai", withHumanReply(cleanSummary));
      showRecord(record);
    } catch (error) {
      const fallback = normalizeOutput(`接口请求失败：${error.message}\n你也可以先点击“API 设置”，检查密钥、模型和接口地址。`);
      addMessage("ai", fallback);
      updateResult(fallback);
    } finally {
      setBusy(false);
    }
  });

  clearButton.addEventListener("click", () => {
    state.editingTodoId = null;
    userInput.value = "";
    submitButton.textContent = "开始整理";
    clearButton.textContent = "清空输入";
    userInput.focus();
  });

  clearHistoryButton.addEventListener("click", () => {
    if (!state.history.length) return;
    const ok = window.confirm("确定清空所有 TODOlist 记录吗？这一步不能撤销。");
    if (!ok) return;
    state.history = [];
    state.activeHistoryId = null;
    state.editingTodoId = null;
    persistHistory();
    renderHistory();
    renderTodoSummary();
    updateResult("等待你的输入。");
  });

  copyButton.addEventListener("click", async () => {
    const text = state.mode === "note"
      ? getActiveNoteText()
      : state.mode === "todo"
        ? getSortedTodos().map((record) => {
          const parsed = parseTodoRecord(record);
          return `${record.completed ? "[完成]" : "[未完成]"} ${parsed.date} ${parsed.time} ${parsed.event}`;
        }).join("\n")
        : resultOutput.textContent;
    await navigator.clipboard.writeText(text);
    copyButton.textContent = "已复制";
    setTimeout(() => {
      copyButton.textContent = "复制";
    }, 1200);
  });

  newNoteButton.addEventListener("click", () => startNewNote());
  saveNoteButton.addEventListener("click", saveCurrentNote);
  noteToTodoButton.addEventListener("click", convertCurrentNoteToTodo);
  noteTagList.addEventListener("click", (event) => {
    const button = event.target.closest(".tag-chip");
    if (!button) return;
    const tag = button.dataset.tag;
    state.selectedNoteTag = state.selectedNoteTag === tag ? "" : tag;
    renderNoteTags();
  });
  clearMomentButton.addEventListener("click", () => {
    momentInput.value = "";
    momentImageInput.value = "";
    momentInput.focus();
  });
  publishMomentButton.addEventListener("click", publishMoment);

  profileButton.addEventListener("click", openProfileModal);
  showProfileButton.addEventListener("click", showProfileInfo);

  avatarUrlInput.addEventListener("input", () => {
    const url = avatarUrlInput.value.trim();
    if (url) profileModalAvatar.src = url;
  });

  avatarFileInput.addEventListener("change", () => {
    const file = avatarFileInput.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.addEventListener("load", () => {
      profileModalAvatar.src = reader.result;
      avatarUrlInput.value = "";
    });
    reader.readAsDataURL(file);
  });

  saveProfileButton.addEventListener("click", () => {
    state.profile = {
      name: profileNameInput.value.trim(),
      role: profileRoleInput.value.trim(),
      email: profileEmailInput.value.trim(),
      note: profileNoteInput.value.trim(),
      avatar: profileModalAvatar.src || defaultAvatar
    };
    persistProfile();
    renderProfile();
  });

  settingsButton.addEventListener("click", () => {
    providerSelect.value = state.settings.provider;
    apiKeyInput.value = state.settings.apiKey;
    modelInput.value = state.settings.model;
    endpointInput.value = state.settings.endpoint;
    settingsModal.showModal();
  });

  providerSelect.addEventListener("change", () => {
    const provider = providerSelect.value;
    if (provider === "proxy") {
      modelInput.value = "gpt-4.1-mini";
      endpointInput.value = "/api/chat";
    }
    if (provider === "openai") {
      modelInput.value = "gpt-4.1-mini";
      endpointInput.value = "https://api.openai.com/v1/chat/completions";
    }
    if (provider === "deepseek") {
      modelInput.value = "deepseek-chat";
      endpointInput.value = "https://api.deepseek.com/chat/completions";
    }
  });

  saveSettingsButton.addEventListener("click", () => {
    state.settings = {
      provider: providerSelect.value,
      apiKey: apiKeyInput.value.trim(),
      model: modelInput.value.trim(),
      endpoint: endpointInput.value.trim()
    };
    localStorage.setItem(STORAGE_KEYS.settings, JSON.stringify(state.settings));
  });

  demoButton.addEventListener("click", () => {
    apiKeyInput.value = "";
    state.settings.apiKey = "";
    localStorage.setItem(STORAGE_KEYS.settings, JSON.stringify(state.settings));
    settingsModal.close();
  });
}

function setMode(mode, options = {}) {
  state.mode = mode;
  const config = modeConfig[mode];
  resultTitle.textContent = config.title;
  resultEyebrow.textContent = config.eyebrow;
  statMode.textContent = config.stat;

  document.querySelectorAll(".mode-pill").forEach((button) => {
    const isActive = button.dataset.mode === mode;
    button.classList.toggle("active", isActive);
    if (isActive) moveModeIndicator(button);
  });

  const isDashboard = mode === "dashboard";
  const isTodo = mode === "todo";
  const isNote = mode === "note";
  const isMoment = mode === "moment";
  const isExperiment = mode === "experiment";

  dashboardView.classList.toggle("hidden", !isDashboard);
  chatView.classList.toggle("hidden", !isTodo);
  noteView.classList.toggle("hidden", !isNote);
  momentFeedView.classList.toggle("hidden", !isMoment);
  experimentView.classList.toggle("hidden", !isExperiment);

  dashboardPanel.classList.toggle("hidden", !isDashboard);
  resultOutput.classList.toggle("hidden", isDashboard || isTodo || isNote || isMoment || isExperiment);
  todoSummaryList.classList.toggle("hidden", !isTodo);
  noteList.classList.toggle("hidden", !isNote);
  experimentList.classList.toggle("hidden", !isExperiment);
  momentComposer.classList.toggle("hidden", !isMoment);
  historyPanel.classList.toggle("hidden", isDashboard || isNote || isMoment || isExperiment);
  copyButton.classList.toggle("hidden", isDashboard || (isNote && !state.editingNoteId) || isMoment || isExperiment);

  statItemsLabel.textContent = isDashboard ? "项概览" : isNote ? "条笔记" : isMoment ? "条动态" : isExperiment ? "条步骤" : "条结果";

  if (isDashboard) {
    renderDashboard();
    return;
  }
  if (isNote) {
    renderNotes();
    return;
  }
  if (isMoment) {
    renderMoments();
    return;
  }
  if (isExperiment) {
    renderExperiments();
    return;
  }

  renderHistory();
  renderTodoSummary();
}

function moveModeIndicator(activeButton) {
  const strip = activeButton.closest(".mode-strip");
  const indicator = strip.querySelector(".mode-indicator");
  indicator.style.width = `${activeButton.offsetWidth}px`;
  indicator.style.transform = `translateX(${activeButton.offsetLeft - 6}px)`;
}

function addMessage(role, content) {
  const message = document.createElement("div");
  message.className = `message ${role}`;

  const avatar = role === "ai" ? document.createElement("span") : document.createElement("img");
  avatar.className = role === "ai" ? "avatar ai-avatar" : "avatar user-avatar";
  if (role === "ai") {
    avatar.textContent = "AI";
  } else {
    avatar.src = state.profile.avatar;
    avatar.alt = "";
  }

  const bubble = document.createElement("div");
  bubble.className = "bubble";
  bubble.textContent = content;

  message.append(avatar, bubble);
  messages.append(message);
  messages.scrollTo({ top: messages.scrollHeight, behavior: "smooth" });
}

function refreshOpeningMessage() {
  const opening = document.querySelector(".message.ai .bubble");
  if (!opening) return;
  opening.textContent = pickOne([
    "想做什么、什么时候做，直接写给我。也可以说“删除开会”或“把开会改成 6.3 20:00 复盘”。",
    "把待办随手丢进来就行。最好写成“日期 时间 事件”，之后也能用一句话删除或修改。",
    "我会帮你压成清楚的 TODOlist。你可以写：“周五 上午 给客户发报价”。",
    "不用写得很正式，能看出时间和事情就行。要改动时直接说“删除…”或“把…改成…”。"
  ]);
}

async function requestAiSummary(text) {
  const config = modeConfig.todo;
  const usingProxy = state.settings.provider === "proxy" || state.settings.endpoint.startsWith("/");
  const headers = {
    "Content-Type": "application/json"
  };

  if (!usingProxy) {
    headers.Authorization = `Bearer ${state.settings.apiKey}`;
  }

  const response = await fetch(state.settings.endpoint, {
    method: "POST",
    headers,
    body: JSON.stringify({
      model: state.settings.model,
      messages: [
        {
          role: "system",
          content: `${config.prompt}\n示例：06/02 晚上 参加会议\n如果有多个事项，每行一个。只要日期、时间、事件三列，不要编号。\n用户个人信息：${getProfileText()}`
        },
        {
          role: "user",
          content: text
        }
      ],
      temperature: 0.2
    })
  });

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(detail || `HTTP ${response.status}`);
  }

  const data = await response.json();
  return data.choices?.[0]?.message?.content?.trim() || "没有收到有效回复。";
}

function createDemoSummary(text) {
  const fragments = text
    .split(/[，。；;,\n]/)
    .map((item) => item.trim())
    .filter(Boolean);
  const list = fragments.length ? fragments : [text];
  const now = new Date();

  return list.map((item) => {
    return `${inferDateText(item, now)} ${inferTimeText(item)} ${item}`;
  }).join("\n");
}

function saveCurrentNote() {
  const content = noteInput.value.trim();
  if (!content) {
    noteInput.focus();
    return;
  }

  const now = new Date().toISOString();
  if (state.editingNoteId) {
    const note = state.notes.find((item) => item.id === state.editingNoteId);
    if (note) {
      note.content = content;
      note.category = state.selectedNoteTag;
      note.updatedAt = now;
    }
  } else {
    state.editingNoteId = createId();
    state.notes.unshift({
      id: state.editingNoteId,
      content,
      category: state.selectedNoteTag,
      createdAt: now,
      updatedAt: now
    });
  }

  persistNotes();
  renderNotes();
  startNewNote("已保存，继续写下一条");
}

function renderNotes() {
  noteList.innerHTML = "";
  statItems.textContent = String(state.notes.length);
  copyButton.classList.toggle("hidden", !state.editingNoteId);

  if (!state.notes.length) {
    noteList.innerHTML = '<p class="empty-history">还没有笔记。</p>';
    return;
  }

  state.notes.forEach((note) => {
    const button = document.createElement("button");
    button.className = "note-item";
    button.type = "button";
    button.classList.toggle("active", note.id === state.editingNoteId);
    button.innerHTML = `
      <div>
        <small class="note-category"></small>
        <strong></strong>
        <span>${formatDate(note.updatedAt)} · ${formatClock(note.updatedAt)}</span>
      </div>
      <em class="delete-action" aria-label="删除笔记">删除</em>
    `;
    const category = button.querySelector(".note-category");
    category.textContent = note.category || "未分类";
    category.classList.toggle("empty", !note.category);
    button.querySelector("strong").textContent = getNoteTitle(note.content);
    button.querySelector(".delete-action").addEventListener("click", (event) => {
      event.stopPropagation();
      deleteNote(note.id);
    });
    button.addEventListener("click", () => editNote(note.id));
    noteList.append(button);
  });
}

function deleteNote(id) {
  state.notes = state.notes.filter((note) => note.id !== id);
  if (state.editingNoteId === id) {
    state.editingNoteId = null;
    state.selectedNoteTag = "";
    noteInput.value = "";
    showNoteStatus("新笔记");
    renderNoteTags();
  }
  persistNotes();
  renderNotes();
}

function editNote(id) {
  const note = state.notes.find((item) => item.id === id);
  if (!note) return;

  state.editingNoteId = id;
  state.selectedNoteTag = note.category || "";
  noteInput.value = note.content;
  showNoteStatus("正在编辑已有笔记");
  renderNoteTags();
  renderNotes();
  noteInput.focus();
}

function startNewNote(status = "新笔记") {
  state.editingNoteId = null;
  state.selectedNoteTag = "";
  noteInput.value = "";
  showNoteStatus(status);
  renderNoteTags();
  renderNotes();
  noteInput.focus();
}

function showNoteStatus(text) {
  noteEditStatus.textContent = text;
}

function renderNoteTags() {
  noteTagList.querySelectorAll(".tag-chip").forEach((button) => {
    button.classList.toggle("selected", button.dataset.tag === state.selectedNoteTag);
  });
}

function getActiveNoteText() {
  if (!state.editingNoteId) return "";
  const note = state.notes.find((item) => item.id === state.editingNoteId);
  return note?.content || "";
}

function getNoteTitle(content) {
  const firstLine = content.split(/\r?\n/).find((line) => line.trim())?.trim() || "未命名笔记";
  return firstLine;
}

function withHumanReply(summary) {
  return `${pickOne([
    "整理好了：",
    "好，我给你收成这样：",
    "收到，这条可以这样记：",
    "可以，先放进 TODOlist："
  ])}\n${summary}`;
}

function pickOne(items) {
  return items[Math.floor(Math.random() * items.length)];
}

function getTodoEventTitle(output, input) {
  const firstLine = output.split(/\r?\n/).find((line) => line.trim())?.trim();
  if (!firstLine) return input.slice(0, 18) || "未命名记录";
  const parts = firstLine.split(/\s+/);
  return parts.length >= 3 ? parts.slice(2).join(" ").slice(0, 18) : firstLine.slice(0, 18);
}

function publishMoment() {
  const content = momentInput.value.trim();
  const image = momentImageInput.value.trim();
  if (!content && !image) {
    momentInput.focus();
    return;
  }

  state.moments.unshift({
    id: createId(),
    content,
    image,
    createdAt: new Date().toISOString()
  });
  momentInput.value = "";
  momentImageInput.value = "";
  persistMoments();
  renderMoments();
}

function renderMoments() {
  momentFeedList.innerHTML = "";
  statItems.textContent = String(state.moments.length);

  if (!state.moments.length) {
    momentFeedList.innerHTML = '<p class="empty-history">还没有动态。</p>';
    return;
  }

  state.moments.forEach((moment) => {
    const item = document.createElement("article");
    item.className = "moment-item";

    const avatar = document.createElement("img");
    avatar.className = "moment-avatar";
    avatar.src = state.profile.avatar || defaultAvatar;
    avatar.alt = "";

    const body = document.createElement("div");
    body.className = "moment-body";
    body.innerHTML = `
      <div class="moment-meta">
        <strong></strong>
        <span>${formatDate(moment.createdAt)} · ${formatClock(moment.createdAt)}</span>
      </div>
      <p></p>
    `;
    body.querySelector("strong").textContent = state.profile.name || "我";
    body.querySelector("p").textContent = moment.content || "图片动态";

    if (moment.image) {
      const image = document.createElement("img");
      image.className = "moment-image";
      image.src = moment.image;
      image.alt = "";
      body.append(image);
    }

    const actions = document.createElement("div");
    actions.className = "moment-actions";
    actions.innerHTML = '<button class="text-button" type="button">删除</button>';
    actions.querySelector("button").addEventListener("click", () => deleteMoment(moment.id));
    body.append(actions);

    item.append(avatar, body);
    momentFeedList.append(item);
  });
}

function deleteMoment(id) {
  state.moments = state.moments.filter((moment) => moment.id !== id);
  persistMoments();
  renderMoments();
}

function startNewExperiment() {
  const experiment = {
    id: createId(),
    title: experimentTitleInput.value.trim() || `实验记录 ${formatDate(new Date())}`,
    entries: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  state.experiments.unshift(experiment);
  state.activeExperimentId = experiment.id;
  experimentTitleInput.value = experiment.title;
  experimentStepInput.value = "";
  experimentImageInput.value = "";
  experimentImageUrlInput.value = "";
  state.pendingExperimentImage = "";
  renderExperimentImagePreview();
  persistExperiments();
  renderExperiments();
  showExperimentStatus("新实验已创建");
  experimentStepInput.focus();
}

function saveExperimentStep() {
  const text = experimentStepInput.value.trim();
  const image = state.pendingExperimentImage || experimentImageUrlInput.value.trim();
  if (!text && !image) {
    experimentStepInput.focus();
    return;
  }

  const experiment = ensureActiveExperiment();
  experiment.title = experimentTitleInput.value.trim() || experiment.title;
  experiment.entries.push({
    id: createId(),
    text,
    image,
    createdAt: new Date().toISOString()
  });
  experiment.updatedAt = new Date().toISOString();
  experimentStepInput.value = "";
  experimentImageInput.value = "";
  experimentImageUrlInput.value = "";
  state.pendingExperimentImage = "";
  renderExperimentImagePreview();
  persistExperiments();
  renderExperiments();
  showExperimentStatus("已添加步骤");
  experimentStepInput.focus();
}

function ensureActiveExperiment() {
  let experiment = getActiveExperiment();
  if (experiment) return experiment;
  experiment = {
    id: createId(),
    title: experimentTitleInput.value.trim() || `实验记录 ${formatDate(new Date())}`,
    entries: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  state.experiments.unshift(experiment);
  state.activeExperimentId = experiment.id;
  return experiment;
}

function getActiveExperiment() {
  if (!state.activeExperimentId && state.experiments.length) {
    state.activeExperimentId = state.experiments[0].id;
  }
  return state.experiments.find((experiment) => experiment.id === state.activeExperimentId) || null;
}

function renderExperiments() {
  const experiment = getActiveExperiment();
  const entryCount = state.experiments.reduce((sum, item) => sum + item.entries.length, 0);
  statItems.textContent = String(entryCount);
  experimentList.innerHTML = "";

  if (!experiment) {
    experimentTitleInput.value = "";
    experimentList.innerHTML = '<p class="empty-history">还没有实验记录。先写标题，再添加第一步。</p>';
    return;
  }

  if (document.activeElement !== experimentTitleInput) {
    experimentTitleInput.value = experiment.title;
  }

  const switcher = document.createElement("div");
  switcher.className = "experiment-switcher";
  state.experiments.forEach((item) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "experiment-tab";
    button.classList.toggle("active", item.id === experiment.id);
    button.innerHTML = `<strong></strong><span>${item.entries.length} 步 · ${formatDate(item.updatedAt)}</span>`;
    button.querySelector("strong").textContent = item.title;
    button.addEventListener("click", () => selectExperiment(item.id));
    switcher.append(button);
  });
  experimentList.append(switcher);

  const header = document.createElement("section");
  header.className = "experiment-current";
  header.innerHTML = `
    <div>
      <p class="eyebrow">Current Experiment</p>
      <h3></h3>
      <span>${formatDate(experiment.updatedAt)} · ${formatClock(experiment.updatedAt)}</span>
    </div>
    <button class="text-button" type="button">删除实验</button>
  `;
  header.querySelector("h3").textContent = experiment.title;
  header.querySelector("button").addEventListener("click", () => deleteExperiment(experiment.id));
  experimentList.append(header);

  const timeline = document.createElement("div");
  timeline.className = "experiment-timeline";
  if (!experiment.entries.length) {
    timeline.innerHTML = '<p class="empty-history">这项实验还没有步骤。</p>';
  } else {
    experiment.entries.forEach((entry, index) => {
      const card = document.createElement("article");
      card.className = "experiment-entry";
      card.innerHTML = `
        <div class="experiment-entry-head">
          <strong>步骤 ${index + 1}</strong>
          <span>${formatDate(entry.createdAt)} · ${formatClock(entry.createdAt)}</span>
        </div>
        <p></p>
        <div class="experiment-entry-actions">
          <button class="text-button" type="button">删除</button>
        </div>
      `;
      card.querySelector("p").textContent = entry.text || "仅截图记录";
      if (entry.image) {
        const image = document.createElement("img");
        image.className = "experiment-entry-image";
        image.src = entry.image;
        image.alt = "实验截图";
        card.insertBefore(image, card.querySelector(".experiment-entry-actions"));
      }
      card.querySelector("button").addEventListener("click", () => deleteExperimentEntry(experiment.id, entry.id));
      timeline.append(card);
    });
  }
  experimentList.append(timeline);
}

function selectExperiment(id) {
  state.activeExperimentId = id;
  const experiment = getActiveExperiment();
  if (experiment) experimentTitleInput.value = experiment.title;
  experimentStepInput.value = "";
  experimentImageInput.value = "";
  experimentImageUrlInput.value = "";
  state.pendingExperimentImage = "";
  renderExperimentImagePreview();
  renderExperiments();
}

function updateActiveExperimentTitle() {
  const experiment = getActiveExperiment();
  if (!experiment) return;
  experiment.title = experimentTitleInput.value.trim() || experiment.title;
  experiment.updatedAt = new Date().toISOString();
  persistExperiments();
  renderExperiments();
}

function deleteExperimentEntry(experimentId, entryId) {
  const experiment = state.experiments.find((item) => item.id === experimentId);
  if (!experiment) return;
  experiment.entries = experiment.entries.filter((entry) => entry.id !== entryId);
  experiment.updatedAt = new Date().toISOString();
  persistExperiments();
  renderExperiments();
}

function deleteExperiment(id) {
  const experiment = state.experiments.find((item) => item.id === id);
  if (!experiment) return;
  const ok = window.confirm(`确定删除实验“${experiment.title}”吗？`);
  if (!ok) return;
  state.experiments = state.experiments.filter((item) => item.id !== id);
  state.activeExperimentId = state.experiments[0]?.id || null;
  persistExperiments();
  renderExperiments();
}

function handleExperimentImageFile() {
  const file = experimentImageInput.files?.[0];
  if (!file) return;
  const reader = new FileReader();
  reader.addEventListener("load", () => {
    state.pendingExperimentImage = String(reader.result || "");
    experimentImageUrlInput.value = "";
    renderExperimentImagePreview();
    showExperimentStatus("截图已载入");
  });
  reader.readAsDataURL(file);
}

function handleExperimentPaste(event) {
  const item = Array.from(event.clipboardData?.items || []).find((clipboardItem) => clipboardItem.type.startsWith("image/"));
  if (!item) return;
  const file = item.getAsFile();
  if (!file) return;
  const reader = new FileReader();
  reader.addEventListener("load", () => {
    state.pendingExperimentImage = String(reader.result || "");
    experimentImageUrlInput.value = "";
    renderExperimentImagePreview();
    showExperimentStatus("已粘贴截图");
  });
  reader.readAsDataURL(file);
}

function renderExperimentImagePreview() {
  const image = state.pendingExperimentImage || experimentImageUrlInput.value.trim();
  experimentImagePreview.classList.toggle("hidden", !image);
  experimentImagePreview.innerHTML = image ? `<img src="${escapeAttribute(image)}" alt="待保存截图" />` : "";
}

function showExperimentStatus(text) {
  experimentStatus.textContent = text;
}

function exportActiveExperiment() {
  const experiment = getActiveExperiment();
  if (!experiment) return;
  const html = buildExperimentExport(experiment);
  const blob = new Blob([html], { type: "text/html;charset=utf-8" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = `${safeFileName(experiment.title)}.html`;
  link.click();
  setTimeout(() => URL.revokeObjectURL(link.href), 0);
  showExperimentStatus("已导出文件");
}

function buildExperimentExport(experiment) {
  const entries = experiment.entries.map((entry, index) => `
    <article class="entry">
      <h2>步骤 ${index + 1}</h2>
      <time>${escapeHtml(formatDate(entry.createdAt))} ${escapeHtml(formatClock(entry.createdAt))}</time>
      <p>${escapeHtml(entry.text || "仅截图记录").replace(/\n/g, "<br>")}</p>
      ${entry.image ? `<img src="${escapeAttribute(entry.image)}" alt="实验截图 ${index + 1}">` : ""}
    </article>
  `).join("");

  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <title>${escapeHtml(experiment.title)}</title>
  <style>
    body{max-width:900px;margin:0 auto;padding:42px 24px;font-family:Inter,"Noto Sans SC",Arial,sans-serif;color:#111;background:#f7f6f1;line-height:1.7}
    header{margin-bottom:28px;border-bottom:1px solid #ddd;padding-bottom:18px}
    h1{margin:0 0 8px;font-size:32px}.meta{color:#666;font-weight:700}.entry{margin:18px 0;padding:18px;border:1px solid #ddd;border-radius:10px;background:#fff}
    .entry h2{margin:0 0 4px;font-size:20px}.entry time{display:block;margin-bottom:12px;color:#777;font-weight:700}.entry p{white-space:normal}.entry img{display:block;max-width:100%;margin-top:12px;border-radius:8px;border:1px solid #ddd}
  </style>
</head>
<body>
  <header>
    <h1>${escapeHtml(experiment.title)}</h1>
    <div class="meta">创建：${escapeHtml(formatDate(experiment.createdAt))} ${escapeHtml(formatClock(experiment.createdAt))} · 共 ${experiment.entries.length} 步</div>
  </header>
  ${entries || "<p>这项实验还没有步骤。</p>"}
</body>
</html>`;
}

function safeFileName(value) {
  return String(value || "实验记录").replace(/[\\/:*?"<>|]/g, "_").slice(0, 60) || "实验记录";
}

function escapeHtml(value) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function escapeAttribute(value) {
  return escapeHtml(value).replace(/`/g, "&#96;");
}

function openProfileModal() {
  profileNameInput.value = state.profile.name;
  profileRoleInput.value = state.profile.role;
  profileEmailInput.value = state.profile.email;
  profileNoteInput.value = state.profile.note;
  avatarUrlInput.value = state.profile.avatar.startsWith("data:") ? "" : state.profile.avatar;
  profileModalAvatar.src = state.profile.avatar || defaultAvatar;
  profileModal.showModal();
}

function renderProfile() {
  const name = state.profile.name || "未设置";

  profileAvatarPreview.src = state.profile.avatar || defaultAvatar;
  profileNamePreview.textContent = name;
}

function showProfileInfo() {
  const info = `个人信息\n${getProfileText()}`;
  if (state.mode === "note") {
    setMode("todo", { restoreLatest: false });
  }
  updateResult(info);
  addMessage("ai", `当前个人信息：\n${getProfileText()}`);
}

function getProfileText() {
  return [
    `昵称：${state.profile.name || "未设置"}`,
    `职位 / 身份：${state.profile.role || "未设置"}`,
    `邮箱：${state.profile.email || "未设置"}`,
    `备注：${state.profile.note || "未设置"}`
  ].join("\n");
}

function saveRecord(input, output) {
  if (state.editingTodoId) {
    const record = state.history.find((item) => item.id === state.editingTodoId);
    if (record) {
      record.input = input;
      record.output = output;
      record.updatedAt = new Date().toISOString();
      persistHistory();
      renderHistory();
      renderTodoSummary();
      state.editingTodoId = null;
      submitButton.textContent = "开始整理";
      clearButton.textContent = "清空输入";
      return record;
    }
  }

  const record = {
    id: createId(),
    input,
    output,
    completed: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  state.history.unshift(record);
  state.history = state.history.slice(0, 80);
  persistHistory();
  renderHistory();
  renderTodoSummary();
  return record;
}

function showRecord(record) {
  state.activeHistoryId = record.id;
  renderHistory();
  renderTodoSummary();
}

function renderDashboard() {
  const todayTodos = getTodoGroups().find((group) => group.key === "today")?.items || [];
  const tomorrowTodos = getTodoGroups().find((group) => group.key === "tomorrow")?.items || [];
  const weekTodos = getTodoGroups().find((group) => group.key === "week")?.items || [];
  const latestNote = state.notes[0];
  const latestMoment = state.moments[0];
  const upcomingCount = tomorrowTodos.length + weekTodos.length;

  statItems.textContent = String(todayTodos.length + upcomingCount + (latestNote ? 1 : 0) + (latestMoment ? 1 : 0));
  dashboardAiSummary.textContent = buildDashboardSummary(todayTodos, upcomingCount, latestNote, latestMoment);

  dashboardView.innerHTML = `
    <div class="dashboard-grid">
      <section class="dashboard-card">
        <p class="eyebrow">Today</p>
        <h2>今天要做</h2>
        <div class="dashboard-list" data-dashboard="today"></div>
      </section>
      <section class="dashboard-card">
        <p class="eyebrow">Upcoming</p>
        <h2>即将到期</h2>
        <div class="dashboard-list" data-dashboard="upcoming"></div>
      </section>
      <section class="dashboard-card">
        <p class="eyebrow">Latest Note</p>
        <h2>最近笔记</h2>
        <div class="dashboard-list" data-dashboard="note"></div>
      </section>
      <section class="dashboard-card">
        <p class="eyebrow">Latest Moment</p>
        <h2>最近动态</h2>
        <div class="dashboard-list" data-dashboard="moment"></div>
      </section>
    </div>
  `;

  fillDashboardList("today", todayTodos.map(todoDashboardItem));
  fillDashboardList("upcoming", [...tomorrowTodos, ...weekTodos].map(todoDashboardItem));
  fillDashboardList("note", latestNote ? [{ title: getNoteTitle(latestNote.content), meta: latestNote.category || "未分类", mode: "note", id: latestNote.id }] : []);
  fillDashboardList("moment", latestMoment ? [{ title: latestMoment.content || "图片动态", meta: `${formatDate(latestMoment.createdAt)} · ${formatClock(latestMoment.createdAt)}`, mode: "moment", id: latestMoment.id }] : []);
}

function fillDashboardList(name, items) {
  const target = dashboardView.querySelector(`[data-dashboard="${name}"]`);
  if (!target) return;
  if (!items.length) {
    target.innerHTML = '<p class="empty-history">暂无内容。</p>';
    return;
  }
  items.slice(0, 4).forEach((item) => {
    const row = document.createElement("button");
    row.className = "dashboard-row";
    row.type = "button";
    row.innerHTML = `<strong></strong><span>${item.meta}</span>`;
    row.querySelector("strong").textContent = item.title;
    row.addEventListener("click", () => openSearchResult(item));
    target.append(row);
  });
}

function todoDashboardItem(record) {
  const parsed = parseTodoRecord(record);
  return {
    title: parsed.event,
    meta: `${parsed.date} · ${parsed.time}`,
    mode: "todo",
    id: record.id
  };
}

function buildDashboardSummary(todayTodos, upcomingCount, latestNote, latestMoment) {
  if (todayTodos.length >= 3) return "今天主要是 TODO 比较集中，建议先完成时间最明确的事项。";
  if (todayTodos.length > 0 && latestNote) return "今天有待办也有笔记沉淀，适合先处理任务，再整理想法。";
  if (upcomingCount > 0) return "近期有一些即将到期的 TODO，可以提前安排，避免堆到最后。";
  if (latestMoment) return "最近有动态记录，生活和创作状态有在持续更新。";
  return "今天还比较清爽，可以先写下最重要的一件事。";
}

function generateReview(scope) {
  const isWeek = scope === "week";
  const title = isWeek ? "本周总结" : "今日回顾";
  const todos = getReviewTodos(scope);
  const completed = todos.filter((todo) => todo.completed).map((todo) => parseTodoRecord(todo).event);
  const pending = todos.filter((todo) => !todo.completed).map((todo) => parseTodoRecord(todo).event);
  const notes = getReviewNotes(scope).map((note) => getNoteTitle(note.content));
  const moments = getReviewMoments(scope).map((moment) => moment.content || "图片动态");
  const completedItems = [
    ...completed,
    ...notes.map((note) => `写下笔记：${note}`),
    ...moments.map((moment) => `发布动态：${moment}`)
  ];

  dashboardReport.textContent = [
    title,
    "",
    `${isWeek ? "本周" : "今日"}完成：`,
    ...formatReviewList(completedItems.length ? completedItems : ["暂无已完成事项"]),
    "",
    `${isWeek ? "本周" : "今日"}状态：`,
    buildReviewStatus(todos, notes, moments),
    "",
    `${isWeek ? "下周" : "明日"}建议：`,
    buildReviewAdvice(pending, notes)
  ].join("\n");
}

function formatReviewList(items) {
  return items.map((item, index) => `${index + 1}. ${item}`);
}

function buildReviewStatus(todos, notes, moments) {
  if (todos.length && notes.length) return "任务推进和内容记录都有发生，节奏比较完整。";
  if (todos.length) return "主要精力集中在待办推进上。";
  if (notes.length) return "记录更偏向思考、学习和信息整理。";
  if (moments.length) return "有一些生活动态被记录下来。";
  return "记录还不多，可以先从一条 TODO 或一篇笔记开始。";
}

function buildReviewAdvice(pending, notes) {
  if (pending.length) return `优先处理：${pending.slice(0, 2).join("、")}。`;
  if (notes.length) return "可以从最近笔记里提取 1-2 条可执行 TODO。";
  return "保持轻量记录，先确定最重要的一件事。";
}

function getReviewTodos(scope) {
  return state.history.filter((todo) => isWithinReviewScope(todo.updatedAt || todo.createdAt, scope));
}

function getReviewNotes(scope) {
  return state.notes.filter((note) => isWithinReviewScope(note.updatedAt || note.createdAt, scope));
}

function getReviewMoments(scope) {
  return state.moments.filter((moment) => isWithinReviewScope(moment.createdAt, scope));
}

function isWithinReviewScope(value, scope) {
  const day = startOfDay(new Date(value));
  const today = startOfDay(new Date());
  if (scope === "today") return day.getTime() === today.getTime();
  const weekStart = addDays(today, -6);
  return day >= weekStart && day <= today;
}
function convertCurrentNoteToTodo() {
  const selected = noteInput.value.slice(noteInput.selectionStart, noteInput.selectionEnd).trim();
  const content = selected || noteInput.value.trim();
  if (!content) {
    noteInput.focus();
    return;
  }

  const todoText = content.split(/\r?\n/).find((line) => line.trim())?.trim() || content;
  const output = createDemoSummary(todoText);
  const record = saveRecord(todoText, output);
  setMode("todo", { restoreLatest: false });
  showRecord(record);
  addMessage("ai", `已从笔记转成 TODO：\n${output}`);
}

function renderGlobalSearch() {
  const query = globalSearchInput.value.trim().toLowerCase();
  searchResults.innerHTML = "";
  searchResults.classList.toggle("hidden", !query);
  if (!query) return;

  const results = collectSearchResults(query);
  if (!results.length) {
    searchResults.innerHTML = '<p class="empty-history">没有搜到相关记录。</p>';
    return;
  }

  results.forEach((result) => {
    const button = document.createElement("button");
    button.className = "search-result-item";
    button.type = "button";
    button.innerHTML = `
      <span>${result.type}</span>
      <strong></strong>
      <small>${result.meta}</small>
    `;
    button.querySelector("strong").textContent = result.title;
    button.addEventListener("click", () => openSearchResult(result));
    searchResults.append(button);
  });
}

function collectSearchResults(query) {
  const todoResults = state.history
    .filter((record) => searchable(`${record.input}\n${record.output}`).includes(query))
    .map((record) => {
      const parsed = parseTodoRecord(record);
      return {
        type: "TODO",
        title: parsed.event,
        meta: `${parsed.date} · ${parsed.time}`,
        mode: "todo",
        id: record.id
      };
    });

  const noteResults = state.notes
    .filter((note) => searchable(`${note.category || ""}\n${note.content}`).includes(query))
    .map((note) => ({
      type: note.category || "笔记",
      title: getNoteTitle(note.content),
      meta: `${formatDate(note.updatedAt)} · ${formatClock(note.updatedAt)}`,
      mode: "note",
      id: note.id
    }));

  const momentResults = state.moments
    .filter((moment) => searchable(`${moment.content}\n${moment.image}`).includes(query))
    .map((moment) => ({
      type: "朋友圈",
      title: moment.content || "图片动态",
      meta: `${formatDate(moment.createdAt)} · ${formatClock(moment.createdAt)}`,
      mode: "moment",
      id: moment.id
    }));

  const experimentResults = state.experiments
    .filter((experiment) => searchable(`${experiment.title}\n${experiment.entries.map((entry) => entry.text).join("\n")}`).includes(query))
    .map((experiment) => ({
      type: "实验记录",
      title: experiment.title,
      meta: `${experiment.entries.length} 步 · ${formatDate(experiment.updatedAt)}`,
      mode: "experiment",
      id: experiment.id
    }));

  return [...todoResults, ...noteResults, ...momentResults, ...experimentResults].slice(0, 12);
}

function openSearchResult(result) {
  setMode(result.mode, { restoreLatest: false });
  if (result.mode === "todo") {
    const record = state.history.find((item) => item.id === result.id);
    if (record) showRecord(record);
  }
  if (result.mode === "note") editNote(result.id);
  if (result.mode === "moment") renderMoments();
  if (result.mode === "experiment") selectExperiment(result.id);
}

function searchable(value) {
  return String(value || "").toLowerCase();
}

function getTodoGroups() {
  const groups = [
    { key: "today", title: "今天", items: [] },
    { key: "tomorrow", title: "明天", items: [] },
    { key: "week", title: "本周", items: [] },
    { key: "undated", title: "未定时间", items: [] },
    { key: "completed", title: "已完成", items: [] }
  ];
  const map = Object.fromEntries(groups.map((group) => [group.key, group]));

  getSortedTodos().forEach((record) => {
    if (record.completed) {
      map.completed.items.push(record);
      return;
    }
    map[getTodoGroupKey(record)].items.push(record);
  });

  return groups;
}

function getTodoGroupKey(record) {
  const time = getTodoSortValue(record);
  if (time === Number.MAX_SAFE_INTEGER) return "undated";

  const target = startOfDay(new Date(time));
  const today = startOfDay(new Date());
  const tomorrow = addDays(today, 1);
  const weekEnd = addDays(today, 7);

  if (target.getTime() === today.getTime()) return "today";
  if (target.getTime() === tomorrow.getTime()) return "tomorrow";
  if (target > tomorrow && target <= weekEnd) return "week";
  return "undated";
}

function startOfDay(date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function addDays(date, days) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}
function renderTodoSummary() {
  if (state.mode !== "todo") return;
  todoSummaryList.innerHTML = "";
  statItems.textContent = String(state.history.length);

  if (!state.history.length) {
    todoSummaryList.innerHTML = '<p class="empty-history">还没有 TODO。</p>';
    return;
  }

  getTodoGroups().forEach((group) => {
    if (!group.items.length) return;

    const section = document.createElement("section");
    section.className = "todo-group";
    section.innerHTML = `<h3>${group.title}<span>${group.items.length}</span></h3>`;

    group.items.forEach((record) => {
      const item = document.createElement("article");
      item.className = "todo-summary-item";
      item.classList.toggle("completed", Boolean(record.completed));
      item.classList.toggle("active", record.id === state.activeHistoryId);

      const parsed = parseTodoRecord(record);
      item.innerHTML = `
        <button class="todo-complete" type="button"></button>
        <div class="todo-summary-main">
          <strong></strong>
          <span>${parsed.date} · ${parsed.time}</span>
        </div>
        <div class="todo-actions">
          <em data-action="edit">编辑</em>
          <em data-action="delete">删除</em>
        </div>
      `;

      item.querySelector(".todo-complete").textContent = record.completed ? "已完成" : "完成";
      item.querySelector("strong").textContent = parsed.event;
      item.querySelector(".todo-complete").addEventListener("click", () => toggleTodoComplete(record.id));
      item.querySelector('[data-action="edit"]').addEventListener("click", () => editTodo(record.id));
      item.querySelector('[data-action="delete"]').addEventListener("click", () => deleteTodo(record.id));
      item.addEventListener("click", (event) => {
        if (event.target.closest("button") || event.target.dataset.action) return;
        showRecord(record);
      });
      section.append(item);
    });

    todoSummaryList.append(section);
  });
}

function renderHistory() {
  historyList.innerHTML = "";
  if (state.mode === "todo") {
    statItems.textContent = String(state.history.length);
  }

  if (!state.history.length) {
    const empty = document.createElement("p");
    empty.className = "empty-history";
    empty.textContent = "还没有记录。";
    historyList.append(empty);
    return;
  }

  state.history.forEach((record) => {
    const button = document.createElement("button");
    button.className = "history-item";
    button.type = "button";
    button.classList.toggle("active", record.id === state.activeHistoryId);
    button.innerHTML = `
      <div class="todo-main">
        <span>${formatDate(record.updatedAt || record.createdAt)} · ${formatClock(record.updatedAt || record.createdAt)}</span>
        <strong></strong>
      </div>
      <div class="todo-actions">
        <em data-action="edit">编辑</em>
        <em data-action="delete">删除</em>
      </div>
    `;
    button.querySelector("strong").textContent = getTodoEventTitle(record.output, record.input);
    button.addEventListener("click", (event) => {
      const action = event.target.dataset.action;
      if (action === "delete") {
        event.stopPropagation();
        deleteTodo(record.id);
        return;
      }
      if (action === "edit") {
        event.stopPropagation();
        editTodo(record.id);
        return;
      }
      showRecord(record);
    });
    historyList.append(button);
  });
}

function editTodo(id) {
  const record = state.history.find((item) => item.id === id);
  if (!record) return;

  state.editingTodoId = id;
  state.activeHistoryId = id;
  userInput.value = getTodoEventTitle(record.output, record.input);
  submitButton.textContent = "保存修改";
  clearButton.textContent = "取消编辑";
  showRecord(record);
  userInput.focus();
}

function deleteTodo(id, announce = true) {
  const record = state.history.find((item) => item.id === id);
  if (!record) return;

  state.history = state.history.filter((item) => item.id !== id);
  if (state.activeHistoryId === id) {
    state.activeHistoryId = null;
    updateResult(state.history[0]?.output || "等待你的输入。");
  }
  if (state.editingTodoId === id) {
    state.editingTodoId = null;
    userInput.value = "";
    submitButton.textContent = "开始整理";
    clearButton.textContent = "清空输入";
  }
  persistHistory();
  renderHistory();
  renderTodoSummary();
  if (announce) addMessage("ai", `已删除：${getTodoEventTitle(record.output, record.input)}`);
}

function toggleTodoComplete(id) {
  const record = state.history.find((item) => item.id === id);
  if (!record) return;
  record.completed = !record.completed;
  record.updatedAt = new Date().toISOString();
  persistHistory();
  renderHistory();
  renderTodoSummary();
}

function handleTodoCommand(text) {
  const deleteMatch = text.match(/(?:删除|删掉|取消|移除)(?:一下|掉|这个|这条|一个|某个|TODO|todo|待办|\s)*(.*)/);
  if (deleteMatch && deleteMatch[1]?.trim()) {
    const keyword = cleanupCommandKeyword(deleteMatch[1]);
    const record = findTodoByKeyword(keyword);
    if (!record) return `没找到包含“${keyword}”的 TODO。你可以点右侧记录上的“删除”。`;
    deleteTodo(record.id, false);
    return `已删除：${getTodoEventTitle(record.output, record.input)}`;
  }

  const editMatch = text.match(/(?:把|将)?(.+?)(?:改成|改为|修改为|改到|调整为)(.+)/);
  if (editMatch) {
    const keyword = cleanupCommandKeyword(editMatch[1]);
    const nextText = cleanupCommandKeyword(editMatch[2]);
    const record = findTodoByKeyword(keyword);
    if (!record) return `没找到包含“${keyword}”的 TODO。你可以点右侧记录上的“编辑”。`;

    record.input = nextText;
    record.output = createDemoSummary(nextText);
    record.updatedAt = new Date().toISOString();
    persistHistory();
    renderHistory();
    renderTodoSummary();
    showRecord(record);
    return `已修改：\n${record.output}`;
  }

  return "";
}

function findTodoByKeyword(keyword) {
  const normalizedKeyword = keyword.toLowerCase();
  return state.history.find((record) => {
    const haystack = `${record.input}\n${record.output}\n${getTodoEventTitle(record.output, record.input)}`.toLowerCase();
    return haystack.includes(normalizedKeyword);
  });
}

function cleanupCommandKeyword(value) {
  return value
    .replace(/^(TODO|todo|待办|事项|记录|：|:|，|,|\s)+/, "")
    .replace(/(TODO|todo|待办|事项|记录|。|，|,|\s)+$/, "")
    .trim();
}

function getSortedTodos() {
  return [...state.history].sort((a, b) => {
    if (Boolean(a.completed) !== Boolean(b.completed)) return a.completed ? 1 : -1;
    return getTodoSortValue(a) - getTodoSortValue(b);
  });
}

function getTodoSortValue(record) {
  const parsed = parseTodoRecord(record);
  if (parsed.date === "未定") return Number.MAX_SAFE_INTEGER;
  const currentYear = new Date().getFullYear();
  const normalizedDate = parsed.date.replace(/[.。-]/g, "/");
  const dateText = normalizedDate.includes("/") && !normalizedDate.startsWith(String(currentYear))
    ? `${currentYear}/${normalizedDate}`
    : normalizedDate;
  const timeText = /^\d{2}:\d{2}$/.test(parsed.time) ? parsed.time : "23:59";
  const time = new Date(`${dateText} ${timeText}`).getTime();
  return Number.isNaN(time) ? Number.MAX_SAFE_INTEGER : time;
}

function parseTodoRecord(record) {
  const line = record.output.split(/\r?\n/).find((item) => item.trim())?.trim() || "";
  const parts = line.split(/\s+/);
  if (parts.length >= 3) {
    return {
      date: parts[0],
      time: parts[1],
      event: parts.slice(2).join(" ")
    };
  }
  return {
    date: formatDate(record.updatedAt || record.createdAt),
    time: formatClock(record.updatedAt || record.createdAt),
    event: getTodoEventTitle(record.output, record.input)
  };
}

function updateResult(content) {
  resultOutput.classList.remove("is-changing");
  requestAnimationFrame(() => {
    resultOutput.classList.add("is-changing");
    resultOutput.textContent = content;
    statItems.textContent = String(state.mode === "todo" ? state.history.length : countResultItems(content));
  });
}

function countResultItems(content) {
  const numbered = content.match(/^\d+[.、]/gm);
  if (numbered) return numbered.length;
  return content.split("\n").filter((line) => line.trim().startsWith("-")).length;
}

function normalizeOutput(content) {
  return String(content)
    .replace(/\r\n/g, "\n")
    .split("\n")
    .map((line) => line.trimEnd())
    .filter((line) => line.trim())
    .join("\n");
}

function setBusy(isBusy) {
  submitButton.disabled = isBusy;
  submitButton.textContent = isBusy ? "整理中..." : state.editingTodoId ? "保存修改" : "开始整理";
}

function canUseConfiguredAi() {
  const proxyAvailable = state.settings.endpoint.startsWith("/") && location.protocol !== "file:";
  return proxyAvailable || Boolean(state.settings.apiKey);
}

function persistHistory() {
  localStorage.setItem(STORAGE_KEYS.history, JSON.stringify(state.history));
}

function persistNotes() {
  localStorage.setItem(STORAGE_KEYS.notes, JSON.stringify(state.notes));
}

function persistMoments() {
  localStorage.setItem(STORAGE_KEYS.moments, JSON.stringify(state.moments));
}

function persistExperiments() {
  localStorage.setItem(STORAGE_KEYS.experiments, JSON.stringify(state.experiments));
}

function persistProfile() {
  localStorage.setItem(STORAGE_KEYS.profile, JSON.stringify(state.profile));
}

function loadHistory() {
  const saved = localStorage.getItem(STORAGE_KEYS.history);
  if (!saved) return;

  try {
    state.history = JSON.parse(saved).filter((record) => !record.mode || record.mode === "todo");
  } catch {
    localStorage.removeItem(STORAGE_KEYS.history);
  }
}

function loadNotes() {
  const saved = localStorage.getItem(STORAGE_KEYS.notes);
  if (!saved) return;

  try {
    state.notes = JSON.parse(saved);
  } catch {
    localStorage.removeItem(STORAGE_KEYS.notes);
  }
}

function loadMoments() {
  const saved = localStorage.getItem(STORAGE_KEYS.moments);
  if (!saved) return;

  try {
    state.moments = JSON.parse(saved);
  } catch {
    localStorage.removeItem(STORAGE_KEYS.moments);
  }
}

function loadExperiments() {
  const saved = localStorage.getItem(STORAGE_KEYS.experiments);
  if (!saved) return;

  try {
    state.experiments = JSON.parse(saved).map((experiment) => ({
      ...experiment,
      entries: Array.isArray(experiment.entries) ? experiment.entries : []
    }));
    state.activeExperimentId = state.experiments[0]?.id || null;
  } catch {
    localStorage.removeItem(STORAGE_KEYS.experiments);
  }
}

function loadProfile() {
  const saved = localStorage.getItem(STORAGE_KEYS.profile);
  if (!saved) return;

  try {
    state.profile = { ...state.profile, ...JSON.parse(saved) };
  } catch {
    localStorage.removeItem(STORAGE_KEYS.profile);
  }
}

function loadSettings() {
  const saved = localStorage.getItem(STORAGE_KEYS.settings);
  const legacy = localStorage.getItem("flownote-ai-settings");
  const source = saved || legacy;
  if (!source) return;

  try {
    state.settings = { ...state.settings, ...JSON.parse(source) };
    localStorage.setItem(STORAGE_KEYS.settings, JSON.stringify(state.settings));
  } catch {
    localStorage.removeItem(STORAGE_KEYS.settings);
  }
}

function createId() {
  return crypto.randomUUID ? crypto.randomUUID() : String(Date.now());
}

function formatDate(value) {
  return new Date(value).toLocaleDateString("zh-CN", {
    month: "2-digit",
    day: "2-digit"
  });
}

function formatClock(value) {
  return new Date(value).toLocaleTimeString("zh-CN", {
    hour: "2-digit",
    minute: "2-digit"
  });
}

function inferDateText(text, now) {
  if (/后天/.test(text)) {
    const date = new Date(now);
    date.setDate(date.getDate() + 2);
    return formatDate(date);
  }
  if (/明天/.test(text)) {
    const date = new Date(now);
    date.setDate(date.getDate() + 1);
    return formatDate(date);
  }
  if (/今天|今晚|下午|上午|中午|晚上/.test(text)) return formatDate(now);
  return "未定";
}

function inferTimeText(text) {
  const exact = text.match(/([01]?\d|2[0-3])[:：点]([0-5]\d)?/);
  if (exact) {
    const hour = exact[1].padStart(2, "0");
    const minute = exact[2] || "00";
    return `${hour}:${minute}`;
  }
  if (/早上|上午/.test(text)) return "上午";
  if (/中午/.test(text)) return "中午";
  if (/下午/.test(text)) return "下午";
  if (/今晚|晚上/.test(text)) return "晚上";
  return "未定";
}
