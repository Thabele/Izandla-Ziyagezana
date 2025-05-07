// Initialize Stripe with your publishable key
const stripe = Stripe('pk_test_your_publishable_key_here');
const elements = stripe.elements();
const cardElement = elements.create('card');
cardElement.mount('#card-element');

document.getElementById('donate-button').addEventListener('click', () => {
    document.getElementById('donation-modal').classList.remove('hidden');
});

document.getElementById('submit-donation').addEventListener('click', async () => {
    const amount = document.getElementById('donation-amount').value;
    const email = document.getElementById('donor-email').value;
    
    if (!amount || amount < 1) {
        alert('Please enter a valid amount (minimum $1)');
        return;
    }

    const button = document.getElementById('submit-donation');
    button.disabled = true;
    button.textContent = 'Processing...';

    try {
        // Create payment intent on server
        const response = await fetch('/create-payment-intent', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ amount: Math.round(amount * 100), email })
        });

        const { clientSecret } = await response.json();

        // Confirm payment with Stripe
        const { error, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
            payment_method: { card: cardElement }
        });

        if (error) {
            document.getElementById('card-errors').textContent = error.message;
            button.disabled = false;
            button.textContent = 'Process Donation';
        } else {
            // Successful payment
            alert(`Thank you for your donation of $${amount}! A receipt has been sent to ${email}`);
            document.getElementById('donation-modal').classList.add('hidden');
            // Reset form
            document.getElementById('donation-amount').value = '';
            document.getElementById('donor-email').value = '';
            cardElement.clear();
        }
    } catch (err) {
        console.error('Error:', err);
        alert('Payment failed. Please try again.');
        button.disabled = false;
        button.textContent = 'Process Donation';
    }
});