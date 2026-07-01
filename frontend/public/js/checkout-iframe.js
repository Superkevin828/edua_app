const checkoutButton = document.querySelector('[data-checkout-trigger]');
const modal = document.querySelector('[data-checkout-modal]');
const iframe = document.querySelector('[data-checkout-iframe]');
const closeButton = document.querySelector('[data-close-modal]');
const statusMessage = document.querySelector('[data-checkout-status]');

const checkoutEndpoint = 'http://localhost:5000/api/checkout';

function openModal() {
  modal.classList.add('is-open');
  modal.setAttribute('aria-hidden', 'false');
  document.body.classList.add('modal-open');
}

function closeModal() {
  modal.classList.remove('is-open');
  modal.setAttribute('aria-hidden', 'true');
  document.body.classList.remove('modal-open');
  iframe.src = '';
}

function setBusyState(isBusy) {
  if (!checkoutButton) return;

  checkoutButton.disabled = isBusy;
  checkoutButton.textContent = isBusy ? 'Preparing checkout...' : 'Pay Securely';
}

if (closeButton) {
  closeButton.addEventListener('click', closeModal);
}

if (modal) {
  modal.addEventListener('click', (event) => {
    if (event.target === modal) {
      closeModal();
    }
  });
}

document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && modal?.classList.contains('is-open')) {
    closeModal();
  }
});

if (checkoutButton) {
  checkoutButton.addEventListener('click', async () => {
    setBusyState(true);

    if (statusMessage) {
      statusMessage.textContent = 'Preparing your secure checkout…';
    }

    try {
      const token = localStorage.getItem('token');
      const payload = {
        plan: checkoutButton.dataset.plan || 'pro',
        billingPeriod: checkoutButton.dataset.billingPeriod || 'monthly'
      };

      const response = await fetch(checkoutEndpoint, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify(payload)
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok || !data.success || !data.redirect_url) {
        throw new Error(data.message || 'Unable to start checkout.');
      }

      iframe.src = data.redirect_url;
      openModal();

      if (statusMessage) {
        statusMessage.textContent = 'Secure checkout is ready.';
      }
    } catch (error) {
      console.error(error);

      if (statusMessage) {
        statusMessage.textContent = error.message || 'Unable to start checkout.';
      }
    } finally {
      setBusyState(false);
    }
  });
}
