import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { isValidPhone } from "@/lib/validators";

/**
 * Normaliseer datum naar yyyy-mm-dd.
 * Ondersteunt yyyy-mm-dd en dd-mm-yyyy, met - of / als scheidingsteken.
 * Geeft null bij ongeldige datum.
 */
function normaliseerDatum(raw: string): string | null {
  const delen = raw.trim().split(/[-/]/);
  if (delen.length !== 3) return null;

  let jaar: string, maand: string, dag: string;
  if (delen[0].length === 4) {
    // yyyy-mm-dd
    [jaar, maand, dag] = delen;
  } else if (delen[2].length === 4) {
    // dd-mm-yyyy
    [dag, maand, jaar] = delen;
  } else {
    return null;
  }

  const j = parseInt(jaar, 10);
  const m = parseInt(maand, 10);
  const d = parseInt(dag, 10);
  if (isNaN(j) || isNaN(m) || isNaN(d)) return null;
  if (m < 1 || m > 12 || d < 1 || d > 31) return null;

  const mm = String(m).padStart(2, "0");
  const dd = String(d).padStart(2, "0");
  return `${j}-${mm}-${dd}`;
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "Geen bestand ontvangen" }, { status: 400 });
    }

    const text = await file.text();
    const lines = text.split(/\r?\n/).filter((l) => l.trim());

    if (lines.length < 2) {
      return NextResponse.json({ error: "CSV heeft geen data rijen" }, { status: 400 });
    }

    const dataLines = lines.slice(1);
    const pool = await getDb();

    // Bestaande telefoonnummers ophalen (voor onbekend-detectie)
    const bestaande = await pool
      .request()
      .query("SELECT Telefoonnummer FROM Contacten");
    const gekend = new Set<string>(
      bestaande.recordset.map((r) => r.Telefoonnummer)
    );

    let imported = 0;
    let overschreven = 0;
    let nieuweContacten = 0;
    let overgeslagen = 0;
    const errors: { rij: number; fout: string }[] = [];

    // Fase 1: parse + valideer alle rijen
    type Rij = {
      rij: number;
      dienstType: string;
      telefoon: string;
      isoDatum: string;
      startDatum: Date;
    };
    const geldig: Rij[] = [];

    for (let i = 0; i < dataLines.length; i++) {
      const line = dataLines[i].trim();
      if (!line) continue;

      const parts = line.split(",").map((p) => p.trim());
      if (parts.length < 3) {
        errors.push({ rij: i + 2, fout: "Onvoldoende kolommen" });
        continue;
      }

      const [datumStr, telefoonRaw, groepRaw] = parts;
      const telefoon = telefoonRaw.replace(/\s/g, "");

      let dienstType: string;
      if (groepRaw === "Wachtdienst DockxApp") {
        dienstType = "App";
      } else if (groepRaw === "Wachtdienst Garage") {
        dienstType = "Garage";
      } else {
        errors.push({ rij: i + 2, fout: `Onbekende groep: ${groepRaw}` });
        continue;
      }

      if (!isValidPhone(telefoon)) {
        errors.push({ rij: i + 2, fout: `Ongeldig telefoonnummer: ${telefoon}` });
        continue;
      }

      const isoDatum = normaliseerDatum(datumStr);
      if (!isoDatum) {
        errors.push({ rij: i + 2, fout: `Ongeldige datum: ${datumStr}` });
        continue;
      }
      const startDatum = new Date(`${isoDatum}T08:00:00`);
      if (isNaN(startDatum.getTime())) {
        errors.push({ rij: i + 2, fout: `Ongeldige datum: ${datumStr}` });
        continue;
      }

      geldig.push({ rij: i + 2, dienstType, telefoon, isoDatum, startDatum });
    }

    // Fase 2: sorteer chronologisch per diensttype (onafhankelijk van CSV-volgorde)
    geldig.sort((a, b) => {
      if (a.dienstType !== b.dienstType)
        return a.dienstType < b.dienstType ? -1 : 1;
      return a.startDatum.getTime() - b.startDatum.getTime();
    });

    // Fase 3: enkel rijen waar telefoon wisselt t.o.v. vorige dag voor dit diensttype
    const lastPhone = new Map<string, string>();

    for (const r of geldig) {
      // Geen switch: zelfde persoon als vorige (chronologische) rij → overslaan
      if (lastPhone.get(r.dienstType) === r.telefoon) {
        overgeslagen++;
        continue;
      }
      lastPhone.set(r.dienstType, r.telefoon);

      // Onbekend nummer: contact aanmaken met nummer als naam
      if (!gekend.has(r.telefoon)) {
        await pool
          .request()
          .input("Naam", r.telefoon)
          .input("Telefoonnummer", r.telefoon)
          .input("Opmerkingen", "Automatisch aangemaakt via CSV-import")
          .query(
            "INSERT INTO Contacten (Naam, Telefoonnummer, Opmerkingen) VALUES (@Naam, @Telefoonnummer, @Opmerkingen)"
          );
        gekend.add(r.telefoon);
        nieuweContacten++;
      }

      const mergeResult = await pool
        .request()
        .input("DienstType", r.dienstType)
        .input("StartDatum", r.startDatum)
        .input("Telefoonnummer", r.telefoon)
        .input("Opmerkingen", "")
        .query(
          // Match op exact tijdstip (datum + uur, half-uur granulariteit) —
          // het monitoring-script draait elke 30 min, dus tijd telt mee.
          `MERGE INTO Wachtdiensten WITH (HOLDLOCK) AS target
           USING (SELECT @DienstType AS DienstType, @StartDatum AS StartDatumRef) AS source
             ON target.DienstType = source.DienstType
                AND target.StartDatum = source.StartDatumRef
           WHEN MATCHED THEN
             UPDATE SET Telefoonnummer = @Telefoonnummer, Opmerkingen = @Opmerkingen,
                        LaatstGewijzigd = GETDATE()
           WHEN NOT MATCHED THEN
             INSERT (DienstType, StartDatum, Telefoonnummer, Opmerkingen)
             VALUES (@DienstType, @StartDatum, @Telefoonnummer, @Opmerkingen)
           OUTPUT $action AS actie;`
        );

      const actie = mergeResult.recordset[0]?.actie;
      if (actie === "UPDATE") overschreven++;
      else imported++;
    }

    return NextResponse.json({
      imported,
      overschreven,
      overgeslagen,
      nieuweContacten,
      errors,
    });
  } catch (error) {
    console.error("POST /api/import error:", error);
    return NextResponse.json({ error: "Import mislukt" }, { status: 500 });
  }
}
