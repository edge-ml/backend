const Router = require('koa-router');
const KoaBody = require('koa-body');

const controller = require('../../controller/payment');
const stripe = require('stripe')('sk_test_51L7KlPAI18ryOlAQVK2aeFJDxgLJ4I2LQXrTjyaZ1b5z1WK9fx5CoCDtpcqXzXXBUEbgJ1fzSinKMm25mvW09MBX00UmHwIuGO')

const router = new Router();

const YOUR_DOMAIN = 'http://localhost:3000';

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
  const customerId = ctx.request.body.customerId;
  console.log(customerId);
  const session = await stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: YOUR_DOMAIN,
  });
  ctx.body = { redirectUrl: session.url };
  ctx.status = 200;
});

module.exports = router;