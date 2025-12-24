import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import Stripe from 'https://esm.sh/stripe@14.16.0?target=deno';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') ?? '', {
    apiVersion: '2023-10-16',
    httpClient: Stripe.createFetchHttpClient(),
});

Deno.serve(async (req) => {
    const signature = req.headers.get('stripe-signature');

    try {
        if (!signature) throw new Error('No signature');

        const body = await req.text();
        const event = await stripe.webhooks.constructEventAsync(
            body,
            signature,
            Deno.env.get('STRIPE_WEBHOOK_SECRET') ?? ''
        );

        const supabase = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        );

        if (event.type === 'checkout.session.completed') {
            const session = event.data.object;
            const customerId = session.customer as string;
            const subscriptionId = session.subscription as string;

            // Get plan type from the subscription/session metadata or price
            // Simplified: Fetch subscription to get plan details
            const subscription = await stripe.subscriptions.retrieve(subscriptionId);
            const priceId = subscription.items.data[0].price.id;

            // Reverse map or just use metadata
            let planType = 'trial';
            if (priceId === Deno.env.get('STRIPE_PRICE_BASIC')) planType = 'basic';
            if (priceId === Deno.env.get('STRIPE_PRICE_STANDARD')) planType = 'standard';
            if (priceId === Deno.env.get('STRIPE_PRICE_PRO')) planType = 'pro';

            await supabase
                .from('profiles')
                .update({
                    plan_type: planType,
                    subscription_ends_at: new Date(subscription.current_period_end * 1000).toISOString(),
                })
                .eq('stripe_customer_id', customerId);
        }

        return new Response(JSON.stringify({ received: true }), {
            headers: { 'Content-Type': 'application/json' },
            status: 200,
        });

    } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), {
            headers: { 'Content-Type': 'application/json' },
            status: 400,
        });
    }
});
