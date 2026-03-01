// DOM Elements
const form = document.getElementById('inventoryForm');
const priceInput = document.getElementById('price');
const balanceInput = document.getElementById('balance');
const totalInput = document.getElementById('total');
const dateInput = document.getElementById('date');
const nameInput = document.getElementById('name');

// Modal Elements
const newClientModal = document.getElementById('newClientModal');
const newClientNameInput = document.getElementById('newClientName');
const btnSaveClient = document.getElementById('btnSaveClient');
const btnCancelClient = document.getElementById('btnCancelClient');

const reportsSection = document.getElementById('reportsSection');
const dataSection = document.getElementById('dataSection');
const reportChartCanvas = document.getElementById('reportChart');
const reportTitle = document.getElementById('reportTitle');
const reportSummary = document.getElementById('reportSummary');
const dataTableBody = document.querySelector('#dataTable tbody');

let chartInstance = null;

// Set default date to today
if (dateInput) dateInput.valueAsDate = new Date();

// --- Event Listeners ---

// Auto-calculate Total
function calculateTotal() {
    if (!priceInput || !balanceInput || !totalInput) return;
    const price = parseFloat(priceInput.value) || 0;
    const balance = parseFloat(balanceInput.value) || 0;
    const total = price + balance;
    totalInput.value = total.toFixed(2);
}

if (priceInput) priceInput.addEventListener('input', calculateTotal);
if (balanceInput) balanceInput.addEventListener('input', calculateTotal);

// Detect "Add New Client..." selection
if (nameInput) {
    nameInput.addEventListener('input', function () {
        if (this.value === 'Add New Client...') {
            this.value = ''; // Clear the ugly text
            openClientModal();
        }
    });
}

function openClientModal() {
    if (newClientModal) {
        newClientModal.classList.remove('hidden');
        if (newClientNameInput) {
            newClientNameInput.value = '';
            newClientNameInput.focus();
        }
    }
}

function closeClientModal() {
    if (newClientModal) newClientModal.classList.add('hidden');
}

if (btnCancelClient) btnCancelClient.addEventListener('click', closeClientModal);

if (btnSaveClient) {
    btnSaveClient.addEventListener('click', function () {
        const name = newClientNameInput ? newClientNameInput.value.trim() : '';
        if (!name) {
            if (typeof showToast === 'function') showToast('Please enter a client name.', 'error');
            else alert('Please enter a name.');
            return;
        }

        updateNameList(name);

        // Set the value in the main form
        if (nameInput) nameInput.value = name;

        closeClientModal();
    });
}

// --- Data & Lookup Helpers ---

function getStoredClients() {
    return JSON.parse(localStorage.getItem('sk_custom_names') || '["Default Client 1", "Default Client 2", "Default Client 3", "Default Client 4"]');
}

function saveCustomNames(name) {
    let names = getStoredClients();
    if (!names.includes(name)) {
        names.push(name);
        localStorage.setItem('sk_custom_names', JSON.stringify(names));
    }
}

function removeStoredClient(name) {
    let names = getStoredClients();
    names = names.filter(n => n !== name);
    localStorage.setItem('sk_custom_names', JSON.stringify(names));
}

function getStoredMaterials() {
    return JSON.parse(localStorage.getItem('sk_materials') || '["M Sand", "P Sand", "Bolder", "Flyash", "20 MM", "40 MM", "12 MM", "6 MM", "RiverSand", "Solling", "Sizestone", "Metal", "Gravel", "kuranai", "Redsoil", "Bricks"]');
}

function saveMaterial(name) {
    let mats = getStoredMaterials();
    if (!mats.includes(name)) {
        mats.push(name);
        localStorage.setItem('sk_materials', JSON.stringify(mats));
    }
}

function removeMaterial(name) {
    let mats = getStoredMaterials();
    mats = mats.filter(m => m !== name);
    localStorage.setItem('sk_materials', JSON.stringify(mats));
}

function loadCustomNames() {
    let names = getStoredClients();
    const dataList = document.getElementById('nameList');
    if (!dataList) return;

    // Preserve "Add New Client..." if it's there
    const firstOption = dataList.options[0];
    dataList.innerHTML = '';
    if (firstOption) dataList.appendChild(firstOption);

    names.forEach(name => {
        const option = document.createElement('option');
        option.value = name;
        dataList.appendChild(option);
    });
}

function loadMaterials() {
    const matSelect = document.getElementById('material');
    if (!matSelect) return;

    const currentVal = matSelect.value;
    const materials = getStoredMaterials();

    // Preserve "Select material"
    const firstOption = matSelect.options[0];
    matSelect.innerHTML = '';
    if (firstOption) matSelect.appendChild(firstOption);

    materials.forEach(m => {
        const opt = document.createElement('option');
        opt.value = m;
        opt.textContent = m;
        matSelect.appendChild(opt);
    });

    if (currentVal) matSelect.value = currentVal;
}

function updateNameList(newName) {
    const dataList = document.getElementById('nameList');
    if (!dataList) return;
    const options = Array.from(dataList.options).map(opt => opt.value);
    if (newName && !options.includes(newName)) {
        saveCustomNames(newName);
        loadCustomNames();
    }
}

// Initial Loads
loadCustomNames();
loadMaterials();

const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbxYkylhT18o2HaCdczfMm3MZw_SACtHE3XDny0E23WpaZjT8cJnp9Vc6_TdoJp2uNd6/exec";

// --- Form Submission ---

if (form) {
    form.addEventListener('submit', function (e) {
        e.preventDefault();

        if (typeof validateForm === 'function' && !validateForm()) {
            if (typeof showToast === 'function') showToast('Please fill in all required fields.', 'error');
            return;
        }

        calculateTotal();

        const entry = {
            id: Date.now(),
            type: 'sale',
            name: document.getElementById('name').value.trim(),
            date: document.getElementById('date').value,
            material: document.getElementById('material').value,
            place: document.getElementById('place') ? document.getElementById('place').value.trim() : '',
            quantity: parseFloat(document.getElementById('quantity').value) || 0,
            price: parseFloat(document.getElementById('price').value) || 0,
            balance: parseFloat(document.getElementById('balance').value) || 0,
            total: parseFloat(document.getElementById('total').value) || 0
        };

        const saveBtn = document.getElementById('btnSaveEntry');
        if (saveBtn) {
            saveBtn.disabled = true;
            saveBtn.classList.add('btn-loading');
            const icon = saveBtn.querySelector('i');
            if (icon) icon.style.display = 'none';
        }

        updateNameList(entry.name);
        saveEntry(entry);

        fetch(SCRIPT_URL, {
            method: 'POST',
            mode: 'no-cors',
            headers: { 'Content-Type': 'text/plain' },
            body: JSON.stringify(entry)
        })
            .then(() => {
                showToast('Saved to Cloud & Local!', 'success');
                form.reset();
                if (dateInput) dateInput.valueAsDate = new Date();
                calculateTotal();
                form.querySelectorAll('.has-error').forEach(g => g.classList.remove('has-error'));
                updateStats();
                if (dataSection && !dataSection.classList.contains('hidden')) renderDataTable();
            })
            .catch(err => {
                console.error('Cloud Sync Error:', err);
                showToast('Saved locally; Cloud sync failed.', 'info');
            })
            .finally(() => {
                if (saveBtn) {
                    saveBtn.disabled = false;
                    saveBtn.classList.remove('btn-loading');
                    const icon = saveBtn.querySelector('i');
                    if (icon) icon.style.display = '';
                    if (typeof lucide !== 'undefined') lucide.createIcons({ nodes: [saveBtn] });
                }
            });
    });
}

// --- Navigation & View Controls ---

if (document.getElementById('btnWeeklyReport')) document.getElementById('btnWeeklyReport').addEventListener('click', () => showReport('weekly'));
if (document.getElementById('btnMonthlyReport')) document.getElementById('btnMonthlyReport').addEventListener('click', () => showReport('monthly'));
if (document.getElementById('btnViewData')) document.getElementById('btnViewData').addEventListener('click', showDataView);

if (document.getElementById('closeReport')) document.getElementById('closeReport').addEventListener('click', () => reportsSection.classList.add('hidden'));
if (document.getElementById('closeData')) document.getElementById('closeData').addEventListener('click', () => dataSection.classList.add('hidden'));

// --- Reset Logic ---

const resetModal = document.getElementById('resetConfirmModal');
if (document.getElementById('btnResetEntries')) {
    document.getElementById('btnResetEntries').addEventListener('click', () => resetModal.classList.add('active'));
}

if (document.getElementById('btnCancelReset')) {
    document.getElementById('btnCancelReset').addEventListener('click', () => resetModal.classList.remove('active'));
}

if (resetModal) {
    resetModal.addEventListener('click', (e) => {
        if (e.target === resetModal) resetModal.classList.remove('active');
    });
}

if (document.getElementById('btnConfirmReset')) {
    document.getElementById('btnConfirmReset').addEventListener('click', () => {
        localStorage.removeItem('sk_accounts_data');
        localStorage.removeItem('sk_custom_names');
        if (resetModal) resetModal.classList.remove('active');

        if (dataTableBody) dataTableBody.innerHTML = '';
        const panelTitle = document.getElementById('dataTableTitle');
        if (panelTitle) panelTitle.textContent = 'Recent Entries';
        const badge = document.getElementById('entriesCountBadge');
        if (badge) badge.textContent = '';

        if (dataSection) dataSection.classList.add('hidden');
        if (reportsSection) reportsSection.classList.add('hidden');

        updateStats();
        loadCustomNames(); // Reload defaults
        showToast('All inventory entries have been reset.', 'info');
    });
}

// --- Data Access ---

function getEntries() {
    const data = localStorage.getItem('sk_accounts_data');
    return data ? JSON.parse(data) : [];
}

function saveEntry(entry) {
    const entries = getEntries();
    entries.push(entry);
    localStorage.setItem('sk_accounts_data', JSON.stringify(entries));
}

// --- Stats & Reporting ---

function animateStat(el, newVal) {
    if (el.textContent !== newVal) {
        el.textContent = newVal;
        el.classList.remove('updated');
        void el.offsetWidth;
        el.classList.add('updated');
    }
}

function updateStats() {
    const entries = getEntries();
    const today = new Date().toISOString().split('T')[0];
    const month = today.slice(0, 7);
    const fmt = n => n >= 100000 ? '₹' + (n / 100000).toFixed(1) + 'L' : n >= 1000 ? '₹' + (n / 1000).toFixed(1) + 'K' : '₹' + n.toFixed(0);

    const todayAmt = entries.filter(e => e.date === today).reduce((s, e) => s + (e.price || 0), 0);
    const monthAmt = entries.filter(e => (e.date || '').startsWith(month)).reduce((s, e) => s + (e.price || 0), 0);

    const sT = document.getElementById('statTotal');
    const sD = document.getElementById('statToday');
    const sM = document.getElementById('statMonth');

    if (sT) animateStat(sT, String(entries.length));
    if (sD) animateStat(sD, fmt(todayAmt));
    if (sM) animateStat(sM, fmt(monthAmt));
}

setTimeout(updateStats, 100);

function showReport(type) {
    if (!reportsSection) return;
    reportsSection.classList.remove('hidden');
    if (dataSection) dataSection.classList.add('hidden');

    const entries = getEntries();
    const today = new Date();
    let labels = [];
    let salesData = [];
    let title = (type === 'weekly') ? "Weekly Report (Last 7 Days)" : "Monthly Report (Last 30 Days)";

    const days = (type === 'weekly') ? 7 : 30;
    for (let i = days - 1; i >= 0; i--) {
        const d = new Date();
        d.setDate(today.getDate() - i);
        labels.push(d.toISOString().split('T')[0]);
    }

    if (reportTitle) reportTitle.textContent = title;

    labels.forEach(dateStr => {
        const daySales = entries.filter(e => e.date === dateStr && e.type === 'sale').reduce((sum, e) => sum + e.price, 0);
        salesData.push(daySales);
    });

    renderChart(labels, salesData);

    const totalSales = salesData.reduce((a, b) => a + b, 0);
    if (reportSummary) {
        reportSummary.style.display = 'block';
        reportSummary.innerHTML = `<strong>Total Sales:</strong> ₹${totalSales.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;
    }
}

function renderChart(labels, salesData) {
    if (!reportChartCanvas) return;
    if (chartInstance) chartInstance.destroy();

    const ctx = reportChartCanvas.getContext('2d');
    const grad = ctx.createLinearGradient(0, 0, 0, 230);
    grad.addColorStop(0, 'rgba(37, 99, 235, 0.8)');
    grad.addColorStop(1, 'rgba(37, 99, 235, 0.07)');

    chartInstance = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Sales (₹)',
                data: salesData,
                backgroundColor: grad,
                borderRadius: 5
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: {
                x: { grid: { display: false } },
                y: { beginAtZero: true }
            }
        }
    });
}

function showDataView() {
    if (dataSection) dataSection.classList.remove('hidden');
    if (reportsSection) reportsSection.classList.add('hidden');
    renderDataTable();
}

function renderDataTable() {
    if (!dataTableBody) return;
    const all = getEntries().sort((a, b) => new Date(b.date) - new Date(a.date));
    const entries = all.slice(0, 100);
    dataTableBody.innerHTML = '';

    const badge = document.getElementById('entriesCountBadge');
    if (badge) badge.textContent = all.length > 100 ? `Showing 100 of ${all.length}` : `${all.length} records`;

    if (all.length === 0) {
        dataTableBody.innerHTML = `<tr><td colspan="6" style="text-align:center;padding:20px;">No entries yet.</td></tr>`;
        return;
    }

    entries.forEach(e => {
        const place = e.place || '—';
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td class="td-muted">${e.date}</td>
            <td class="td-name">${e.name}</td>
            <td>${e.material}</td>
            <td>${place}</td>
            <td>${e.quantity}</td>
            <td class="td-amount">₹${e.price.toFixed(2)}</td>
            <td class="td-amount">₹${e.total.toFixed(2)}</td>
        `;
        dataTableBody.appendChild(tr);
    });
}
