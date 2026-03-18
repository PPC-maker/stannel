import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Unauthorized - Admin only' }, { status: 403 });
    }

    const { invoice_id } = await req.json();

    // Get invoice
    const invoice = await base44.asServiceRole.entities.Invoice.get(invoice_id);
    if (!invoice || invoice.status !== 'card_credited') {
      return Response.json({ error: 'Invoice not valid for goal processing' }, { status: 400 });
    }

    // Get active goals for architect
    const goals = await base44.asServiceRole.entities.ArchitectGoal.filter({
      architect_email: invoice.architect_email,
      is_active: true
    });

    if (goals.length === 0) {
      return Response.json({ message: 'No active goals for this architect' });
    }

    for (const goal of goals) {
      // Check if invoice is in current period
      const invoiceDate = new Date(invoice.created_date);
      const periodStart = new Date(goal.current_period_start);
      const periodEnd = new Date(goal.current_period_end);

      if (invoiceDate >= periodStart && invoiceDate <= periodEnd) {
        // Update goal revenue
        const newRevenue = (goal.current_period_revenue || 0) + (invoice.amount || 0);
        const targetMet = newRevenue >= goal.target_amount;

        await base44.asServiceRole.entities.ArchitectGoal.update(goal.id, {
          current_period_revenue: newRevenue,
          target_met: targetMet
        });

        // If target just met, create bonus
        if (targetMet && !goal.target_met) {
          const bonusAmount = goal.target_amount * (goal.bonus_percentage / 100);
          
          const bonus = await base44.asServiceRole.entities.BonusTransaction.create({
            architect_email: invoice.architect_email,
            goal_id: goal.id,
            bonus_type: 'goal_achievement',
            amount: bonusAmount,
            period_start: goal.current_period_start,
            period_end: goal.current_period_end,
            status: 'credited',
            credited_date: new Date().toISOString(),
            description: `בונוס השגת יעד ${goal.period_type === 'monthly' ? 'חודשי' : 'רבעוני'} - ₪${goal.target_amount.toLocaleString()}`
          });

          // Update architect card balance
          const architects = await base44.asServiceRole.entities.ArchitectProfile.filter({
            user_email: invoice.architect_email
          });
          if (architects.length > 0) {
            await base44.asServiceRole.entities.ArchitectProfile.update(architects[0].id, {
              card_balance: (architects[0].card_balance || 0) + bonusAmount
            });
          }

          // Create card transaction
          await base44.asServiceRole.entities.CardTransaction.create({
            invoice_id: invoice.id,
            architect_email: invoice.architect_email,
            amount: bonusAmount,
            status: 'credited',
            processed_date: new Date().toISOString()
          });

          // Notification
          await base44.asServiceRole.entities.Notification.create({
            recipient_email: invoice.architect_email,
            title: '🎉 בונוס! השגת את היעד!',
            message: `קיבלת בונוס של ₪${bonusAmount.toLocaleString()} על השגת יעד ${goal.period_type === 'monthly' ? 'חודשי' : 'רבעוני'}!`,
            type: 'success'
          });

          // Audit
          await base44.asServiceRole.entities.AuditLog.create({
            action: 'bonus_awarded',
            entity_type: 'BonusTransaction',
            entity_id: bonus.id,
            performed_by: 'system',
            details: `Bonus ₪${bonusAmount} awarded to ${invoice.architect_email} for goal achievement`,
            timestamp: new Date().toISOString()
          });
        }
      }
    }

    return Response.json({ success: true, message: 'Goal processing completed' });
  } catch (error) {
    console.error('Error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});