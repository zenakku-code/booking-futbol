
import MercadoPagoConfig, { Preference, Payment } from 'mercadopago';

// Initialize the client
const client = new MercadoPagoConfig({
    accessToken: process.env.MP_ACCESS_TOKEN || ''
});

// Export initialized resources
export const preference = new Preference(client);
export const payment = new Payment(client);
export default client;
