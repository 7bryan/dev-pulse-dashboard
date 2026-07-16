// ---------- state ----------
let currentUsername = null;
let currentRepoName = null;
let activeTab = "commits";
// cache of already-fetched tab data, keyed by repo name then tab name,
// so switching tabs (or reselecting a repo) doesn't refetch from GitHub
const tabCache = {};

// ---------- small helpers ----------

function escapeHtml(value) {
  const div = document.createElement("div");
  div.textContent = value ?? "";
  return div.innerHTML;
}

function formatCompactNumber(n) {
  if (typeof n !== "number") return "0";
  return new Intl.NumberFormat("en", { notation: "compact" }).format(n);
}

function timeAgo(dateString) {
  if (!dateString) return "unknown";
  const then = new Date(dateString).getTime();
  const seconds = Math.floor((Date.now() - then) / 1000);

  const steps = [
    ["year", 31536000],
    ["month", 2592000],
    ["day", 86400],
    ["hour", 3600],
    ["minute", 60],
  ];

  for (const [label, secondsInUnit] of steps) {
    const value = Math.floor(seconds / secondsInUnit);
    if (value >= 1) return `${value} ${label}${value > 1 ? "s" : ""} ago`;
  }
  return "just now";
}

function formatDate(dateString) {
  if (!dateString) return "unknown";
  return new Date(dateString).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function el(id) {
  return document.getElementById(id);
}

function setHidden(id, hidden) {
  el(id).hidden = hidden;
}

function showFeedback(message, type) {
  const box = el("feedback");
  box.textContent = message;
  box.className = `feedback ${type}`;
  box.hidden = false;
}

function clearFeedback() {
  const box = el("feedback");
  box.hidden = true;
  box.textContent = "";
}

// ---------- search flow ----------

window.addEventListener("DOMContentLoaded", async () => {
  checkBackendHealth();
  el("search-form").addEventListener("submit", handleSearch);
  document
    .querySelectorAll(".tab")
    .forEach((btn) =>
      btn.addEventListener("click", () => selectTab(btn.dataset.tab)),
    );
});

async function handleSearch(event) {
  event.preventDefault();

  const input = el("username-input");
  const username = input.value.trim();
  if (!username) return;

  const searchBtn = el("search-btn");
  const pulse = el("pulse-line");

  clearFeedback();
  setHidden("profile-section", true);
  setHidden("repos-section", true);
  setHidden("detail-section", true);
  setHidden("empty-state", true);

  searchBtn.disabled = true;
  pulse.classList.add("active");
  showFeedback(`Looking up @${escapeHtml(username)}…`, "loading");

  try {
    const user = await getUser(username);
    currentUsername = username;
    renderProfile(user);
    setHidden("profile-section", false);

    let repos = [];
    let reposFailed = false;
    try {
      repos = (await getUserRepos(username)) || [];
    } catch (repoError) {
      // profile loaded fine, but repos failed independently (e.g. rate limit)
      reposFailed = true;
      showFeedback(
        `Loaded @${escapeHtml(username)}, but repositories failed to load: ${repoError.message}`,
        "error",
      );
    }

    renderRepoGrid(repos);
    setHidden("repos-section", false);

    if (!reposFailed) clearFeedback();
  } catch (error) {
    showFeedback(error.message || "Something went wrong.", "error");
    setHidden("empty-state", false);
  } finally {
    searchBtn.disabled = false;
    pulse.classList.remove("active");
  }
}

// ---------- profile rendering ----------

function renderProfile(user) {
  el("profile-avatar").src = user.avatar_url || "";
  el("profile-avatar").alt = user.login ? `${user.login}'s avatar` : "";
  el("profile-name").textContent = user.name || user.login || "Unknown user";

  const login = el("profile-login");
  login.textContent = user.login ? `@${user.login}` : "";
  login.href = user.html_url || "#";

  el("profile-bio").textContent = user.bio || "";

  el("profile-location").innerHTML = user.location
    ? `<i class="fa-solid fa-location-dot"></i> ${escapeHtml(user.location)}`
    : "";
  el("profile-company").innerHTML = user.company
    ? `<i class="fa-solid fa-building"></i> ${escapeHtml(user.company)}`
    : "";
  el("profile-joined").innerHTML = user.created_at
    ? `<i class="fa-regular fa-calendar"></i> Joined ${formatDate(user.created_at)}`
    : "";

  el("stat-repos").textContent = formatCompactNumber(user.public_repos || 0);
  el("stat-followers").textContent = formatCompactNumber(user.followers || 0);
  el("stat-following").textContent = formatCompactNumber(user.following || 0);
}

// ---------- repo grid rendering ----------

function renderRepoGrid(repos) {
  const grid = el("repo-grid");
  const count = el("repo-count");
  grid.innerHTML = "";

  count.textContent = `${repos.length} repo${repos.length === 1 ? "" : "s"}`;

  if (repos.length === 0) {
    grid.innerHTML = `<div class="panel-empty">No public repositories found.</div>`;
    return;
  }

  // most recently updated first
  const sorted = [...repos].sort(
    (a, b) => new Date(b.updated_at) - new Date(a.updated_at),
  );

  sorted.forEach((repo) => {
    const card = document.createElement("button");
    card.type = "button";
    card.className = "repo-card";
    card.dataset.repo = repo.name;
    card.innerHTML = `
      <div class="repo-card-top">
        <span class="repo-name">${escapeHtml(repo.name)}</span>
        ${repo.fork ? '<span class="repo-fork-badge"><i class="fa-solid fa-code-fork"></i> fork</span>' : ""}
      </div>
      <p class="repo-desc">${escapeHtml(repo.description || "No description provided.")}</p>
      <div class="repo-stats">
        ${repo.language ? `<span><span class="lang-dot"></span> ${escapeHtml(repo.language)}</span>` : ""}
        <span><i class="fa-solid fa-star"></i> ${formatCompactNumber(repo.stargazers_count || 0)}</span>
        <span><i class="fa-solid fa-code-fork"></i> ${formatCompactNumber(repo.forks_count || 0)}</span>
        <span>updated ${timeAgo(repo.updated_at)}</span>
      </div>
    `;
    card.addEventListener("click", () => selectRepo(repo));
    grid.appendChild(card);
  });
}

// ---------- repo detail / tabs ----------

function selectRepo(repo) {
  currentRepoName = repo.name;
  activeTab = "commits";

  document.querySelectorAll(".repo-card").forEach((card) => {
    card.classList.toggle("selected", card.dataset.repo === repo.name);
  });

  el("detail-repo-name").textContent = repo.name;
  el("detail-repo-link").href =
    repo.html_url || `https://github.com/${currentUsername}/${repo.name}`;

  document.querySelectorAll(".tab").forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.tab === "commits");
  });
  document.querySelectorAll(".tab-panel").forEach((panel) => {
    panel.classList.toggle("active", panel.id === "panel-commits");
  });

  setHidden("detail-section", false);
  el("detail-section").scrollIntoView({ behavior: "smooth", block: "start" });

  loadTabData("commits");
}

function selectTab(tabName) {
  if (!currentRepoName) return;
  activeTab = tabName;

  document.querySelectorAll(".tab").forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.tab === tabName);
  });
  document.querySelectorAll(".tab-panel").forEach((panel) => {
    panel.classList.toggle("active", panel.id === `panel-${tabName}`);
  });

  loadTabData(tabName);
}

async function loadTabData(tabName) {
  const panel = el(`panel-${tabName}`);
  const repoName = currentRepoName;

  tabCache[repoName] = tabCache[repoName] || {};

  if (tabCache[repoName][tabName]) {
    renderTabPanel(tabName, tabCache[repoName][tabName]);
    return;
  }

  panel.innerHTML = `<div class="panel-loading">Fetching ${tabName}…</div>`;

  try {
    let data;
    switch (tabName) {
      case "commits":
        data = await getRepoCommits(currentUsername, repoName);
        break;
      case "issues":
        data = await getRepoIssues(currentUsername, repoName);
        break;
      case "contributors":
        data = await getRepoContributors(currentUsername, repoName);
        break;
      case "branches":
        data = await getRepoBranches(currentUsername, repoName);
        break;
    }

    data = data || [];
    // guard against a stale response landing after the user switched repos
    if (repoName !== currentRepoName) return;

    tabCache[repoName][tabName] = data;
    renderTabPanel(tabName, data);
  } catch (error) {
    if (repoName !== currentRepoName) return;
    panel.innerHTML = `<div class="panel-error">Couldn't load ${tabName}: ${escapeHtml(error.message)}</div>`;
  }
}

function renderTabPanel(tabName, data) {
  const panel = el(`panel-${tabName}`);

  if (!Array.isArray(data) || data.length === 0) {
    panel.innerHTML = `<div class="panel-empty">No ${tabName} found for this repository.</div>`;
    return;
  }

  switch (tabName) {
    case "commits":
      renderCommits(panel, data);
      break;
    case "issues":
      renderIssues(panel, data);
      break;
    case "contributors":
      renderContributors(panel, data);
      break;
    case "branches":
      renderBranches(panel, data);
      break;
  }
}

function renderCommits(panel, commits) {
  const rows = commits
    .slice(0, 30)
    .map((c) => {
      const message = (c.commit?.message || "").split("\n")[0];
      const author = c.commit?.author?.name || "unknown";
      const date = c.commit?.author?.date;
      const sha = (c.sha || "").slice(0, 7);
      return `
        <a class="data-row" href="${c.html_url || "#"}" target="_blank">
          <span class="sha-badge">${escapeHtml(sha)}</span>
          <div class="data-row-main">
            <div class="commit-message">${escapeHtml(message)}</div>
            <div class="commit-meta">${escapeHtml(author)} · ${timeAgo(date)}</div>
          </div>
        </a>
      `;
    })
    .join("");

  panel.innerHTML = `<div class="data-list">${rows}</div>`;
}

function renderIssues(panel, issues) {
  const rows = issues
    .slice(0, 30)
    .map((issue) => {
      const isPr = Boolean(issue.pull_request);
      return `
        <a class="data-row" href="${issue.html_url || "#"}" target="_blank">
          <span class="issue-state ${issue.state === "open" ? "open" : "closed"}">${escapeHtml(issue.state || "unknown")}</span>
          <div class="data-row-main">
            <div class="issue-title">${isPr ? "PR: " : ""}${escapeHtml(issue.title)}</div>
            <div class="row-meta">#${issue.number} opened by ${escapeHtml(issue.user?.login || "unknown")} · ${timeAgo(issue.created_at)}</div>
          </div>
        </a>
      `;
    })
    .join("");

  panel.innerHTML = `<div class="data-list">${rows}</div>`;
}

function renderContributors(panel, contributors) {
  const cards = contributors
    .slice(0, 30)
    .map(
      (c) => `
        <a class="contributor-card" href="${c.html_url || "#"}" target="_blank">
          <img class="contributor-avatar" src="${c.avatar_url || ""}" alt="${escapeHtml(c.login || "")}" />
          <div>
            <div class="contributor-name">${escapeHtml(c.login || "unknown")}</div>
            <div class="contributor-count">${formatCompactNumber(c.contributions || 0)} commits</div>
          </div>
        </a>
      `,
    )
    .join("");

  panel.innerHTML = `<div class="contributor-grid">${cards}</div>`;
}

function renderBranches(panel, branches) {
  const rows = branches
    .map(
      (b) => `
        <div class="data-row">
          <div class="data-row-main">
            <div class="branch-name">
              <i class="fa-solid fa-code-branch"></i>
              ${escapeHtml(b.name)}
              ${b.protected ? '<span class="default-badge">protected</span>' : ""}
            </div>
            <div class="row-meta">${escapeHtml((b.commit?.sha || "").slice(0, 7))}</div>
          </div>
        </div>
      `,
    )
    .join("");

  panel.innerHTML = `<div class="data-list">${rows}</div>`;
}
