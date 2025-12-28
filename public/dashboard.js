const USER_ID = localStorage.getItem('g4_userId');
if(!USER_ID) window.location.href = '/index.html';

let map = L.map('map').setView([0,0], 2);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);
let markers = L.layerGroup().addTo(map);

let currentDeviceId = null;
let currentAppsData = []; // Store app data locally for editing

// 1. Load Device List
async function loadDevices() {
    const res = await fetch(`/api/devices?action=list&userId=${USER_ID}`);
    const devices = await res.json();
    
    const select = document.getElementById('deviceSelect');
    select.innerHTML = '<option value="">Select a Child...</option>';
    
    devices.forEach(d => {
        const opt = document.createElement('option');
        opt.value = d._id;
        opt.innerText = d.name;
        select.appendChild(opt);
    });
}

// 2. Switch Device & Load Data
async function switchDevice() {
    currentDeviceId = document.getElementById('deviceSelect').value;
    if(!currentDeviceId) return;

    // A. Load App List
    const resApps = await fetch(`/api/apps?deviceId=${currentDeviceId}`);
    currentAppsData = await resApps.json();
    renderAppList(currentAppsData);

    // B. Load Settings
    const resSettings = await fetch(`/api/settings?deviceId=${currentDeviceId}`);
    const data = await resSettings.json();
    
    if (data.settings) {
        document.getElementById('locInterval').value = data.settings.locationInterval || 60000;
        document.getElementById('appInterval').value = data.settings.appSyncInterval || 300000;
        updateMap([data.settings]); // Just to update status text if needed
    }
}

// 3. RENDER APPS UI
function renderAppList(apps) {
    const container = document.getElementById('appList');
    container.innerHTML = '';

    if(apps.length === 0) {
        container.innerHTML = '<p>No apps synced yet. Waiting for phone...</p>';
        return;
    }

    apps.forEach((app, index) => {
        const lastOpenedDate = new Date(app.lastopened).toLocaleString();
        
        const card = document.createElement('div');
        card.className = 'app-card';
        card.innerHTML = `
            <div class="app-header">
                <div>
                    <h4>${app.appName}</h4>
                    <span class="pkg-name">${app.packageName}</span>
                    <div class="last-seen">Last opened: ${lastOpenedDate}</div>
                </div>
                <div class="toggle-container">
                    <label>Block App</label>
                    <label class="switch">
                        <input type="checkbox" ${app.isLocked ? 'checked' : ''} onchange="toggleLock('${app._id}', this.checked)">
                        <span class="slider round"></span>
                    </label>
                </div>
            </div>
            
            <div class="app-controls">
                <div class="limit-control">
                    <label>Daily Limit (min):</label>
                    <input type="number" value="${app.dailyLimit}" onchange="updateLimit('${app._id}', this.value)" min="0" placeholder="0 = Unlimited">
                </div>

                <div class="schedules-section">
                    <h5>📅 Schedules</h5>
                    <div id="schedules-${app._id}">
                        ${renderSchedules(app.schedules, index)}
                    </div>
                    <button class="btn-sm" onclick="addSchedule(${index})">+ Add Schedule</button>
                </div>
            </div>
        `;
        container.appendChild(card);
    });
}

// Helper to render the list of schedules for an app
function renderSchedules(schedules, appIndex) {
    if (!schedules || schedules.length === 0) return '<p class="no-sched">No active schedules</p>';

    return schedules.map((sched, sIndex) => `
        <div class="schedule-item">
            <div class="time-inputs">
                <span>From</span>
                <input type="time" value="${sched.startTime}" onchange="updateSchedule(${appIndex}, ${sIndex}, 'startTime', this.value)">
                <span>To</span>
                <input type="time" value="${sched.endTime}" onchange="updateSchedule(${appIndex}, ${sIndex}, 'endTime', this.value)">
                <button class="btn-del" onclick="removeSchedule(${appIndex}, ${sIndex})">×</button>
            </div>
            
            <div class="day-picker">
                ${[0,1,2,3,4,5,6].map(d => {
                    const days = ['Su','Mo','Tu','We','Th','Fr','Sa'];
                    const isActive = sched.days.includes(d);
                    return `<span class="day-bubble ${isActive ? 'active' : ''}" 
                            onclick="toggleDay(${appIndex}, ${sIndex}, ${d})">${days[d]}</span>`;
                }).join('')}
            </div>
        </div>
    `).join('');
}

// --- APP DATA LOGIC ---

async function toggleLock(ruleId, isLocked) {
    await saveRule(ruleId, { isLocked });
}

async function updateLimit(ruleId, limit) {
    await saveRule(ruleId, { dailyLimit: parseInt(limit) });
}

// Saves changes for a specific rule to the server
async function saveRule(ruleId, data) {
    try {
        await fetch(`/api/apps?deviceId=${currentDeviceId}`, {
            method: 'PUT',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({ ruleId, ...data })
        });
        console.log("Saved");
    } catch (e) {
        alert("Error saving rule");
    }
}

// --- SCHEDULE LOGIC (Manipulating Local State then Saving) ---

async function toggleDay(appIndex, schedIndex, dayInt) {
    const app = currentAppsData[appIndex];
    const sched = app.schedules[schedIndex];
    
    // Toggle day presence
    if (sched.days.includes(dayInt)) {
        sched.days = sched.days.filter(d => d !== dayInt);
    } else {
        sched.days.push(dayInt);
    }
    
    // Re-render UI immediately for feedback
    renderAppList(currentAppsData);
    // Save to DB
    await saveRule(app._id, { schedules: app.schedules });
}

async function updateSchedule(appIndex, schedIndex, field, value) {
    const app = currentAppsData[appIndex];
    app.schedules[schedIndex][field] = value;
    await saveRule(app._id, { schedules: app.schedules });
}

async function addSchedule(appIndex) {
    const app = currentAppsData[appIndex];
    app.schedules.push({
        startTime: "21:00",
        endTime: "07:00",
        days: [0,1,2,3,4,5,6], // Default all days
        enabled: true
    });
    renderAppList(currentAppsData);
    await saveRule(app._id, { schedules: app.schedules });
}

async function removeSchedule(appIndex, schedIndex) {
    const app = currentAppsData[appIndex];
    app.schedules.splice(schedIndex, 1);
    renderAppList(currentAppsData);
    await saveRule(app._id, { schedules: app.schedules });
}

// --- GENERIC FUNCTIONS ---

async function saveGlobalSettings() {
    if(!currentDeviceId) return;
    const locInt = document.getElementById('locInterval').value;
    const appInt = document.getElementById('appInterval').value;
    
    await fetch(`/api/settings?deviceId=${currentDeviceId}`, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({ locationInterval: locInt, appSyncInterval: appInt })
    });
    alert("Settings Saved!");
}

function updateMap(logs) { /* Existing Map Logic */ }

function logout() {
    localStorage.removeItem('g4_userId');
    window.location.href = '/index.html';
}

// Modal Logic
function openPairingModal() { document.getElementById('pairingModal').style.display = 'flex'; }
function closeModal() { document.getElementById('pairingModal').style.display = 'none'; }

loadDevices();