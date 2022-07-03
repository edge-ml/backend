const Router = require('koa-router');
const KoaBody = require('koa-body');

const controller = require('../../controller/payment');
const stripe = require('stripe')('sk_test_51L7KlPAI18ryOlAQVK2aeFJDxgLJ4I2LQXrTjyaZ1b5z1WK9fx5CoCDtpcqXzXXBUEbgJ1fzSinKMm25mvW09MBX00UmHwIuGO')

const router = new Router();

const YOUR_DOMAIN = 'http://localhost:3000';

const proProductId = 'prod_LsmoNI2tskuI3R';
const proPriceId = 'price_1LB1EoAI18ryOlAQ3r3GktSV';
const proPlusProductId = 'prod_Loys2WqALki7gR';
const proPlusPriceId = 'price_1L7KuJAI18ryOlAQr9RuO7As';

// TODO double check status codes
// TODO move this section to auth server to increase security
// current design allows imitation of customerId and act as another customer

router.get('/products', async (ctx) => {
  await controller.getProducts(ctx);
})


router.post('/create-checkout-session', KoaBody(), async (ctx) => {
  const priceId = ctx.request.body.priceId;
  const customerId = ctx.request.body.customerId;
  const session = await stripe.checkout.sessions.create({
    line_items: [
      {
        price: priceId,
        quantity: 1,
      },
    ],
    mode: 'subscription',
    success_url: `${YOUR_DOMAIN}?success=true`,
    cancel_url: `${YOUR_DOMAIN}?canceled=true`,
    customer: customerId,
  });
  ctx.body = { redirectUrl: session.url }
  ctx.status = 200;
  return ctx;
})

router.post('/create-customer-portal-session', KoaBody(), async (ctx) => {
  // Authenticate your user.
  // TODO move to auth 
  const configuration = await stripe.billingPortal.configurations.create({
    features: {
      customer_update: {
        enabled: false,
      },
      invoice_history: { enabled: true },
      payment_method_update: { enabled: true },
      subscription_cancel: {
        enabled: true,
        mode: 'at_period_end',
        cancellation_reason: {
          enabled: true,
          options: [
            'too_expensive', 
            'missing_features', 
            'switched_service', 
            'unused', 
            'customer_service', 
            'too_complex', 
            'low_quality', 
            'other'
          ]
        },
      },
      subscription_pause: { enabled: false },
    },
    business_profile: {
      privacy_policy_url: YOUR_DOMAIN,
      terms_of_service_url: YOUR_DOMAIN,
    }
  })
  console.log('hey');
  console.log(configuration);
  const customerId = ctx.request.body.customerId;
  console.log(customerId);
  const session = await stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: YOUR_DOMAIN,
    configuration: configuration.id,
  });
  ctx.body = { redirectUrl: session.url };
  ctx.status = 200;
});

module.exports = router;