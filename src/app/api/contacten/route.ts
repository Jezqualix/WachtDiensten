import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { isValidPhone, sanitize } from "@/lib/validators";

// GET: alle contacten ophalen
export async function GET() {
  try {
    const pool = await getDb();
    const result = await pool.request().query(
      "SELECT * FROM Contacten ORDER BY Naam"
    );
    return NextResponse.json(result.recordset);
  } catch (error) {
    console.error("GET /api/contacten error:", error);
    return NextResponse.json({ error: "Database fout" }, { status: 500 });
  }
}

// POST: nieuw contact aanmaken
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const naam = sanitize(body.Naam || "");
    const telefoon = (body.Telefoonnummer || "").replace(/\s/g, "");
    const opmerkingen = sanitize(body.Opmerkingen || "");

    if (!naam) {
      return NextResponse.json({ error: "Naam is verplicht" }, { status: 400 });
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
      .input("Naam", naam)
      .input("Telefoonnummer", telefoon)
      .input("Opmerkingen", opmerkingen)
      .query(
        "INSERT INTO Contacten (Naam, Telefoonnummer, Opmerkingen) VALUES (@Naam, @Telefoonnummer, @Opmerkingen)"
      );

    return NextResponse.json({ success: true }, { status: 201 });
  } catch (error) {
    console.error("POST /api/contacten error:", error);
    return NextResponse.json({ error: "Database fout" }, { status: 500 });
  }
}

// PUT: contact bijwerken
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const id = body.ID;
    const naam = sanitize(body.Naam || "");
    const telefoon = (body.Telefoonnummer || "").replace(/\s/g, "");
    const opmerkingen = sanitize(body.Opmerkingen || "");

    if (!id) {
      return NextResponse.json({ error: "ID is verplicht" }, { status: 400 });
    }
    if (!naam) {
      return NextResponse.json({ error: "Naam is verplicht" }, { status: 400 });
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
      .input("Naam", naam)
      .input("Telefoonnummer", telefoon)
      .input("Opmerkingen", opmerkingen)
      .query(
        "UPDATE Contacten SET Naam = @Naam, Telefoonnummer = @Telefoonnummer, Opmerkingen = @Opmerkingen WHERE ID = @ID"
      );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("PUT /api/contacten error:", error);
    return NextResponse.json({ error: "Database fout" }, { status: 500 });
  }
}

// DELETE: contact verwijderen
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
      .query("DELETE FROM Contacten WHERE ID = @ID");

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/contacten error:", error);
    return NextResponse.json({ error: "Database fout" }, { status: 500 });
  }
}
