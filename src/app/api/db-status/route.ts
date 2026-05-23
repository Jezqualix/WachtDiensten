import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";

const rawServer = process.env.DB_SERVER || "localhost";
const server = rawServer.split("\\")[0].split(".")[0];
const database = process.env.DB_DATABASE || "WachtdienstDB";

export async function GET() {
  try {
    const db = await getDb();
    await db.request().query("SELECT 1");
    return NextResponse.json({ online: true, server, database });
  } catch {
    return NextResponse.json({ online: false, server, database });
  }
}
