import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { isValidPhone, isValidDienstType, sanitize } from "@/lib/validators";

// GET: alle wachtdiensten ophalen
export async function GET() {
  try {
    const pool = await getDb();
    const result = await pool.request().query(`
      SELECT w.*, c.Naam AS ContactNaam
      FROM Wachtdiensten w
      LEFT JOIN Contacten c ON w.Telefoonnummer = c.Telefoonnummer
      ORDER BY w.DienstType, w.StartDatum DESC
    `);
    return NextResponse.json(result.recordset);
  } catch (error) {
    console.error("GET /api/wachtdiensten error:", error);
    return NextResponse.json({ error: "Database fout" }, { status: 500 });
  }
}

// POST: nieuwe wachtdienst aanmaken
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const dienstType = body.DienstType || "";
    const startDatum = body.StartDatum || "";
    const telefoon = (body.Telefoonnummer || "").replace(/\s/g, "");
    const opmerkingen = sanitize(body.Opmerkingen || "");

    if (!isValidDienstType(dienstType)) {
      return NextResponse.json(
        { error: "DienstType moet 'Garage' of 'App' zijn" },
        { status: 400 }
      );
    }
    if (!startDatum) {
      return NextResponse.json(
        { error: "StartDatum is verplicht" },
        { status: 400 }
      );
    }
    if (!isValidPhone(telefoon)) {
      return NextResponse.json(
        { error: "Telefoonnummer moet beginnen met + en 10 of 11 cijfers bevatten" },
        { status: 400 }
      );
    }

    const pool = await getDb();
    await pool
      .request()
      .input("DienstType", dienstType)
      .input("StartDatum", new Date(startDatum))
      .input("Telefoonnummer", telefoon)
      .input("Opmerkingen", opmerkingen)
      .query(
        `INSERT INTO Wachtdiensten (DienstType, StartDatum, Telefoonnummer, Opmerkingen)
         VALUES (@DienstType, @StartDatum, @Telefoonnummer, @Opmerkingen)`
      );

    return NextResponse.json({ success: true }, { status: 201 });
  } catch (error) {
    console.error("POST /api/wachtdiensten error:", error);
    return NextResponse.json({ error: "Database fout" }, { status: 500 });
  }
}

// PUT: wachtdienst bijwerken
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const id = body.ID;
    const dienstType = body.DienstType || "";
    const startDatum = body.StartDatum || "";
    const telefoon = (body.Telefoonnummer || "").replace(/\s/g, "");
    const opmerkingen = sanitize(body.Opmerkingen || "");

    if (!id) {
      return NextResponse.json({ error: "ID is verplicht" }, { status: 400 });
    }
    if (!isValidDienstType(dienstType)) {
      return NextResponse.json(
        { error: "DienstType moet 'Garage' of 'App' zijn" },
        { status: 400 }
      );
    }
    if (!startDatum) {
      return NextResponse.json(
        { error: "StartDatum is verplicht" },
        { status: 400 }
      );
    }
    if (!isValidPhone(telefoon)) {
      return NextResponse.json(
        { error: "Telefoonnummer moet beginnen met + en 10 of 11 cijfers bevatten" },
        { status: 400 }
      );
    }

    const pool = await getDb();
    await pool
      .request()
      .input("ID", id)
      .input("DienstType", dienstType)
      .input("StartDatum", new Date(startDatum))
      .input("Telefoonnummer", telefoon)
      .input("Opmerkingen", opmerkingen)
      .query(
        `UPDATE Wachtdiensten
         SET DienstType = @DienstType, StartDatum = @StartDatum,
             Telefoonnummer = @Telefoonnummer, Opmerkingen = @Opmerkingen,
             LaatstGewijzigd = GETDATE()
         WHERE ID = @ID`
      );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("PUT /api/wachtdiensten error:", error);
    return NextResponse.json({ error: "Database fout" }, { status: 500 });
  }
}

// DELETE: wachtdienst verwijderen
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "ID is verplicht" }, { status: 400 });
    }

    const pool = await getDb();
    await pool
      .request()
      .input("ID", parseInt(id))
      .query("DELETE FROM Wachtdiensten WHERE ID = @ID");

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/wachtdiensten error:", error);
    return NextResponse.json({ error: "Database fout" }, { status: 500 });
  }
}
