async function checkBackendHealth() {
  const badge = document.getElementById("api-status-badge");
  const statusText = document.getElementById("status-text");

  try {
    const response = await fetch("http://localhost:8000/health");

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

window.addEventListener("DOMContentLoaded", checkBackendHealth());
