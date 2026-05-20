import express from 'express';
import Stripe from 'stripe';
import crypto from 'node:crypto';

const app = express();
const port = Number(process.env.PORT || 8787);
const stripeSecret = process.env.STRIPE_SECRET_KEY;
const checkoutPrice = process.env.STRIPE_PRICE_ID;
const appSecret = process.env.LICENSE_SIGNING_SECRET || 'dev-local-license-secret';
const stripe = stripeSecret ? new Stripe(stripeSecret) : undefined;

app.use(express.json());

function signLicense(licenseKey: string) {
  return crypto.createHmac('sha256', appSecret).update(licenseKey).digest('hex');
}

app.post('/checkout', async (req, res) => {
  if (!stripe || !checkoutPrice) {
    res.status(503).json({ error: 'Stripe ist nicht konfiguriert.' });
    return;
  }

  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    line_items: [{ price: checkoutPrice, quantity: 1 }],
    success_url: req.body.successUrl,
    cancel_url: req.body.cancelUrl,
    metadata: { product: 'smart-prompt-creator' }
  });

  res.json({ url: session.url });
});

app.post('/license/validate', (req, res) => {
  const licenseKey = String(req.body.licenseKey || '');
  const valid = licenseKey.startsWith('SPC-') && licenseKey.length >= 12;
  const graceUntil = new Date(Date.now() + 1000 * 60 * 60 * 24 * 14).toISOString();
  res.json({
    valid,
    token: valid ? signLicense(licenseKey) : undefined,
    graceUntil
  });
});

app.listen(port, () => {
  console.log(`License server listening on http://127.0.0.1:${port}`);
});
