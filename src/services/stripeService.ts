const Stripe = require('stripe');

const stripe = Stripe(process.env.STRIPE_SECRET_KEY);
const url = 'https://api.stripe.com';

const createCustomer = async ({ email, name, phone }): Promise<{ [key: string]: any }> => {
  const customer = await stripe.customers.create({
    email,
    name,
    phone
  });

  return customer;
}

export default {
  createCustomer
}
