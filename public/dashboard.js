const USER_ID = localStorage.getItem('g4_userId');
if(!USER_ID) window.location.href = '/index.html';

let map = L.map('map').setView([0,0], 2);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);
let markers = L.layerGroup().addTo(map);

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

// 2. Generate Pairing Code
async function openPairingModal() {
    const name = prompt("Name for this device (e.g. John's Phone):");
    if(!name) return;

    const res = await fetch(`/api/devices?action=generate_code`, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({ userId: USER_ID, name: name })
    });
    const data = await res.json();
    
    document.getElementById('generatedCode').innerText = data.code;
    document.getElementById('pairingModal').style.display = 'flex';
    
    // Refresh list after closing to see new device
}

function closeModal() {
    document.getElementById('pairingModal').style.display = 'none';
    loadDevices();
}

// 3. Switch Device & Load Data
async function switchDevice() {
    const deviceId = document.getElementById('deviceSelect').value;
    if(!deviceId) return;

    const res = await fetch(`/api/location?deviceId=${deviceId}`);
    const logs = await res.json();
    
    updateMap(logs);
}

function updateMap(logs) {
    markers.clearLayers();
    if(logs.length === 0) return;

    const latest = logs[0];
    document.getElementById('battery').innerText = latest.batteryLevel;
    document.getElementById('lastSeen').innerText = new Date(latest.timestamp).toLocaleTimeString();

    const latlng = [latest.latitude, latest.longitude];
    L.marker(latlng).addTo(markers);
    map.setView(latlng, 15);
}

function logout() {
    localStorage.removeItem('g4_userId');
    window.location.href = '/index.html';
}

loadDevices();