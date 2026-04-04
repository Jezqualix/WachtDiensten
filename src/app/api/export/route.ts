import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";

export async function GET() {
  try {
    const pool = await getDb();
    const result = await pool.request().query(`
      SELECT StartDatum, Telefoonnummer, DienstType
      FROM Wachtdiensten
      ORDER BY StartDatum, DienstType
    `);

    const header = "Date, Phone Number, Group";
    const rows = result.recordset.map((r) => {
      const d = new Date(r.StartDatum);
      const jaar = d.getFullYear();
      const maand = String(d.getMonth() + 1).padStart(2, "0");
      const dag = String(d.getDate()).padStart(2, "0");
      const datum = `${jaar}-${maand}-${dag}`;

      const group =
        r.DienstType === "App"
          ? "Wachtdienst DockxApp"
          : "Wachtdienst Garage";

      return `${datum}, ${r.Telefoonnummer}, ${group}`;
    });

    const csv = [header, ...rows].join("\n") + "\n";

    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": 'attachment; filename="test.csv"',
      },
    });
  } catch (error) {
    console.error("GET /api/export error:", error);
    return NextResponse.json({ error: "Export mislukt" }, { status: 500 });
  }
}
