"use client";

import { useEffect, useState } from "react";
import type { Contact } from "@/lib/types";

export default function ContactenPage() {
  const [contacten, setContacten] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Contact | null>(null);

  // Form state
  const [naam, setNaam] = useState("");
  const [telefoon, setTelefoon] = useState("");
  const [opmerkingen, setOpmerkingen] = useState("");
  const [formError, setFormError] = useState("");

  async function fetchContacten() {
    try {
      const res = await fetch("/api/contacten");
      if (!res.ok) throw new Error("Fout bij ophalen");
      const data = await res.json();
      setContacten(data);
    } catch {
      setError("Kon contacten niet laden");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchContacten();
  }, []);

  function resetForm() {
    setNaam("");
    setTelefoon("");
    setOpmerkingen("");
    setFormError("");
    setEditing(null);
    setShowForm(false);
  }

  function startEdit(contact: Contact) {
    setEditing(contact);
    setNaam(contact.Naam);
    setTelefoon(contact.Telefoonnummer);
    setOpmerkingen(contact.Opmerkingen || "");
    setShowForm(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError("");

    const payload = { Naam: naam, Telefoonnummer: telefoon, Opmerkingen: opmerkingen };

    try {
      let res: Response;
      if (editing) {
        res = await fetch("/api/contacten", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...payload, ID: editing.ID }),
        });
      } else {
        res = await fetch("/api/contacten", {
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
      fetchContacten();
    } catch {
      setFormError("Netwerkfout");
    }
  }

  async function handleDelete(id: number) {
    if (!confirm("Weet je zeker dat je dit contact wilt verwijderen?")) return;

    try {
      const res = await fetch(`/api/contacten?id=${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      fetchContacten();
    } catch {
      setError("Kon contact niet verwijderen");
    }
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-brand-900">Contacten Beheer</h1>
        <button
          onClick={() => {
            resetForm();
            setShowForm(!showForm);
          }}
          className="btn-cta"
        >
          {showForm ? "Annuleren" : "+ Nieuw Contact"}
        </button>
      </div>

      {/* Form */}
      {showForm && (
        <div className="card mb-6">
          <h2 className="text-lg font-semibold text-brand-800 mb-4">
            {editing ? "Contact Bewerken" : "Nieuw Contact"}
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label">Naam *</label>
              <input
                type="text"
                value={naam}
                onChange={(e) => setNaam(e.target.value)}
                className="input"
                placeholder="Volledige naam"
                required
              />
            </div>
            <div>
              <label className="label">Telefoonnummer *</label>
              <input
                type="tel"
                value={telefoon}
                onChange={(e) => setTelefoon(e.target.value)}
                className="input"
                placeholder="+32471234567"
                required
              />
              <p className="text-xs text-[var(--text-muted)] mt-1">
                Begint met + gevolgd door 10 of 11 cijfers
              </p>
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

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md mb-4">
          {error}
        </div>
      )}

      {/* Table */}
      {loading ? (
        <div className="text-center py-12 text-[var(--text-muted)]">Laden...</div>
      ) : contacten.length === 0 ? (
        <div className="card text-center py-12 text-[var(--text-muted)]">
          <p className="text-lg mb-2">Geen contacten gevonden</p>
          <p className="text-sm">Voeg een nieuw contact toe om te beginnen.</p>
        </div>
      ) : (
        <div className="card overflow-x-auto p-0">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-brand-600 text-white">
                <th className="text-left px-4 py-3 font-semibold">Naam</th>
                <th className="text-left px-4 py-3 font-semibold">Telefoonnummer</th>
                <th className="text-left px-4 py-3 font-semibold">Opmerkingen</th>
                <th className="text-right px-4 py-3 font-semibold">Acties</th>
              </tr>
            </thead>
            <tbody>
              {contacten.map((contact, i) => (
                <tr
                  key={contact.ID}
                  className={`border-b border-[var(--border)] ${
                    i % 2 === 0 ? "bg-white" : "bg-gray-50"
                  } hover:bg-brand-50 transition-colors`}
                >
                  <td className="px-4 py-3 font-medium">{contact.Naam}</td>
                  <td className="px-4 py-3 font-mono">{contact.Telefoonnummer}</td>
                  <td className="px-4 py-3 text-[var(--text-muted)]">
                    {contact.Opmerkingen || "—"}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => startEdit(contact)}
                      className="text-brand-600 hover:text-brand-800 font-medium mr-3"
                    >
                      Bewerken
                    </button>
                    <button
                      onClick={() => handleDelete(contact.ID)}
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
      )}
    </div>
  );
}
