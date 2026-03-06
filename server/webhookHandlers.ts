import { getStripeSync, getUncachableStripeClient } from './stripeClient';
import { storage } from './storage';

export class WebhookHandlers {
  static async processWebhook(payload: Buffer, signature: string): Promise<void> {
    if (!Buffer.isBuffer(payload)) {
      throw new Error(
        'STRIPE WEBHOOK ERROR: Payload must be a Buffer. ' +
        'Received type: ' + typeof payload + '. ' +
        'FIX: Ensure webhook route is registered BEFORE app.use(express.json()).'
      );
    }

    const stripe = await getUncachableStripeClient();
    const sync = await getStripeSync();
    const webhookSecret = sync.webhookSecret;

    let event;
    try {
      if (webhookSecret) {
        event = stripe.webhooks.constructEvent(payload, signature, webhookSecret);
      }
    } catch {
      // Fall through to sync processing
    }

    if (event && event.type === 'checkout.session.completed') {
      const session = event.data.object as any;
      if (session.payment_status === 'paid' && session.metadata?.auditId) {
        const auditId = parseInt(session.metadata.auditId);
        const audit = await storage.getAudit(auditId);
        if (audit && audit.stripeSessionId === session.id) {
          await storage.updateAudit(auditId, { paid: true });
          console.log(`Webhook: Audit ${auditId} marked as paid via webhook`);
        }
      }
    }

    await sync.processWebhook(payload, signature);
  }
}
