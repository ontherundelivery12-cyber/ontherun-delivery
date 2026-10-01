require('dotenv').config();
const express = require('express');
const Stripe = require('stripe');
const path = require('path');

const app = express();
const stripe = Stripe(process.env.STRIPE_SECRET_KEY);

app.use(express.json());
app.use(express.static('public'));

app.get('/api/health', (req, res) => {
    res.json({ status: 'API is running' });
});

app.post('/api/calculate-fare', (req, res) => {
    const { distanceInKm, durationInMins, serviceType } = req.body;

    let baseFare = serviceType === 'driver' ? 15.00 : 5.00;
    let perKmRate = serviceType === 'driver' ? 2.00 : 1.20;
    let perMinRate = serviceType === 'driver' ? 0.40 : 0.25;

    let totalFare = baseFare + (distanceInKm * perKmRate) + (durationInMins * perMinRate);
    let minFare = serviceType === 'driver' ? 25.00 : 10.00;

    res.json({
        serviceType,
        estimatedFare: Math.max(totalFare, minFare).toFixed(2)
    });
});

app.post('/api/create-payment-intent', async (req, res) => {
    try {
        const { amountInCents } = req.body;
        const paymentIntent = await stripe.paymentIntents.create({
            amount: amountInCents,
            currency: 'cad',
            automatic_payment_methods: { enabled: true },
        });
        res.json({ clientSecret: paymentIntent.client_secret });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
