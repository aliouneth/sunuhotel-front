import { formatDate } from "@/lib/format";
import type { Booking, BookingRoomLine, Hotel, Locale, Payment } from "@/types/dto";

export function printBookingInvoice(booking: Booking, hotel?: Hotel | null, currency?: string, locale?: Locale) {
  const loc = locale ?? "fr";
  const fr = loc.toLowerCase().startsWith("fr");
  const L = fr
    ? {
        invoice: "Facture",
        guest: "Client",
        stay: "Séjour",
        room: "Chambre",
        nights: "Nuits",
        rate: "Tarif",
        total: "Total",
        subtotal: "Sous-total",
        tax: "Taxe",
        discount: "Remise",
        paid: "Payé",
        balanceDue: "Reste dû",
        payments: "Paiements",
        method: "Méthode",
        status: "Statut",
        amount: "Montant",
        generated: "Généré le",
      }
    : {
        invoice: "Invoice",
        guest: "Guest",
        stay: "Stay",
        room: "Room",
        nights: "Nights",
        rate: "Rate",
        total: "Total",
        subtotal: "Subtotal",
        tax: "Tax",
        discount: "Discount",
        paid: "Paid",
        balanceDue: "Balance due",
        payments: "Payments",
        method: "Method",
        status: "Status",
        amount: "Amount",
        generated: "Generated",
      };

  const w = window.open("", "_blank", "width=900,height=700");
  if (!w) return;
  const logo = hotel?.logo_url ? `<img src="${hotel.logo_url}" alt="" style="max-height:60px;object-fit:contain;" />` : "";
  const guestName =
    booking.guest?.full_name ?? (booking.guest ? `${booking.guest.first_name} ${booking.guest.last_name}` : `#${booking.guest_id}`);
  const money = (v: number) => new Intl.NumberFormat(loc, { style: "currency", currency: currency || "XOF" }).format(v / 100);
  const rooms = (booking.rooms ?? [])
    .map(
      (l: BookingRoomLine) =>
        `<tr><td>${l.room?.room_number ?? "#" + l.room_id}</td><td>${l.nights ?? ""}</td><td>${money(l.nightly_rate_cents)}</td><td style="text-align:right">${money(l.line_total_cents)}</td></tr>`,
    )
    .join("");
  const payments = (booking.payments ?? [])
    .map(
      (p: Payment) =>
        `<tr><td>${(p.notes ?? "").toLowerCase().includes("paydunya") ? "PayDunya" : p.method}</td><td>${p.status}</td><td style="text-align:right">${money(p.amount_cents)}</td></tr>`,
    )
    .join("");
  const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${L.invoice} ${booking.booking_number}</title>
<style>
body{font-family:Arial,sans-serif;margin:24px;color:#111;}
.header{display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;}
h1{margin:0;font-size:20px;}
table{width:100%;border-collapse:collapse;margin:12px 0;}
th,td{border:1px solid #ddd;padding:8px;font-size:13px;}
th{background:#f3f4f6;text-align:left;}
.totals{width:auto;margin-left:auto;}
.totals td{border:none;padding:2px 8px;}
.right{text-align:right;}
.muted{color:#666;font-size:12px;}
</style></head><body>
<div class="header">
  <div>${logo}<div style="font-weight:700;margin-top:4px;">${hotel?.name ?? ""}</div></div>
  <div style="text-align:right;"><h1>${L.invoice}</h1><div class="muted">${booking.booking_number}</div></div>
</div>
<div style="margin-bottom:12px;">
  <strong>${L.guest}:</strong> ${guestName}<br/>
  ${booking.guest?.email ? booking.guest.email + "<br/>" : ""}
  ${booking.guest?.phone ? booking.guest.phone + "<br/>" : ""}
  <strong>${L.stay}:</strong> ${formatDate(booking.check_in, loc)} to ${formatDate(booking.check_out, loc)}
</div>
<table>
  <thead><tr><th>${L.room}</th><th>${L.nights}</th><th>${L.rate}</th><th class="right">${L.total}</th></tr></thead>
  <tbody>${rooms || '<tr><td colspan="4">-</td></tr>'}</tbody>
</table>
<table class="totals">
  <tr><td>${L.subtotal}</td><td class="right">${money(booking.subtotal_cents)}</td></tr>
  <tr><td>${L.tax}</td><td class="right">${money(booking.tax_cents)}</td></tr>
  <tr><td>${L.discount}</td><td class="right">-${money(booking.discount_cents)}</td></tr>
  <tr><td><strong>${L.total}</strong></td><td class="right"><strong>${money(booking.total_cents)}</strong></td></tr>
  <tr><td>${L.paid}</td><td class="right">${money(booking.paid_cents)}</td></tr>
  <tr><td>${L.balanceDue}</td><td class="right">${money(booking.balance_due_cents)}</td></tr>
</table>
${payments ? `<h3>${L.payments}</h3><table><thead><tr><th>${L.method}</th><th>${L.status}</th><th class="right">${L.amount}</th></tr></thead><tbody>${payments}</tbody></table>` : ""}
<div class="muted" style="margin-top:16px;">${L.generated} ${new Date().toLocaleString(loc)}</div>
</body></html>`;
  w.document.write(html);
  w.document.close();
  w.focus();
  setTimeout(() => {
    w.print();
    w.close();
  }, 300);
}