
require('dotenv').config();
const { MercadoPagoConfig, Preference } = require('mercadopago');

async function testConnection() {
    console.log('Testing MercadoPago Connection...');
    const token = process.env.MP_ACCESS_TOKEN;

    if (!token) {
        console.error('❌ Error: MP_ACCESS_TOKEN is missing in .env');
        process.exit(1);
    }

    console.log(`Token found (length: ${token.length})`);

    const client = new MercadoPagoConfig({ accessToken: token });
    const preference = new Preference(client);

    try {
        const result = await preference.create({
            body: {
                items: [
                    {
                        id: 'test_item',
                        title: 'Test Integration Connection',
                        quantity: 1,
                        unit_price: 10,
                        currency_id: 'ARS'
                    }
                ],
                back_urls: {
                    success: 'https://www.google.com',
                    failure: 'https://www.google.com',
                    pending: 'https://www.google.com'
                },
                auto_return: 'approved'
            }
        });

        if (result.init_point) {
            console.log('✅ Success! Preference created.');
            console.log('Init Point:', result.init_point);
            console.log('Sandbox Init Point:', result.sandbox_init_point);
        } else {
            console.error('⚠️ Warning: No init_point returned.', result);
        }

    } catch (error) {
        console.error('❌ Connection Failed:', error.message);
        if (error.cause) console.error('Cause:', error.cause);
    }
}

testConnection();
