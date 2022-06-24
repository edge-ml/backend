const Router = require('koa-router');
const KoaBody = require('koa-body');
const unparsed = require('koa-body/unparsed.js')

const controller = require('../../controller/payment');
const stripe = require('stripe')('sk_test_51L7KlPAI18ryOlAQVK2aeFJDxgLJ4I2LQXrTjyaZ1b5z1WK9fx5CoCDtpcqXzXXBUEbgJ1fzSinKMm25mvW09MBX00UmHwIuGO')

const router = new Router();

const YOUR_DOMAIN = 'http://localhost:3000';

// TODO double check status codes

router.get('/products', async (ctx) => {
  await controller.getProducts(ctx);
})


router.post('/create-checkout-session', KoaBody(), async (ctx) => {
  const priceId = ctx.request.body.priceId;
  const session = await stripe.checkout.sessions.create({
    line_items: [
      {
        // Provide the exact Price ID (for example, pr_1234) of the product you want to sell
        price: priceId,
        quantity: 1,
      },
    ],
    mode: 'subscription',
    success_url: `${YOUR_DOMAIN}?success=true`,
    cancel_url: `${YOUR_DOMAIN}?canceled=true`,
  });
  ctx.body = { redirectUrl: session.url }
  ctx.status = 200;
  return ctx;
})

router.post('/create-portal-session', KoaBody(), async (ctx) => {
  // For demonstration purposes, we're using the Checkout session to retrieve the customer ID.
  // Typically this is stored alongside the authenticated user in your database.
  const { session_id } = req.body;
  const checkoutSession = await stripe.checkout.sessions.retrieve(session_id);

  const returnUrl = YOUR_DOMAIN;
  const portalSession = await stripe.billingPortal.sessions.create({
    customer: checkoutSession.customer,
    returnUrl: returnUrl  
  })

  ctx.body = { redirectUrl: portalSession.url }
  ctx.status = 200;
  return ctx;
})

router.post('/webhook', KoaBody({includeUnparsed: true}), async (ctx) => {
    console.log("webhook...")

    let event = ctx.request.body[unparsed];
    // Replace this endpoint secret with your endpoint's unique secret
    // If you are testing with the CLI, find the secret by running 'stripe listen'
    // If you are using an endpoint defined with the API or dashboard, look in your webhook settings
    // at https://dashboard.stripe.com/webhooks
    const endpointSecret = 'whsec_0621e1e121cd8987b721a65113613fc16f701f5d3245aa276e2ea74e89c8591b';
    // Only verify the event if you have an endpoint secret defined.
    // Otherwise use the basic event deserialized with JSON.parse
    if (endpointSecret) {
      // Get the signature sent by Stripe
      const signature = ctx.request.headers['stripe-signature'];
      try {
        event = stripe.webhooks.constructEvent(
          ctx.request.body[unparsed],
          signature,
          endpointSecret
        );
      } catch (err) {
        console.log(`⚠️  Webhook signature verification failed.`, err.message);
        ctx.status = 400;
        return ctx;
      }
    }
    console.log(event)
    let subscription;
    let status;
    // Handle the event
    switch (event.type) {
      case 'payment_intent.succeeeded':

      case 'customer.subscription.trial_will_end':
        subscription = event.data.object;
        status = subscription.status;
        console.log(`Subscription status is ${status}.`);
        // Then define and call a method to handle the subscription trial ending.
        // handleSubscriptionTrialEnding(subscription);
        break;
      case 'customer.subscription.deleted':
        subscription = event.data.object;
        status = subscription.status;
        console.log(`Subscription status is ${status}.`);
        // Then define and call a method to handle the subscription deleted.
        // handleSubscriptionDeleted(subscriptionDeleted);
        break;
      case 'customer.subscription.created':
        subscription = event.data.object;
        status = subscription.status;
        console.log(`Subscription status is ${status}.`);
        // Then define and call a method to handle the subscription created.
        // handleSubscriptionCreated(subscription);
        break;
      case 'customer.subscription.updated':
        subscription = event.data.object;
        status = subscription.status;
        console.log(`Subscription status is ${status}.`);
        // Then define and call a method to handle the subscription update.
        // handleSubscriptionUpdated(subscription);
        break;
      default:
        // Unexpected event type
        console.log(`Unhandled event type ${event.type}.`);
    }
    // Return a 200 response to acknowledge receipt of the event
    ctx.status = 200;
    return ctx;
  }
);

router.post('/create-customer-portal-session', KoaBody(), async (ctx) => {
  // Authenticate your user.
  const customerId = ctx.request.body.customerId;
  const session = await stripe.billingPortal.sessions.create({
    customer: 'cus_LtxEWaUUNgoqS7',
    return_url: YOUR_DOMAIN,
  });
  ctx.body = { redirectUrl: session.url };
  ctx.status = 200;
});

module.exports = router;