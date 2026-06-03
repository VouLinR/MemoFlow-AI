const STORAGE_KEYS = {
  settings: "memoflow-ai-settings",
  history: "memoflow-ai-history",
  profile: "memoflow-ai-profile",
  notes: "memoflow-ai-notes",
  moments: "memoflow-ai-moments"
};

const defaultAvatar =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 96 96'%3E%3Crect width='96' height='96' rx='28' fill='%2315171b'/%3E%3Ccircle cx='48' cy='35' r='16' fill='%23fff' fill-opacity='.92'/%3E%3Cpath d='M20 82c4-18 17-28 28-28s24 10 28 28' fill='%23fff' fill-opacity='.92'/%3E%3C/svg%3E";

const state = {
  mode: "todo",
  activeHistoryId: null,
  editingTodoId: null,
  editingNoteId: null,
  selectedNoteTag: "",
  history: [],
  notes: [],
  moments: [],
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
  }
};

const messages = document.querySelector("#messages");
const chatView = document.querySelector("#chatView");
const noteView = document.querySelector("#noteView");
const momentFeedView = document.querySelector("#momentFeedView");
const chatForm = document.querySelector("#chatForm");
const userInput = document.querySelector("#userInput");
const noteInput = document.querySelector("#noteInput");
const noteTagList = document.querySelector("#noteTagList");
const momentInput = document.querySelector("#momentInput");
const momentImageInput = document.querySelector("#momentImageInput");
const noteEditStatus = document.querySelector("#noteEditStatus");
const newNoteButton = document.querySelector("#newNoteButton");
const saveNoteButton = document.querySelector("#saveNoteButton");
const clearMomentButton = document.querySelector("#clearMomentButton");
const publishMomentButton = document.querySelector("#publishMomentButton");
const resultOutput = document.querySelector("#resultOutput");
const todoSummaryList = document.querySelector("#todoSummaryList");
const noteList = document.querySelector("#noteList");
const momentComposer = document.querySelector("#momentComposer");
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

  const isNote = mode === "note";
  const isMoment = mode === "moment";
  chatView.classList.toggle("hidden", isNote || isMoment);
  noteView.classList.toggle("hidden", !isNote);
  momentFeedView.classList.toggle("hidden", !isMoment);
  const isTodo = mode === "todo";
  resultOutput.classList.toggle("hidden", isTodo || isNote || isMoment);
  todoSummaryList.classList.toggle("hidden", !isTodo);
  noteList.classList.toggle("hidden", !isNote);
  momentComposer.classList.toggle("hidden", !isMoment);
  historyPanel.classList.toggle("hidden", isNote || isMoment);
  copyButton.classList.toggle("hidden", (isNote && !state.editingNoteId) || isMoment);
  statItemsLabel.textContent = isNote ? "条笔记" : isMoment ? "条动态" : "条结果";

  if (isNote) {
    renderNotes();
    return;
  }

  if (isMoment) {
    renderMoments();
    return;
  }

  renderHistory();
  renderTodoSummary();
  if (options.restoreLatest) {
    renderTodoSummary();
  }
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

function renderTodoSummary() {
  if (state.mode !== "todo") return;
  todoSummaryList.innerHTML = "";
  statItems.textContent = String(state.history.length);

  if (!state.history.length) {
    todoSummaryList.innerHTML = '<p class="empty-history">还没有 TODO。</p>';
    return;
  }

  getSortedTodos().forEach((record) => {
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
    todoSummaryList.append(item);
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
