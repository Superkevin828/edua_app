const checkoutButtons = Array.from(document.querySelectorAll('[data-checkout-trigger]'));
const modal = document.querySelector('[data-checkout-modal]');
const iframe = document.querySelector('[data-checkout-iframe]');
const closeButton = document.querySelector('[data-close-modal]');
const statusMessage = document.querySelector('[data-checkout-status]');

const checkoutEndpoint = 'http://localhost:5000/api/checkout';

function openModal(url = '') {
  if (!modal) return;

  if (url) {
    iframe.src = url;
  }

  modal.classList.add('is-open');
  modal.setAttribute('aria-hidden', 'false');
  document.body.classList.add('modal-open');
}

function closeModal() {
  if (!modal) return;

  modal.classList.remove('is-open');
  modal.setAttribute('aria-hidden', 'true');
  document.body.classList.remove('modal-open');
  if (iframe) {
    iframe.src = '';
  }
}

window.openEmbeddedCheckout = function (url) {
  openModal(url);
};

window.closeEmbeddedCheckout = function () {
  closeModal();
};

function setBusyState(button, isBusy) {
  if (!button) return;

  button.disabled = isBusy;
  button.textContent = isBusy ? 'Preparing checkout...' : 'Pay Securely';
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

checkoutButtons.forEach((button) => {
  button.addEventListener('click', async () => {
    setBusyState(button, true);

    if (statusMessage) {
      statusMessage.textContent = 'Preparing your secure checkout…';
    }

    try {
      const token = localStorage.getItem('token');
      const payload = {
        plan: button.dataset.plan || 'pro',
        billingPeriod: button.dataset.billingPeriod || 'monthly'
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
      setBusyState(button, false);
    }
  });
});
