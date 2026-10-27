import { formatDate } from "@/lib/format";

export function printDailyList(title: string, bookings: any[], locale?: string) {
  const loc = locale ?? "fr";
  const fr = loc.toLowerCase().startsWith("fr");
  const w = window.open("", "_blank", "width=900,height=700");
  if (!w) return;
  const rows = bookings
    .map(
      (b: any) =>
        `<tr><td>${b.booking_number}</td><td>${b.guest?.full_name ?? (b.guest ? b.guest.first_name + " " + b.guest.last_name : "#" + b.guest_id)}</td><td>${b.rooms?.map((r: any) => r.room?.room_number).join(", ") ?? "—"}</td><td>${formatDate(b.check_in, loc)}</td><td>${formatDate(b.check_out, loc)}</td></tr>`,
    )
    .join("");
  const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${title}</title>
<style>
body{font-family:Arial,sans-serif;margin:24px;color:#111;}
h1{margin:0 0 12px;font-size:20px;}
table{width:100%;border-collapse:collapse;margin:12px 0;}
th,td{border:1px solid #ddd;padding:8px;font-size:13px;}
th{background:#f3f4f6;text-align:left;}
.muted{color:#666;font-size:12px;}
</style></head><body>
<h1>${title}</h1>
<div class="muted">${new Date().toLocaleString(loc)}</div>
<table>
  <thead><tr><th>${fr ? "N°" : "No."}</th><th>${fr ? "Client" : "Guest"}</th><th>${fr ? "Chambres" : "Rooms"}</th><th>${fr ? "Arrivée" : "Check-in"}</th><th>${fr ? "Départ" : "Check-out"}</th></tr></thead>
  <tbody>${rows || `<tr><td colspan="5">${fr ? "Aucune" : "None"}</td></tr>`}</tbody>
</table>
</body></html>`;
  w.document.write(html);
  w.document.close();
  w.focus();
  setTimeout(() => {
    w.print();
    w.close();
  }, 300);
}