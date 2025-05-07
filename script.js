// Mobile menu toggle
const mobileMenuButton = document.getElementById('mobile-menu-button');
const mobileMenu = document.getElementById('mobile-menu');

mobileMenuButton.addEventListener('click', () => {
    mobileMenu.classList.toggle('hidden');
});

// Donation modal
const donateButtons = document.querySelectorAll('.donate-btn:not(#close-modal)');
const donationModal = document.getElementById('donation-modal');
const closeModal = document.getElementById('close-modal');

donateButtons.forEach(button => {
    button.addEventListener('click', () => {
        donationModal.classList.remove('hidden');
        document.body.style.overflow = 'hidden';
    });
});

closeModal.addEventListener('click', () => {
    donationModal.classList.add('hidden');
    document.body.style.overflow = 'auto';
});

// Smooth scrolling for anchor links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        
        const targetId = this.getAttribute('href');
        if (targetId === '#') return;
        
        const targetElement = document.querySelector(targetId);
        if (targetElement) {
            targetElement.scrollIntoView({
                behavior: 'smooth'
            });
            
            // Close mobile menu if open
            if (!mobileMenu.classList.contains('hidden')) {
                mobileMenu.classList.add('hidden');
            }
        }
    });
});

// Animation on scroll
const observerOptions = {
    threshold: 0.1
};

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('animate-fadeIn');
        }
    });
}, observerOptions);

document.querySelectorAll('.video-card, .impact-counter').forEach(element => {
    observer.observe(element);
});

// Enhanced Donation System with Real Transactions
document.addEventListener('DOMContentLoaded', function() {
    // Initialize Stripe (replace with your publishable key)
    const stripe = Stripe('pk_test_your_real_key_here');
    
    // Set up Stripe Elements
    const elements = stripe.elements();
    const cardElement = elements.create('card');
    cardElement.mount('#card-element');
    
    // Donation variables
    let donationAmount = 50; // Default amount
    let donationFrequency = 'one-time'; // Default frequency
    
    // DOM elements
    const customAmountInput = document.getElementById('custom-amount');
    const amountButtons = document.querySelectorAll('.donation-amount-btn');
    const frequencyButtons = document.querySelectorAll('.frequency-btn');
    const continueBtn = document.getElementById('continue-to-payment');
    const backBtn = document.getElementById('back-to-amount');
    const paymentForm = document.getElementById('payment-form');
    const step1 = document.getElementById('donation-form-step-1');
    const step2 = document.getElementById('donation-form-step-2');
    const successDiv = document.getElementById('donation-success');
    const displayAmount = document.getElementById('display-amount');
    const displayFrequency = document.getElementById('display-frequency');
    const successEmail = document.getElementById('success-email');
    const closeSuccessBtn = document.getElementById('close-success');
    
    // Handle amount selection
    amountButtons.forEach(button => {
        button.addEventListener('click', () => {
            // Update selected amount
            donationAmount = parseInt(button.dataset.amount);
            
            // Update UI
            amountButtons.forEach(btn => {
                btn.classList.remove('bg-primary', 'text-white');
                btn.classList.add('border-gray-300');
            });
            button.classList.add('bg-primary', 'text-white');
            button.classList.remove('border-gray-300');
            
            // Clear custom amount
            customAmountInput.value = '';
        });
    });
    
    // Handle custom amount input
    customAmountInput.addEventListener('input', () => {
        if (customAmountInput.value) {
            donationAmount = parseFloat(customAmountInput.value);
            
            // Deselect all amount buttons
            amountButtons.forEach(btn => {
                btn.classList.remove('bg-primary', 'text-white');
                btn.classList.add('border-gray-300');
            });
        }
    });
    
    // Handle frequency selection
    frequencyButtons.forEach(button => {
        button.addEventListener('click', () => {
            donationFrequency = button.dataset.frequency;
            
            // Update UI
            frequencyButtons.forEach(btn => {
                btn.classList.remove('bg-primary', 'text-white');
                btn.classList.add('border-gray-300');
            });
            button.classList.add('bg-primary', 'text-white');
            button.classList.remove('border-gray-300');
        });
    });
    
    // Continue to payment
    continueBtn.addEventListener('click', () => {
        // Validate amount
        if (donationAmount <= 0 || isNaN(donationAmount)) {
            alert('Please enter a valid donation amount');
            return;
        }
        
        // Update display
        displayAmount.textContent = `$${donationAmount.toFixed(2)}`;
        
        // Update frequency display text
        let frequencyText = '';
        switch(donationFrequency) {
            case 'one-time': frequencyText = 'One-time'; break;
            case 'monthly': frequencyText = 'Monthly'; break;
            case 'yearly': frequencyText = 'Yearly'; break;
        }
        displayFrequency.textContent = frequencyText;
        
        // Show payment form
        step1.classList.add('hidden');
        step2.classList.remove('hidden');
    });
    
    // Back to amount selection
    backBtn.addEventListener('click', () => {
        step2.classList.add('hidden');
        step1.classList.remove('hidden');
    });
    
    // Handle form submission
    paymentForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        // Show loading state
        const submitButton = document.getElementById('submit-payment');
        const buttonText = document.getElementById('button-text');
        const buttonSpinner = document.getElementById('button-spinner');
        
        buttonText.textContent = 'Processing...';
        buttonSpinner.classList.remove('hidden');
        submitButton.disabled = true;
        
        // Get name and email
        const name = document.getElementById('name-on-card').value;
        const email = document.getElementById('email').value;
        
        try {
            // Create payment intent on your server
            const response = await fetch('/create-payment-intent', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    amount: donationAmount * 100, // Convert to cents
                    frequency: donationFrequency,
                    name: name,
                    email: email
                }),
            });
            
            const { clientSecret } = await response.json();
            
            // Confirm the payment with Stripe
            const { error, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
                payment_method: {
                    card: cardElement,
                    billing_details: {
                        name: name,
                        email: email,
                    },
                },
                receipt_email: email,
            });
            
            if (error) {
                throw error;
            }
            
            // Show success message
            step2.classList.add('hidden');
            successDiv.classList.remove('hidden');
            successEmail.textContent = email;
            
            console.log('Payment successful:', paymentIntent);
            
        } catch (error) {
            // Handle errors
            const errorElement = document.getElementById('card-errors');
            errorElement.textContent = error.message || 'Payment failed. Please try again.';
            
            // Reset button
            buttonText.textContent = 'Donate Now';
            buttonSpinner.classList.add('hidden');
            submitButton.disabled = false;
        }
    });
    
    // Close success message
    closeSuccessBtn.addEventListener('click', () => {
        donationModal.classList.add('hidden');
        document.body.style.overflow = 'auto';
        
        // Reset form
        paymentForm.reset();
        cardElement.clear();
        step1.classList.remove('hidden');
        step2.classList.add('hidden');
        successDiv.classList.add('hidden');
        
        // Reset button
        const submitButton = document.getElementById('submit-payment');
        const buttonText = document.getElementById('button-text');
        const buttonSpinner = document.getElementById('button-spinner');
        
        buttonText.textContent = 'Donate Now';
        buttonSpinner.classList.add('hidden');
        submitButton.disabled = false;
    });
});