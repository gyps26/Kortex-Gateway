document.addEventListener('DOMContentLoaded', async () => {
    const connectBtn = document.getElementById('connect-btn');
    const tokenInput = document.getElementById('token-input');
    const logContainer = document.getElementById('log-container');
    const clearLogsBtn = document.getElementById('clear-logs');
    
    const statusIndicator = document.getElementById('status-indicator');
    const statusDot = document.getElementById('status-dot');
    const statusText = document.getElementById('status-text');
    const statusDesc = document.getElementById('status-desc');

    let isConnected = false;

    // Load stored token if exists
    const storedToken = await window.electronAPI.getStoredToken();
    if (storedToken) {
        tokenInput.value = storedToken;
    }

    function addLog(msg, type = 'info') {
        const div = document.createElement('div');
        div.textContent = `[${new Date().toLocaleTimeString()}] ${msg}`;
        if (type === 'error') div.className = 'text-red-400';
        else if (type === 'success') div.className = 'text-emerald-400';
        else div.className = 'text-slate-300';
        
        logContainer.appendChild(div);
        logContainer.scrollTop = logContainer.scrollHeight;
    }

    function updateStatus(status) {
        if (status === 'connected') {
            isConnected = true;
            statusIndicator.className = 'flex items-center gap-2 text-xs font-bold text-emerald-400 bg-emerald-400/10 px-2 py-1 rounded-full';
            statusDot.className = 'w-2 h-2 rounded-full bg-emerald-400 animate-pulse';
            statusText.textContent = 'Connected';
            statusDesc.textContent = 'Polling central hub...';
            connectBtn.textContent = 'Disconnect';
            connectBtn.className = 'bg-slate-700 hover:bg-slate-600 active:bg-slate-800 text-white font-bold py-3 rounded-lg text-sm transition-colors';
            tokenInput.disabled = true;
        } else if (status === 'disconnected') {
            isConnected = false;
            statusIndicator.className = 'flex items-center gap-2 text-xs font-bold text-red-400 bg-red-400/10 px-2 py-1 rounded-full';
            statusDot.className = 'w-2 h-2 rounded-full bg-red-400';
            statusText.textContent = 'Disconnected';
            statusDesc.textContent = 'Awaiting connection token...';
            connectBtn.textContent = 'Connect to Hub';
            connectBtn.className = 'bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-bold py-3 rounded-lg text-sm transition-colors shadow-lg shadow-indigo-900/20';
            tokenInput.disabled = false;
        } else if (status === 'error') {
            isConnected = false;
            statusIndicator.className = 'flex items-center gap-2 text-xs font-bold text-yellow-400 bg-yellow-400/10 px-2 py-1 rounded-full';
            statusDot.className = 'w-2 h-2 rounded-full bg-yellow-400';
            statusText.textContent = 'Error';
            statusDesc.textContent = 'Connection failed. Check token.';
            connectBtn.textContent = 'Retry Connection';
            connectBtn.className = 'bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-bold py-3 rounded-lg text-sm transition-colors shadow-lg shadow-indigo-900/20';
            tokenInput.disabled = false;
        }
    }

    // Listen for logs from main process
    window.electronAPI.onLogMsg((payload) => {
        addLog(payload.msg, payload.type);
    });

    window.electronAPI.onStatusChange((status) => {
        updateStatus(status);
    });

    connectBtn.addEventListener('click', async () => {
        if (isConnected) {
            await window.electronAPI.disconnectHub();
            updateStatus('disconnected');
            addLog('Disconnected by user.', 'info');
        } else {
            const token = tokenInput.value.trim();
            if (!token) {
                addLog('Please enter a valid token.', 'error');
                return;
            }
            addLog('Attempting to connect...', 'info');
            const res = await window.electronAPI.connectHub(token);
            if (res.success) {
                updateStatus('connected');
                addLog('Successfully connected to hub!', 'success');
            } else {
                updateStatus('error');
                addLog(`Connection failed: ${res.error}`, 'error');
            }
        }
    });

    clearLogsBtn.addEventListener('click', () => {
        logContainer.innerHTML = '';
    });
});
