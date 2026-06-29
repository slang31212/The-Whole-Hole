function renderDetail() {
  const params = new URLSearchParams(window.location.search);
  const index = Number(params.get("i"));
  const platforms = loadPlatforms();
  const platform = platforms[index];

  const body = document.getElementById("detailTableBody");

  if (!platform) {
    document.getElementById("detailTitle").textContent = "Platform Not Found";
    body.innerHTML = '<tr><td class="empty-state">No platform at this index.</td></tr>';
    return;
  }

  document.getElementById("detailTitle").textContent = platform.siteName;
  body.innerHTML = "";

  PLATFORM_FIELDS.forEach(({ key, label, isLink }) => {
    const value = platform[key];
    const tr = document.createElement("tr");
    const displayValue = isLink && value
      ? `<a class="source-link" href="${escapeHtml(value)}" target="_blank" rel="noopener noreferrer">${escapeHtml(value)}</a>`
      : escapeHtml(value || "-");
    tr.innerHTML = `<th>${escapeHtml(label)}</th><td>${displayValue}</td>`;
    body.appendChild(tr);
  });
}

renderDetail();
