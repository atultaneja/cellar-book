import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { levelMeta } from "@/lib/levels";

export const dynamic = "force-dynamic";

// Triggered by Vercel Cron every Monday (see vercel.json).
// Emails the restock list. Vercel automatically sends the CRON_SECRET as a
// Bearer token, so we reject anything else.
export async function GET(request: Request) {
  const auth = request.headers.get("authorization");
  if (process.env.CRON_SECRET && auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data: low, error } = await supabase
    .from("bottles")
    .select("name, category, level")
    .lte("level", 1)
    .order("level", { ascending: true })
    .order("category", { ascending: true });

  if (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }

  const items = low ?? [];
  if (items.length === 0) {
    // Nothing to restock — send nothing, report quietly.
    return NextResponse.json({ ok: true, sent: false, reason: "well stocked" });
  }

  const rows = items
    .map(
      (b) =>
        `<tr>
           <td style="padding:6px 10px;border-bottom:1px solid #E7DBBE;">${escape(b.name)}</td>
           <td style="padding:6px 10px;border-bottom:1px solid #E7DBBE;color:#5A4E3D;">${escape(b.category)}</td>
           <td style="padding:6px 10px;border-bottom:1px solid #E7DBBE;color:${
             b.level === 0 ? "#6E1F1B" : "#8A6D34"
           };">${escape(levelMeta(b.level).label)}</td>
         </tr>`
    )
    .join("");

  const html = `
  <div style="font-family:Georgia,'Times New Roman',serif;background:#F4ECD8;padding:28px;color:#2B2118;">
    <div style="max-width:520px;margin:0 auto;background:#FBF6E9;border:1px solid rgba(176,141,70,0.35);border-radius:10px;overflow:hidden;">
      <div style="background:#14432A;color:#F4ECD8;padding:20px 24px;">
        <div style="font-size:12px;letter-spacing:2px;text-transform:uppercase;color:#C9A85E;">The Cellar Book</div>
        <div style="font-size:22px;font-weight:bold;">This Week's Restock List</div>
      </div>
      <div style="padding:22px 24px;">
        <p style="margin:0 0 14px;color:#5A4E3D;">Good morning. The following want replenishing:</p>
        <table style="width:100%;border-collapse:collapse;font-size:15px;">
          <thead>
            <tr style="text-align:left;color:#14432A;font-size:12px;text-transform:uppercase;letter-spacing:1px;">
              <th style="padding:6px 10px;">Bottle</th>
              <th style="padding:6px 10px;">Category</th>
              <th style="padding:6px 10px;">Level</th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
        <p style="margin:18px 0 0;font-size:13px;color:#5A4E3D;">${items.length} item(s) to restock. Cheers.</p>
      </div>
    </div>
  </div>`;

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: process.env.RESTOCK_EMAIL_FROM,
      to: [process.env.RESTOCK_EMAIL_TO],
      subject: `Restock list — ${items.length} bottle(s) running low`,
      html,
    }),
  });

  if (!res.ok) {
    const detail = await res.text();
    return NextResponse.json({ ok: false, error: "email failed", detail }, { status: 502 });
  }

  return NextResponse.json({ ok: true, sent: true, count: items.length });
}

function escape(s: string) {
  return s.replace(/[&<>"]/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c] as string
  );
}
