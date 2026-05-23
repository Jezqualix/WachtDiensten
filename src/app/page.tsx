"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { Wachtdienst } from "@/lib/types";

type DbStatus = { online: boolean; server: string; database: string } | null;

export default function Dashboard() {
  const [diensten, setDiensten] = useState<Wachtdienst[]>([]);
  const [loading, setLoading] = useState(true);
  const [dbStatus, setDbStatus] = useState<DbStatus>(null);

  useEffect(() => {
    fetch("/api/wachtdiensten")
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) setDiensten(data);
      })
      .finally(() => setLoading(false));

    fetch("/api/db-status")
      .then((res) => res.json())
      .then((data) => setDbStatus(data))
      .catch(() => setDbStatus({ online: false, server: process.env.NEXT_PUBLIC_DB_SERVER || "onbekend", database: "onbekend" }));
  }, []);

  // Bepaal actieve diensten (meest recente per type)
  function getActief(type: "Garage" | "App") {
    const items = diensten
      .filter((d) => d.DienstType === type)
      .sort((a, b) => new Date(b.StartDatum).getTime() - new Date(a.StartDatum).getTime());

    const nu = new Date();
    return items.find((d) => new Date(d.StartDatum) <= nu) || items[0] || null;
  }

  function getVolgende(type: "Garage" | "App") {
    const nu = new Date();
    return diensten
      .filter((d) => d.DienstType === type && new Date(d.StartDatum) > nu)
      .sort((a, b) => new Date(a.StartDatum).getTime() - new Date(b.StartDatum).getTime())
      .slice(0, 3);
  }

  const garageActief = getActief("Garage");
  const appActief = getActief("App");
  const garageVolgende = getVolgende("Garage");
  const appVolgende = getVolgende("App");

  function formatDatum(datum: string) {
    const d = new Date(datum);
    const dag = String(d.getDate()).padStart(2, "0");
    const maand = String(d.getMonth() + 1).padStart(2, "0");
    const jaar = d.getFullYear();
    const uur = String(d.getHours()).padStart(2, "0");
    const min = String(d.getMinutes()).padStart(2, "0");
    const weekdagen = ["zo", "ma", "di", "wo", "do", "vr", "za"];
    return `${weekdagen[d.getDay()]} ${dag}/${maand}/${jaar} ${uur}:${min}`;
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      {/* Hero */}
      <div className="bg-gradient-to-br from-brand-900 via-brand-700 to-brand-600 rounded-xl p-8 mb-8 text-white">
        <h1 className="text-3xl font-bold mb-2">Wachtdienst Planner <span className="bg-accent text-brand-900 text-sm font-bold px-2 py-1 rounded ml-2">TEST/DEMO</span></h1>
        <p className="text-white/80 text-lg">
          Overzicht van de actieve garage en app wachtdiensten
        </p>
      </div>

      {loading ? (
        <div className="text-center py-12 text-[var(--text-muted)]">Laden...</div>
      ) : (
        <>
          {/* Actieve diensten */}
          <h2 className="text-xl font-bold text-brand-900 mb-4">Actieve Wachtdiensten</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-8">
            {/* Garage */}
            <div className="card border-l-4 border-l-brand-600">
              <div className="flex items-center justify-between mb-3">
                <span className="badge-garage">Garage</span>
                {garageActief && <span className="badge-actief">Actief</span>}
              </div>
              {garageActief ? (
                <>
                  <p className="text-2xl font-bold font-mono text-brand-900 mb-1">
                    {garageActief.Telefoonnummer}
                  </p>
                  <p className="text-sm text-[var(--text-muted)]">
                    {garageActief.ContactNaam && (
                      <span className="font-medium text-[var(--foreground)]">
                        {garageActief.ContactNaam} &mdash;{" "}
                      </span>
                    )}
                    Sinds {formatDatum(garageActief.StartDatum)}
                  </p>
                </>
              ) : (
                <p className="text-[var(--text-muted)]">Geen actieve dienst</p>
              )}
            </div>

            {/* App */}
            <div className="card border-l-4 border-l-accent">
              <div className="flex items-center justify-between mb-3">
                <span className="badge-app">App</span>
                {appActief && <span className="badge-actief">Actief</span>}
              </div>
              {appActief ? (
                <>
                  <p className="text-2xl font-bold font-mono text-brand-900 mb-1">
                    {appActief.Telefoonnummer}
                  </p>
                  <p className="text-sm text-[var(--text-muted)]">
                    {appActief.ContactNaam && (
                      <span className="font-medium text-[var(--foreground)]">
                        {appActief.ContactNaam} &mdash;{" "}
                      </span>
                    )}
                    Sinds {formatDatum(appActief.StartDatum)}
                  </p>
                </>
              ) : (
                <p className="text-[var(--text-muted)]">Geen actieve dienst</p>
              )}
            </div>
          </div>

          {/* Volgende diensten */}
          <h2 className="text-xl font-bold text-brand-900 mb-4">Eerstvolgende Wijzigingen</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-8">
            <div className="card">
              <span className="badge-garage mb-2">Garage</span>
              <ul className="mt-2 space-y-2">
                {garageVolgende.map((d) => (
                  <li key={d.ID}>
                    <p className="font-semibold">
                      {d.ContactNaam || d.Telefoonnummer}
                      {d.ContactNaam && (
                        <span className="font-normal"> ({d.Telefoonnummer})</span>
                      )}
                    </p>
                    <p className="text-sm text-[var(--text-muted)]">{formatDatum(d.StartDatum)}</p>
                  </li>
                ))}
                {garageVolgende.length === 0 && (
                  <li className="font-semibold text-lg text-red-600" style={{ animation: 'blink 1s linear infinite' }}>Wachtdienstlijst leeg!</li>
                )}
                {garageVolgende.length > 0 && garageVolgende.length < 3 && (
                  <li className="font-semibold text-red-600">Wachtdienstlijst bijna leeg!</li>
                )}
              </ul>
            </div>
            <div className="card">
              <span className="badge-app mb-2">App</span>
              <ul className="mt-2 space-y-2">
                {appVolgende.map((d) => (
                  <li key={d.ID}>
                    <p className="font-semibold">
                      {d.ContactNaam || d.Telefoonnummer}
                      {d.ContactNaam && (
                        <span className="font-normal"> ({d.Telefoonnummer})</span>
                      )}
                    </p>
                    <p className="text-sm text-[var(--text-muted)]">{formatDatum(d.StartDatum)}</p>
                  </li>
                ))}
                {appVolgende.length === 0 && (
                  <li className="font-semibold text-lg text-red-600" style={{ animation: 'blink 1s linear infinite' }}>Wachtdienstlijst leeg!</li>
                )}
                {appVolgende.length > 0 && appVolgende.length < 3 && (
                  <li className="font-semibold text-red-600">Wachtdienstlijst bijna leeg!</li>
                )}
              </ul>
            </div>
          </div>

          {/* Quick links */}
          <div className="flex flex-wrap gap-3">
            <Link href="/wachtdiensten" className="btn-primary">
              Planning Beheren
            </Link>
            <Link href="/contacten" className="btn-cta">
              Contacten Beheren
            </Link>
            <a href="/api/export" download="test.csv" className="btn-secondary">
              Exporteer CSV
            </a>
          </div>
        </>
      )}

      {/* DB status badge - rechtsonder */}
      {dbStatus && (
        <div
          className="fixed bottom-4 right-4 z-50 px-3 py-2 rounded-lg text-xs font-mono shadow-lg border"
          style={
            dbStatus.online
              ? { backgroundColor: "#f0fdf4", borderColor: "#86efac", color: "#166534" }
              : { backgroundColor: "#fef2f2", borderColor: "#fca5a5", color: "#991b1b" }
          }
        >
          Database <strong>{dbStatus.database}</strong> op server <strong>{dbStatus.server}</strong> is{" "}
          <strong>{dbStatus.online ? "online" : "offline"}</strong>
        </div>
      )}
    </div>
  );
}
