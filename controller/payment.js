const stripe = require('stripe')('sk_test_51L7KlPAI18ryOlAQVK2aeFJDxgLJ4I2LQXrTjyaZ1b5z1WK9fx5CoCDtpcqXzXXBUEbgJ1fzSinKMm25mvW09MBX00UmHwIuGO')
const YOUR_DOMAIN = 'http://localhost:3000';

async function createCheckoutSession(ctx) {
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
}

async function getProducts(ctx) {
    const productList = await stripe.products.list({ active: true });
    const products = productList.data.map(p => ({
        priceId: p.default_price,
        details: p.metadata // pricing manually put in metadata, may conflict with actual price if not updated accordingly
    }))
    ctx.body = products;
    ctx.status = 200;
    return ctx;
}

module.exports = {
    createCheckoutSession,
    getProducts
};
