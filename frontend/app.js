const API = "/api";
const $ = (id) => document.getElementById(id);
let records = [];
let lastResult = null;

function showToast(message) {
  const toast = $("toast");
  toast.textContent = message;
  toast.classList.add("show");
  setTimeout(() => toast.classList.remove("show"), 2600);
}
function escapeHTML(value) {
  return String(value ?? "").replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
}
function formatFeedstock(value) {
  return ({cattle_dung:"Cattle dung",food_waste:"Food waste",agri_residue:"Agricultural residue",mixed:"Mixed organic waste"})[value] || value;
}
function statusClass(status) {
  return status === "Critical" ? "critical" : status === "Warning" ? "warning" : "";
}
function navigate(page) {
  document.querySelectorAll(".page").forEach(el => el.classList.remove("active"));
  document.querySelectorAll(".nav-link").forEach(el => el.classList.toggle("active", el.dataset.page === page));
  $(`${page}-page`).classList.add("active");
  $("page-title").textContent = ({dashboard:"Overview",estimate:"New estimation",history:"Estimation history",guide:"How it works"})[page];
  if (page === "history" || page === "dashboard") loadRecords();
}
document.querySelectorAll("[data-page]").forEach(el => el.addEventListener("click", e => {
  e.preventDefault(); navigate(el.dataset.page);
}));
["top-estimate","welcome-estimate","history-estimate"].forEach(id => $(id).addEventListener("click", () => navigate("estimate")));

async function request(path, options = {}) {
  const response = await fetch(`${API}${path}`, {
    ...options,
    headers: {"Content-Type":"application/json", ...(options.headers || {})}
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || "Request failed. Please try again.");
  return data;
}
async function loadRecords() {
  try {
    const data = await request("/estimations");
    records = data.records || [];
    renderDashboard();
    renderHistory();
  } catch (error) {
    showToast(error.message);
    $("recent-table").innerHTML = `<tr><td colspan="5" class="empty-cell">Could not load records. Check the backend and Supabase setup.</td></tr>`;
    $("history-table").innerHTML = `<tr><td colspan="8" class="empty-cell">Could not load records.</td></tr>`;
  }
}
function renderDashboard() {
  $("stat-count").textContent = records.length;
  const latest = records[0];
  $("stat-latest").textContent = latest ? Number(latest.estimated_gas_m3_day).toFixed(2) : "—";
  const avg = records.length ? records.reduce((sum,r)=>sum+Number(r.ph),0)/records.length : null;
  $("stat-ph").textContent = avg === null ? "—" : avg.toFixed(2);
  $("stat-alerts").textContent = records.filter(r=>r.status!=="Normal").length;
  $("last-updated").textContent = latest ? `Latest record: ${new Date(latest.created_at).toLocaleString()}` : "Waiting for data";
  $("recent-table").innerHTML = records.slice(0,5).map(r=>`<tr>
    <td>${new Date(r.created_at).toLocaleDateString()}</td><td>${escapeHTML(formatFeedstock(r.feedstock_type))}</td>
    <td>${Number(r.feedstock_quantity_kg).toFixed(1)} kg</td><td>${Number(r.estimated_gas_m3_day).toFixed(2)} m³</td>
    <td><span class="condition-pill ${statusClass(r.status)}">${escapeHTML(r.status)}</span></td></tr>`).join("") || `<tr><td colspan="5" class="empty-cell">No estimations saved yet.</td></tr>`;
  renderChart();
  if (latest) {
    const text = latest.recommendations?.length ? latest.recommendations[0] : "The entered operating parameters did not trigger any basic rule-based warnings.";
    $("quick-insight").textContent = text;
  } else {
    $("quick-insight").textContent = "Add your first estimation to receive operating guidance based on the entered parameters.";
  }
}
function renderChart() {
  const data = records.slice(0,7).reverse();
  if (!data.length) {
    $("production-chart").innerHTML = `<div class="empty-state">Your production trend will appear here after you save an estimation.</div>`;
    return;
  }
  const max = Math.max(...data.map(r=>Number(r.estimated_gas_m3_day)), 1);
  $("production-chart").innerHTML = data.map((r,i)=>{
    const height = Math.max(4, Number(r.estimated_gas_m3_day)/max*145);
    return `<div class="bar-group"><div class="bar ${i===data.length-1?"latest":""}" style="height:${height}px" title="${Number(r.estimated_gas_m3_day).toFixed(2)} m³/day"></div><span class="bar-label">${new Date(r.created_at).toLocaleDateString(undefined,{month:"short",day:"numeric"})}</span></div>`;
  }).join("");
}
function renderHistory() {
  $("history-table").innerHTML = records.map(r=>`<tr>
    <td>${new Date(r.created_at).toLocaleString()}</td><td>${escapeHTML(formatFeedstock(r.feedstock_type))}</td>
    <td>${Number(r.feedstock_quantity_kg).toFixed(1)} kg</td><td>${Number(r.ph).toFixed(1)}</td>
    <td>${Number(r.temperature_c).toFixed(1)} °C</td><td><strong>${Number(r.estimated_gas_m3_day).toFixed(2)} m³</strong></td>
    <td><span class="condition-pill ${statusClass(r.status)}">${escapeHTML(r.status)}</span></td>
    <td><button class="delete-btn" data-delete="${r.id}" aria-label="Delete estimation">Delete</button></td></tr>`).join("") || `<tr><td colspan="8" class="empty-cell">No saved estimations yet.</td></tr>`;
  document.querySelectorAll("[data-delete]").forEach(btn=>btn.addEventListener("click",()=>deleteRecord(btn.dataset.delete)));
}
async function deleteRecord(id) {
  if (!confirm("Delete this estimation permanently?")) return;
  try { await request(`/estimations/${encodeURIComponent(id)}`,{method:"DELETE"}); showToast("Estimation deleted."); await loadRecords(); }
  catch(error) { showToast(error.message); }
}
$("estimate-form").addEventListener("submit", async (event) => {
  event.preventDefault();
  $("form-message").textContent = "";
  const payload = {
    feedstockType:$("feedstock").value,
    feedstockQuantityKg:Number($("quantity").value),
    moisturePercent:Number($("moisture").value),
    retentionDays:Number($("retention").value),
    temperatureC:Number($("temperature").value),
    ph:Number($("ph").value),
    organicLoad:Number($("organicLoad").value),
    gasPressureKpa:$("pressure").value === "" ? null : Number($("pressure").value)
  };
  const button = $("calculate-btn");
  button.disabled = true; button.textContent = "Calculating…";
  try {
    const data = await request("/estimations",{method:"POST",body:JSON.stringify(payload)});
    lastResult = data.estimation;
    renderResult(lastResult);
    showToast("Estimation calculated and saved.");
    await loadRecords();
  } catch(error) {
    $("form-message").textContent = error.message;
  } finally {
    button.disabled = false; button.innerHTML = 'Calculate estimate <span>→</span>';
  }
});
function renderResult(r) {
  $("result-panel").classList.remove("hidden");
  $("result-value").textContent = Number(r.estimated_gas_m3_day).toFixed(2);
  $("result-status").textContent = r.status;
  $("result-status").className = `condition-pill ${statusClass(r.status)}`;
  $("result-summary").textContent = `For ${Number(r.feedstock_quantity_kg).toFixed(1)} kg/day of ${formatFeedstock(r.feedstock_type).toLowerCase()}, the illustrative model estimates ${Number(r.estimated_gas_m3_day).toFixed(2)} m³ of biogas per day.`;
  $("result-base").textContent = `${Number(r.base_potential_m3_day).toFixed(2)} m³/day`;
  $("result-factor").textContent = `${Number(r.condition_factor).toFixed(2)}×`;
  $("recommendation-list").innerHTML = (r.recommendations || []).map(item=>`<li>${escapeHTML(item)}</li>`).join("") || "<li>No basic warning rules were triggered.</li>";
  $("result-panel").scrollIntoView({behavior:"smooth",block:"start"});
}
loadRecords();
