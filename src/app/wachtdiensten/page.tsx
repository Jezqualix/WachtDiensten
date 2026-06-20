"use client";

import { useEffect, useRef, useState } from "react";
import DatePicker, { registerLocale } from "react-datepicker";
import { nl } from "date-fns/locale/nl";
import "react-datepicker/dist/react-datepicker.css";
import type { Contact, Wachtdienst } from "@/lib/types";

registerLocale("nl", nl);

export default function WachtdienstenPage() {
  const [diensten, setDiensten] = useState<Wachtdienst[]>([]);
  const [contacten, setContacten] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Wachtdienst | null>(null);

  // Form state
  const [dienstType, setDienstType] = useState<"Garage" | "App" | "">("");
  const [startDag, setStartDag] = useState<Date | null>(new Date());
  const [startUur, setStartUur] = useState("08:00");
  const [telefoon, setTelefoon] = useState("");
  const [opmerkingen, setOpmerkingen] = useState("");
  const [formError, setFormError] = useState("");
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<{
    imported: number;
    overschreven: number;
    overgeslagen: number;
    nieuweContacten: number;
    errors: { rij: number; fout: string }[];
  } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Paginering: 10 records per tabel
  const PER_PAGINA = 10;
  const [garagePagina, setGaragePagina] = useState(0);
  const [appPagina, setAppPagina] = useState(0);

  async function fetchData() {
    try {
      const [dRes, cRes] = await Promise.all([
        fetch("/api/wachtdiensten"),
        fetch("/api/contacten"),
      ]);
      if (!dRes.ok || !cRes.ok) throw new Error();
      const [dData, cData] = await Promise.all([dRes.json(), cRes.json()]);
      setDiensten(dData);
      setContacten(cData);
    } catch {
      setError("Kon data niet laden");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchData();
  }, []);

  function resetForm() {
    setDienstType("");
    setStartDag(new Date());
    setStartUur("08:00");
    setTelefoon("");
    setOpmerkingen("");
    setFormError("");
    setEditing(null);
    setShowForm(false);
  }

  function startEdit(dienst: Wachtdienst) {
    setEditing(dienst);
    setDienstType(dienst.DienstType);
    const d = new Date(dienst.StartDatum);
    setStartDag(d);
    setStartUur(
      `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`
    );
    setTelefoon(dienst.Telefoonnummer);
    setOpmerkingen(dienst.Opmerkingen || "");
    setShowForm(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError("");

    if (!startDag) {
      setFormError("Datum is verplicht");
      return;
    }
    const dag = String(startDag.getDate()).padStart(2, "0");
    const maand = String(startDag.getMonth() + 1).padStart(2, "0");
    const jaar = startDag.getFullYear();
    const isoDate = `${jaar}-${maand}-${dag}T${startUur}:00`;

    const payload = {
      DienstType: dienstType,
      StartDatum: isoDate,
      Telefoonnummer: telefoon,
      Opmerkingen: opmerkingen,
    };

    try {
      let res: Response;
      if (editing) {
        res = await fetch("/api/wachtdiensten", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...payload, ID: editing.ID }),
        });
      } else {
        res = await fetch("/api/wachtdiensten", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      }

      if (!res.ok) {
        const data = await res.json();
        setFormError(data.error || "Er ging iets mis");
        return;
      }

      resetForm();
      fetchData();
    } catch {
      setFormError("Netwerkfout");
    }
  }

  async function handleImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setImporting(true);
    setImportResult(null);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/import", { method: "POST", body: formData });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Import mislukt");
      } else {
        setImportResult(data);
        fetchData();
      }
    } catch {
      setError("Netwerkfout bij import");
    } finally {
      setImporting(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  async function handleDelete(id: number) {
    if (!confirm("Weet je zeker dat je deze wachtdienst wilt verwijderen?")) return;

    try {
      const res = await fetch(`/api/wachtdiensten?id=${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      fetchData();
    } catch {
      setError("Kon wachtdienst niet verwijderen");
    }
  }

  // Splits diensten per type
  const garageDiensten = diensten.filter((d) => d.DienstType === "Garage");
  const appDiensten = diensten.filter((d) => d.DienstType === "App");

  function formatDatum(datum: string) {
    const d = new Date(datum);
    const dag = String(d.getDate()).padStart(2, "0");
    const maand = String(d.getMonth() + 1).padStart(2, "0");
    const jaar = d.getFullYear();
    const uur = String(d.getHours()).padStart(2, "0");
    const min = String(d.getMinutes()).padStart(2, "0");
    return `${dag}/${maand}/${jaar} ${uur}:${min}`;
  }

  function renderDienstTabel(
    items: Wachtdienst[],
    label: string,
    badgeClass: string,
    pagina: number,
    setPagina: (p: number) => void
  ) {
    const aantalPaginas = Math.ceil(items.length / PER_PAGINA);
    // Clamp: na verwijderen kan pagina buiten bereik vallen
    const huidigePagina = Math.min(pagina, Math.max(0, aantalPaginas - 1));
    const start = huidigePagina * PER_PAGINA;
    const zichtbaar = items.slice(start, start + PER_PAGINA);

    return (
      <div className="mb-8">
        <h2 className="text-lg font-semibold text-brand-800 mb-3 flex items-center gap-2">
          <span className={badgeClass}>{label}</span>
          Wachtdienst
        </h2>
        {items.length === 0 ? (
          <div className="card text-center py-8 text-[var(--text-muted)]">
            Geen {label.toLowerCase()} wachtdiensten gepland.
          </div>
        ) : (
          <>
            <div className="card overflow-x-auto p-0">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-brand-600 text-white">
                    <th className="text-left px-4 py-3 font-semibold">Startdatum</th>
                    <th className="text-left px-4 py-3 font-semibold">Contact</th>
                    <th className="text-left px-4 py-3 font-semibold">Telefoonnummer</th>
                    <th className="text-left px-4 py-3 font-semibold">Opmerkingen</th>
                    <th className="text-right px-4 py-3 font-semibold">Acties</th>
                  </tr>
                </thead>
                <tbody>
                  {zichtbaar.map((dienst, i) => (
                    <tr
                      key={dienst.ID}
                      className={`border-b border-[var(--border)] ${
                        i % 2 === 0 ? "bg-white" : "bg-gray-50"
                      } hover:bg-brand-50 transition-colors`}
                    >
                      <td className="px-4 py-3">{formatDatum(dienst.StartDatum)}</td>
                      <td className="px-4 py-3 font-medium">
                        {dienst.ContactNaam || "—"}
                      </td>
                      <td className="px-4 py-3 font-mono">{dienst.Telefoonnummer}</td>
                      <td className="px-4 py-3 text-[var(--text-muted)]">
                        {dienst.Opmerkingen || "—"}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={() => startEdit(dienst)}
                          className="text-brand-600 hover:text-brand-800 font-medium mr-3"
                        >
                          Bewerken
                        </button>
                        <button
                          onClick={() => handleDelete(dienst.ID)}
                          className="text-red-600 hover:text-red-800 font-medium"
                        >
                          Verwijderen
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {aantalPaginas > 1 && (
              <div className="flex items-center justify-between mt-3 text-sm">
                <button
                  onClick={() => setPagina(huidigePagina - 1)}
                  disabled={huidigePagina === 0}
                  className="text-brand-600 hover:text-brand-800 font-medium disabled:text-gray-300 disabled:cursor-not-allowed"
                >
                  ← Vorige
                </button>
                <span className="text-[var(--text-muted)]">
                  {start + 1}–{Math.min(start + PER_PAGINA, items.length)} van {items.length}
                </span>
                <button
                  onClick={() => setPagina(huidigePagina + 1)}
                  disabled={huidigePagina >= aantalPaginas - 1}
                  className="text-brand-600 hover:text-brand-800 font-medium disabled:text-gray-300 disabled:cursor-not-allowed"
                >
                  Volgende →
                </button>
              </div>
            )}
          </>
        )}
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-brand-900">Wachtdiensten Planning</h1>
        <div className="flex gap-2">
          <input
            type="file"
            accept=".csv"
            ref={fileInputRef}
            onChange={handleImport}
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="btn-secondary"
            disabled={importing}
          >
            {importing ? "Importeren..." : "Importeer CSV"}
          </button>
          <button
            onClick={() => {
              resetForm();
              setShowForm(!showForm);
            }}
            className="btn-cta"
          >
            {showForm ? "Annuleren" : "+ Nieuwe Wachtdienst"}
          </button>
        </div>
      </div>

      {importResult && (
        <div
          className={`border rounded-md px-4 py-3 mb-4 ${
            importResult.errors.length === 0
              ? "bg-green-50 border-green-200 text-green-700"
              : "bg-yellow-50 border-yellow-200 text-yellow-700"
          }`}
        >
          <p className="font-medium">
            {importResult.imported} nieuw geïmporteerd
            {importResult.overschreven > 0 &&
              `, ${importResult.overschreven} overschreven`}
            {importResult.overgeslagen > 0 &&
              `, ${importResult.overgeslagen} zonder wissel overgeslagen`}
            {importResult.errors.length > 0
              ? `, ${importResult.errors.length} met fout`
              : "."}
            {importResult.nieuweContacten > 0 &&
              ` ${importResult.nieuweContacten} onbekend(e) nummer(s) als nieuw contact aangemaakt — hernoem deze in Contacten.`}
          </p>
          {importResult.errors.length > 0 && (
            <ul className="mt-1 text-sm list-disc list-inside">
              {importResult.errors.map((e, i) => (
                <li key={i}>
                  Rij {e.rij}: {e.fout}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {/* Form */}
      {showForm && (
        <div className="card mb-6">
          <h2 className="text-lg font-semibold text-brand-800 mb-4">
            {editing ? "Wachtdienst Bewerken" : "Nieuwe Wachtdienst"}
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="label">Diensttype *</label>
                <div className="flex items-center gap-6 mt-1 h-[38px]">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="dienstType"
                      value="Garage"
                      checked={dienstType === "Garage"}
                      onChange={(e) => setDienstType(e.target.value as "Garage")}
                      className="w-4 h-4 accent-brand-600"
                      required
                    />
                    <span className="text-sm font-medium">Garage</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="dienstType"
                      value="App"
                      checked={dienstType === "App"}
                      onChange={(e) => setDienstType(e.target.value as "App")}
                      className="w-4 h-4 accent-brand-600"
                      required
                    />
                    <span className="text-sm font-medium">App</span>
                  </label>
                </div>
              </div>
              <div>
                <label className="label">Startdatum *</label>
                <DatePicker
                  selected={startDag}
                  onChange={(date: Date | null) => setStartDag(date)}
                  dateFormat="dd/MM/yyyy"
                  locale="nl"
                  className="input"
                  placeholderText="dd/mm/jjjj"
                  required
                />
              </div>
              <div>
                <label className="label">Startuur *</label>
                <select
                  value={startUur}
                  onChange={(e) => setStartUur(e.target.value)}
                  className="select"
                  required
                >
                  {Array.from({ length: 24 * 4 }, (_, i) => {
                    const h = String(Math.floor(i / 4)).padStart(2, "0");
                    const m = String((i % 4) * 15).padStart(2, "0");
                    return (
                      <option key={i} value={`${h}:${m}`}>
                        {h}:{m}
                      </option>
                    );
                  })}
                </select>
              </div>
            </div>
            <div>
              <label className="label">Telefoonnummer *</label>
              {contacten.length > 0 ? (
                <select
                  value={telefoon}
                  onChange={(e) => setTelefoon(e.target.value)}
                  className="select"
                  required
                >
                  <option value="">— Kies een contact —</option>
                  {contacten.map((c) => (
                    <option key={c.ID} value={c.Telefoonnummer}>
                      {c.Naam} ({c.Telefoonnummer})
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  type="tel"
                  value={telefoon}
                  onChange={(e) => setTelefoon(e.target.value)}
                  className="input"
                  placeholder="+32471234567"
                  required
                />
              )}
            </div>
            <div>
              <label className="label">Opmerkingen</label>
              <textarea
                value={opmerkingen}
                onChange={(e) => setOpmerkingen(e.target.value)}
                className="input"
                rows={2}
                placeholder="Optionele opmerkingen..."
              />
            </div>
            {formError && (
              <p className="text-red-600 text-sm font-medium">{formError}</p>
            )}
            <div className="flex gap-2">
              <button type="submit" className="btn-primary">
                {editing ? "Opslaan" : "Toevoegen"}
              </button>
              <button type="button" onClick={resetForm} className="btn-secondary">
                Annuleren
              </button>
            </div>
          </form>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md mb-4">
          {error}
        </div>
      )}

      {loading ? (
        <div className="text-center py-12 text-[var(--text-muted)]">Laden...</div>
      ) : (
        <>
          {renderDienstTabel(garageDiensten, "Garage", "badge-garage", garagePagina, setGaragePagina)}
          {renderDienstTabel(appDiensten, "App", "badge-app", appPagina, setAppPagina)}
        </>
      )}
    </div>
  );
}
