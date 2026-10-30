import type { Booking, BookingRoomLine, Hotel, Locale } from "@/types/dto";

export function printAllBookingInvoices(bookings: Booking[], hotel?: Hotel | null, currency?: string, locale?: Locale) {
  const loc = locale ?? "fr";
  const fr = loc.toLowerCase().startsWith("fr");
  const w = window.open("", "_blank", "width=900,height=700");
  if (!w) return;
  const money = (v: number) => new Intl.NumberFormat(loc, { style: "currency", currency: currency || "XOF" }).format(v / 100);
  const sections = bookings
    .map((booking: Booking) => {
      const guestName =
        booking.guest?.full_name ?? (booking.guest ? `${booking.guest.first_name} ${booking.guest.last_name}` : `#${booking.guest_id}`);
      const rooms = (booking.rooms ?? [])
        .map(
            (l: BookingRoomLine) =>
            `<tr><td>${l.room?.room_number ?? "#" + l.room_id}</td><td>${l.nights ?? ""}</td><td>${money(l.nightly_rate_cents)}</td><td style="text-align:right">${money(l.line_total_cents)}</td></tr>`,
        )
        .join("");
      return `<div class="page">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;">
          <div style="font-weight:700;">${hotel?.logo_url ? `<img src="${hotel.logo_url}" style="max-height:60px;object-fit:contain;" /><br/>` : ""}${hotel?.name ?? ""}</div>
          <div style="text-align:right;"><h1 style="margin:0;font-size:20px;">${fr ? "Facture" : "Invoice"}</h1><div style="color:#666;font-size:12px;">${booking.booking_number}</div></div>
        </div>
        <div style="margin-bottom:12px;">
          <strong>${fr ? "Client" : "Guest"}:</strong> ${guestName}<br/>
          ${booking.guest?.email ? booking.guest.email + "<br/>" : ""}
          ${booking.guest?.phone ? booking.guest.phone + "<br/>" : ""}
          <strong>${fr ? "Sejour" : "Stay"}:</strong> ${booking.check_in} to ${booking.check_out}
        </div>
        <table style="width:100%;border-collapse:collapse;margin:12px 0;">
          <thead><tr><th style="border:1px solid #ddd;padding:8px;background:#f3f4f6;text-align:left;">${fr ? "Chambre" : "Room"}</th><th style="border:1px solid #ddd;padding:8px;background:#f3f4f6;text-align:left;">${fr ? "Nuits" : "Nights"}</th><th style="border:1px solid #ddd;padding:8px;background:#f3f4f6;text-align:left;">${fr ? "Tarif" : "Rate"}</th><th style="border:1px solid #ddd;padding:8px;background:#f3f4f6;text-align:right;">${fr ? "Total" : "Total"}</th></tr></thead>
          <tbody>${rooms || '<tr><td colspan="4" style="border:1px solid #ddd;padding:8px;">-</td></tr>'}</tbody>
        </table>
        <table style="width:auto;margin-left:auto;">
          <tr><td style="padding:2px 8px;">${fr ? "Sous-total" : "Subtotal"}</td><td style="padding:2px 8px;text-align:right;">${money(booking.subtotal_cents)}</td></tr>
          <tr><td style="padding:2px 8px;">${fr ? "Taxe" : "Tax"}</td><td style="padding:2px 8px;text-align:right;">${money(booking.tax_cents)}</td></tr>
          <tr><td style="padding:2px 8px;">${fr ? "Remise" : "Discount"}</td><td style="padding:2px 8px;text-align:right;">-${money(booking.discount_cents)}</td></tr>
          <tr><td style="padding:2px 8px;font-weight:bold;">${fr ? "Total" : "Total"}</td><td style="padding:2px 8px;text-align:right;font-weight:bold;">${money(booking.total_cents)}</td></tr>
          <tr><td style="padding:2px 8px;">${fr ? "Paye" : "Paid"}</td><td style="padding:2px 8px;text-align:right;">${money(booking.paid_cents)}</td></tr>
          <tr><td style="padding:2px 8px;">${fr ? "Reste du" : "Balance due"}</td><td style="padding:2px 8px;text-align:right;">${money(booking.balance_due_cents)}</td></tr>
        </table>
      </div>`;
    })
    .join("");
  const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${fr ? "Factures" : "Invoices"}</title><style>body{font-family:Arial,sans-serif;margin:24px;color:#111;}.page{page-break-after:always;margin-bottom:24px;}@media print{.page{page-break-after:always;}}</style></head><body>${sections}</body></html>`;
  w.document.write(html);
  w.document.close();
  w.focus();
  setTimeout(() => {
    w.print();
    w.close();
  }, 300);
}