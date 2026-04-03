export interface Contact {
  ID: number;
  Naam: string;
  Telefoonnummer: string;
  Opmerkingen?: string;
  AangemaaktOp?: string;
}

export interface Wachtdienst {
  ID: number;
  DienstType: "Garage" | "App";
  StartDatum: string;
  Telefoonnummer: string;
  ContactNaam?: string;
  Status: "Actief" | "Gepland" | "Verlopen";
  LaatstGewijzigd?: string;
  Opmerkingen?: string;
}
