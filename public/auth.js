const API = '/api/auth';

async function handleLogin() {
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    
    const res = await fetch(API, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({ action: 'login', email, password })
    });
    
    const data = await res.json();
    if(data.success) {
        localStorage.setItem('g4_userId', data.userId);
        window.location.href = '/dashboard.html';
    } else {
        document.getElementById('msg').innerText = data.error;
    }
}

async function handleRegister() {
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    
    const res = await fetch(API, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({ action: 'register', email, password })
    });

    const data = await res.json();
    if(data.success) {
        alert("Account created! Please login.");
    } else {
        document.getElementById('msg').innerText = data.error;
    }
}