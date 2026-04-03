"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { Wachtdienst } from "@/lib/types";

export default function Dashboard() {
  const [diensten, setDiensten] = useState<Wachtdienst[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/wachtdiensten")
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) setDiensten(data);
      })
      .finally(() => setLoading(false));
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
      .sort((a, b) => new Date(a.StartDatum).getTime() - new Date(b.StartDatum).getTime())[0] || null;
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
              {garageVolgende ? (
                <>
                  <p className="font-semibold mt-2">
                    {garageVolgende.ContactNaam || garageVolgende.Telefoonnummer}
                  </p>
                  <p className="text-sm text-[var(--text-muted)]">
                    {formatDatum(garageVolgende.StartDatum)}
                  </p>
                </>
              ) : (
                <p className="text-[var(--text-muted)] mt-2">Geen geplande wijziging</p>
              )}
            </div>
            <div className="card">
              <span className="badge-app mb-2">App</span>
              {appVolgende ? (
                <>
                  <p className="font-semibold mt-2">
                    {appVolgende.ContactNaam || appVolgende.Telefoonnummer}
                  </p>
                  <p className="text-sm text-[var(--text-muted)]">
                    {formatDatum(appVolgende.StartDatum)}
                  </p>
                </>
              ) : (
                <p className="text-[var(--text-muted)] mt-2">Geen geplande wijziging</p>
              )}
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
          </div>
        </>
      )}
    </div>
  );
}
