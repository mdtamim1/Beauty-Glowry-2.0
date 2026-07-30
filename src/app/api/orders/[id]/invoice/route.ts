import { NextResponse } from 'next/server';
import { prisma } from '../../../../../lib/prisma';
import { jsPDF } from 'jspdf';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const order = await prisma.order.findUnique({
      where: { id: id },
      include: {
        address: true,
        user: true,
        items: {
          include: {
            product_variant: {
              include: {
                product: true,
              },
            },
          },
        },
      },
    });

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });

    // Page margin
    const margin = 20;
    let y = 24;

    // --- Header ---
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(22);
    doc.setTextColor(44, 53, 36); // var(--sage-dark) tone: deep olive/forest green
    doc.text('BEAUTY GLOWRY', margin, y);
    
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(120, 120, 120);
    doc.text('Clinical Skincare & Esthetics', margin, y + 5);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(44, 44, 44);
    doc.text('INVOICE', 190 - margin, y, { align: 'right' });

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text(`Invoice No: ${order.order_number}`, 190 - margin, y + 5, { align: 'right' });
    doc.text(`Date: ${new Date(order.created_at).toLocaleDateString()}`, 190 - margin, y + 10, { align: 'right' });

    y += 22;

    // Divider Line
    doc.setDrawColor(210, 210, 210);
    doc.setLineWidth(0.5);
    doc.line(margin, y, 210 - margin, y);

    y += 12;

    // --- Billing Info ---
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(44, 53, 36);
    doc.text('Billed To:', margin, y);
    doc.text('Delivery Info:', 110, y);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(80, 80, 80);
    
    // Customer Info
    y += 6;
    doc.text(`Name: ${order.user?.name || order.address.label}`, margin, y);
    doc.text(`Courier: ${order.courier || 'Pending'}`, 110, y);

    y += 5;
    doc.text(`Email: ${order.user?.email || '—'}`, margin, y);
    doc.text(`Sub-district: ${order.thana || '—'}`, 110, y);

    y += 5;
    doc.text(`Phone: ${order.user?.phone || '—'}`, margin, y);
    doc.text(`District: ${order.address.city}`, 110, y);

    y += 5;
    doc.text(`Address: ${order.address.address_line}`, margin, y, { maxWidth: 80 });

    y += 15;

    // --- Table Headers ---
    doc.setFillColor(245, 243, 238); // var(--cream) shade
    doc.rect(margin, y, 210 - margin * 2, 8, 'F');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(44, 53, 36);
    doc.text('Item Description', margin + 4, y + 5.5);
    doc.text('SKU', margin + 70, y + 5.5);
    doc.text('Price', margin + 110, y + 5.5, { align: 'right' });
    doc.text('Qty', margin + 135, y + 5.5, { align: 'right' });
    doc.text('Total', margin + 166, y + 5.5, { align: 'right' });

    y += 8;

    // --- Table Rows ---
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(60, 60, 60);

    order.items.forEach((item) => {
      const name = item.product_variant.product.name;
      const sku = item.product_variant.sku;
      const price = Number(item.price_at_purchase);
      const qty = item.quantity;
      const lineTotal = price * qty;

      y += 8;
      // Description (wrapped)
      doc.text(name, margin + 4, y, { maxWidth: 62 });
      doc.text(sku, margin + 70, y);
      doc.text(`৳${price.toLocaleString()}`, margin + 110, y, { align: 'right' });
      doc.text(String(qty), margin + 135, y, { align: 'right' });
      doc.text(`৳${lineTotal.toLocaleString()}`, margin + 166, y, { align: 'right' });

      // Draw bottom row line
      doc.setDrawColor(240, 240, 240);
      doc.line(margin, y + 3, 210 - margin, y + 3);
      y += 3;
    });

    y += 12;

    // --- Summary Calculations ---
    const subtotal = Number(order.subtotal);
    const shipping = Number(order.shipping_fee);
    const discount = Number(order.discount);
    const total = Number(order.total);

    const summaryX = 140;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(100, 100, 100);

    doc.text('Subtotal:', summaryX, y);
    doc.text(`৳${subtotal.toLocaleString()}`, margin + 166, y, { align: 'right' });

    y += 6;
    doc.text('Shipping Fee:', summaryX, y);
    doc.text(shipping === 0 ? 'FREE' : `৳${shipping.toLocaleString()}`, margin + 166, y, { align: 'right' });

    if (discount > 0) {
      y += 6;
      doc.text('Discount:', summaryX, y);
      doc.text(`−৳${discount.toLocaleString()}`, margin + 166, y, { align: 'right' });
    }

    y += 8;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(44, 53, 36);
    doc.text('Grand Total:', summaryX, y);
    doc.text(`৳${total.toLocaleString()}`, margin + 166, y, { align: 'right' });

    y += 24;

    // --- Payment Info ---
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(44, 53, 36);
    doc.text('Payment Details:', margin, y);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(100, 100, 100);
    y += 5;
    doc.text(`Method: ${order.payment_method.toUpperCase()}`, margin, y);
    y += 4;
    doc.text(`Status: ${order.payment_status.toUpperCase()}`, margin, y);

    // --- Footer Message ---
    y = 275;
    doc.setDrawColor(220, 220, 220);
    doc.line(margin, y, 210 - margin, y);

    y += 6;
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(8);
    doc.setTextColor(140, 140, 140);
    doc.text('Thank you for choosing clinical excellence with Beauty Glowry.', 105, y, { align: 'center' });
    doc.text('For queries or support, reach out to support@beautygloowry.com', 105, y + 4, { align: 'center' });

    const pdfBuffer = Buffer.from(doc.output('arraybuffer'));

    return new Response(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="Invoice-${order.order_number}.pdf"`,
      },
    });
  } catch (error: any) {
    console.error('Invoice generation error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
