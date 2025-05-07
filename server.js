const express = require('express');
const stripe = require('stripe')('sk_test_your_secret_key_here');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

// Create payment intent
app.post('/create-payment-intent', async (req, res) => {
    try {
        const { amount, frequency } = req.body;
        
        // Create a PaymentIntent
        const paymentIntent = await stripe.paymentIntents.create({
            amount: amount,
            currency: 'usd',
            automatic_payment_methods: {
                enabled: true,
            },
            metadata: {
                frequency: frequency,
                donor_name: req.body.name,
                donor_email: req.body.email
            }
        });

        res.json({ clientSecret: paymentIntent.client_secret });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Webhook for recurring payments (if implementing subscriptions)
app.post('/webhook', express.raw({type: 'application/json'}), (req, res) => {
    const sig = req.headers['stripe-signature'];
    let event;

    try {
        event = stripe.webhooks.constructEvent(
            req.body,
            sig,
            'your_webhook_signing_secret'
        );
    } catch (err) {
        return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    // Handle the event
    switch (event.type) {
        case 'payment_intent.succeeded':
            const paymentIntent = event.data.object;
            console.log('Payment succeeded:', paymentIntent.id);
            break;
        default:
            console.log(`Unhandled event type ${event.type}`);
    }

    res.json({ received: true });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));