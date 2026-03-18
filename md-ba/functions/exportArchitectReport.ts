import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import { jsPDF } from 'npm:jspdf@4.0.0';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { format: exportFormat } = await req.json();

        // Get architect profile
        const architects = await base44.entities.ArchitectProfile.filter({ user_email: user.email });
        if (architects.length === 0) {
            return Response.json({ error: 'Architect profile not found' }, { status: 404 });
        }
        const architect = architects[0];

        // Get invoices
        const invoices = await base44.entities.Invoice.filter({ architect_email: user.email });

        if (exportFormat === 'pdf') {
            const doc = new jsPDF();
            
            // Header
            doc.setFontSize(20);
            doc.text('Architect Report', 20, 20);
            doc.setFontSize(10);
            doc.text(`Name: ${architect.full_name}`, 20, 30);
            doc.text(`Email: ${user.email}`, 20, 35);
            doc.text(`Generated: ${new Date().toLocaleDateString()}`, 20, 40);

            // Stats
            doc.setFontSize(12);
            doc.text('Summary', 20, 55);
            doc.setFontSize(10);
            doc.text(`Total Invoices: ${invoices.length}`, 20, 65);
            doc.text(`Card Balance: ${architect.card_balance} ILS`, 20, 70);
            doc.text(`Trust Level: ${architect.trust_level}`, 20, 75);

            // Table header
            doc.setFontSize(10);
            doc.text('Invoice', 20, 90);
            doc.text('Supplier', 70, 90);
            doc.text('Amount', 120, 90);
            doc.text('Status', 160, 90);

            // Invoices
            let y = 100;
            invoices.slice(0, 30).forEach((inv) => {
                if (y > 270) {
                    doc.addPage();
                    y = 20;
                }
                doc.text(inv.invoice_number || '-', 20, y);
                doc.text((inv.supplier_name || 'Unknown').substring(0, 20), 70, y);
                doc.text(`${inv.amount} ILS`, 120, y);
                doc.text(inv.status.substring(0, 15), 160, y);
                y += 8;
            });

            const pdfBytes = doc.output('arraybuffer');
            return new Response(pdfBytes, {
                status: 200,
                headers: {
                    'Content-Type': 'application/pdf',
                    'Content-Disposition': `attachment; filename=architect-report-${Date.now()}.pdf`
                }
            });
        } else if (exportFormat === 'csv') {
            const headers = ['Invoice Number', 'Supplier', 'Amount', 'Reward', 'Status', 'Created Date'];
            const rows = invoices.map(inv => [
                inv.invoice_number || '',
                inv.supplier_name || '',
                inv.amount || 0,
                inv.reward_amount || 0,
                inv.status || '',
                inv.created_date || ''
            ]);

            let csv = headers.join(',') + '\n';
            rows.forEach(row => {
                csv += row.map(cell => `"${cell}"`).join(',') + '\n';
            });

            return new Response(csv, {
                status: 200,
                headers: {
                    'Content-Type': 'text/csv',
                    'Content-Disposition': `attachment; filename=architect-report-${Date.now()}.csv`
                }
            });
        }

        return Response.json({ error: 'Invalid format' }, { status: 400 });
    } catch (error) {
        return Response.json({ error: error.message }, { status: 500 });
    }
});