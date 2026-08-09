document.addEventListener('DOMContentLoaded', () => {
  const salesForm = document.getElementById('sales-form');
  const dateInput = document.getElementById('date');
  const submitBtn = document.getElementById('submit-btn');
  const btnText = submitBtn.querySelector('.btn-text');
  const spinner = submitBtn.querySelector('.spinner');
  
  const salesCount = document.getElementById('sales-count');
  const salesList = document.getElementById('sales-list');
  const emptyState = document.getElementById('empty-state');
  
  const webhookUrlInput = document.getElementById('webhook-url');
  const saveWebhookBtn = document.getElementById('save-webhook-btn');
  const toast = document.getElementById('toast');

  let sales = JSON.parse(localStorage.getItem('session_sales') || '[]');
  
  // Set default date to today
  const today = new Date().toISOString().split('T')[0];
  dateInput.value = today;

  // Load saved webhook URL
  const savedWebhook = localStorage.getItem('n8n_webhook_url');
  if (savedWebhook) {
    webhookUrlInput.value = savedWebhook;
  }

  // Render function
  function renderSales() {
    salesList.innerHTML = '';
    salesCount.textContent = `${sales.length} Venta${sales.length === 1 ? '' : 's'}`;

    if (sales.length === 0) {
      emptyState.classList.remove('hidden');
    } else {
      emptyState.classList.add('hidden');
      sales.slice().reverse().forEach(sale => {
        const li = document.createElement('li');
        li.className = 'sale-item';
        li.innerHTML = `
          <div class="sale-info">
            <span class="sale-item-title">${sale.item}</span>
            <span class="sale-item-desc">Clie: ${sale.client} | ${sale.date}</span>
          </div>
          <span class="sale-price">$${parseFloat(sale.amount).toLocaleString('es-AR', {minimumFractionDigits: 2})}</span>
        `;
        salesList.appendChild(li);
      });
    }
  }

  // Toast Helper
  function showToast(message, isError = false) {
    toast.textContent = message;
    toast.style.borderColor = isError ? '#ef4444' : '#6366f1';
    toast.classList.remove('hidden');
    
    setTimeout(() => {
      toast.classList.add('hidden');
    }, 4000);
  }

  // Save webhook URL
  saveWebhookBtn.addEventListener('click', () => {
    const url = webhookUrlInput.value.trim();
    if (url) {
      localStorage.setItem('n8n_webhook_url', url);
      showToast('Webhook URL guardada correctamente');
    }
  });

  // Handle Form Submission
  salesForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const webhookUrl = webhookUrlInput.value.trim();
    if (!webhookUrl) {
      showToast('Por favor, ingresa una URL de webhook de n8n', true);
      return;
    }

    const client = document.getElementById('client').value.trim();
    const item = document.getElementById('item').value.trim();
    const amount = document.getElementById('amount').value;
    const date = document.getElementById('date').value;
    const notes = document.getElementById('notes').value.trim();

    const saleData = { client, item, amount, date, notes };

    // Start loading state
    submitBtn.disabled = true;
    btnText.textContent = 'Enviando a n8n...';
    spinner.classList.remove('hidden');

    try {
      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(saleData)
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      // Success
      sales.push(saleData);
      localStorage.setItem('session_sales', JSON.stringify(sales));
      renderSales();
      
      // Reset form (except date)
      salesForm.reset();
      dateInput.value = today;
      
      showToast('¡Venta registrada y enviada con éxito!');
    } catch (err) {
      console.error(err);
      showToast(`Error al enviar a n8n: ${err.message}`, true);
    } finally {
      // End loading state
      submitBtn.disabled = false;
      btnText.textContent = 'Registrar Venta';
      spinner.classList.add('hidden');
    }
  });

  // Initial render
  renderSales();
});
