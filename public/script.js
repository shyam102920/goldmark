let currentUserId = null;

// Setup form - Create new account
document.getElementById('setupForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('userEmail').value.trim();
    const messageDiv = document.getElementById('setupMessage');
    
    if (!email) {
        showMessage(messageDiv, 'Please enter an email', 'danger');
        return;
    }
    
    try {
        const res = await fetch('/api/user', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email })
        });
        
        const data = await res.json();
        
        if (res.ok) {
            currentUserId = data.userId;
            document.getElementById('senderId').value = data.userId;
            document.getElementById('userEmail').value = '';
            showMessage(messageDiv, `✅ Account created! Your ID: ${data.userId}`, 'success');
            updateBalance();
        } else {
            showMessage(messageDiv, `❌ ${data.error}`, 'danger');
        }
    } catch (err) {
        showMessage(messageDiv, '❌ Connection error', 'danger');
    }
});

// Transfer form
document.getElementById('transferForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const senderId = document.getElementById('senderId').value;
    const receiverId = document.getElementById('receiverId').value;
    const amount = parseFloat(document.getElementById('transferAmount').value);
    const messageDiv = document.getElementById('transferMessage');
    
    if (!senderId || !receiverId || !amount) {
        showMessage(messageDiv, '⚠️ Please fill all fields', 'danger');
        return;
    }
    
    if (amount <= 0) {
        showMessage(messageDiv, '⚠️ Amount must be greater than 0', 'danger');
        return;
    }
    
    try {
        const res = await fetch('/api/transfer', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                senderId: parseInt(senderId),
                receiverId: parseInt(receiverId),
                amount
            })
        });
        
        const data = await res.json();
        
        if (res.ok) {
            showMessage(messageDiv, `✅ Transfer successful! $${amount.toFixed(2)} sent`, 'success');
            document.getElementById('transferAmount').value = '';
            updateBalance();
            loadTransactionHistory();
        } else {
            showMessage(messageDiv, `❌ ${data.error}`, 'danger');
        }
    } catch (err) {
        showMessage(messageDiv, '❌ Connection error', 'danger');
    }
});

// Update balance display
async function updateBalance() {
    const senderId = document.getElementById('senderId').value;
    
    if (!senderId) {
        document.getElementById('balanceDisplay').textContent = '$0.00';
        return;
    }
    
    try {
        const res = await fetch(`/api/balance/${senderId}`);
        if (res.ok) {
            const data = await res.json();
            document.getElementById('balanceDisplay').textContent = `$${data.balance.toFixed(2)}`;
        }
    } catch (err) {
        console.error('Error fetching balance:', err);
    }
}

// Load transaction history
async function loadTransactionHistory() {
    const senderId = document.getElementById('senderId').value;
    const historyContainer = document.getElementById('historyContainer');
    
    if (!senderId) {
        historyContainer.innerHTML = '<p class="text-muted">Enter your User ID to view history</p>';
        return;
    }
    
    try {
        const res = await fetch(`/api/transactions/${senderId}`);
        
        if (res.ok) {
            const data = await res.json();
            
            if (data.transactions.length === 0) {
                historyContainer.innerHTML = '<p class="text-muted">No transactions yet</p>';
                return;
            }
            
            let html = '<div class="table-responsive"><table class="table table-hover"><thead><tr><th>Type</th><th>ID</th><th>Amount</th><th>Date</th><th>Status</th></tr></thead><tbody>';
            
            data.transactions.forEach(tx => {
                const isOutgoing = tx.sender_id == senderId;
                const type = isOutgoing ? '📤 Sent to' : '📥 Received from';
                const otherId = isOutgoing ? tx.receiver_id : tx.sender_id;
                const amountClass = isOutgoing ? 'text-danger' : 'text-success';
                const amountSign = isOutgoing ? '-' : '+';
                const date = new Date(tx.created_at).toLocaleDateString() + ' ' + new Date(tx.created_at).toLocaleTimeString();
                
                html += `<tr>
                    <td>${type}</td>
                    <td>#${otherId}</td>
                    <td class="${amountClass}"><strong>${amountSign}$${tx.amount.toFixed(2)}</strong></td>
                    <td>${date}</td>
                    <td><span class="badge bg-success">${tx.status}</span></td>
                </tr>`;
            });
            
            html += '</tbody></table></div>';
            historyContainer.innerHTML = html;
        } else {
            historyContainer.innerHTML = '<p class="text-danger">Error loading history</p>';
        }
    } catch (err) {
        historyContainer.innerHTML = '<p class="text-danger">Connection error</p>';
    }
}

// Show message helper
function showMessage(element, message, type) {
    element.innerHTML = `<div class="alert alert-${type} alert-dismissible fade show" role="alert">
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    </div>`;
}

// Listen for sender ID changes
document.getElementById('senderId').addEventListener('change', () => {
    updateBalance();
    loadTransactionHistory();
});

// Initial load
window.addEventListener('load', updateBalance);
