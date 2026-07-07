// base backend url
const BACKEND_URL = "http://localhost:8000";

async function checkBackendHealth() {
  const badge = document.getElementById("api-status-badge");
  const statusText = document.getElementById("status-text");

  try {
    let url = BACKEND_URL + "/health";
    const response = await fetch(url);

    if (response.ok) {
      badge.className = "status-badge online";
      statusText.innerText = "Backend Connected";
    } else {
      throw new Error("Server down");
    }
  } catch (error) {
    badge.className = "status-badge offline";
    statusText.innerText = "Backend Offline";
  }
}

async function getUserData(username = "") {
  let url = BACKEND_URL;
  if (username) {
    url += `github/{username}`;
  }

  const response = await fetch(url);
  const data = await response.json();

  // might add error handling here
  return data;
}
