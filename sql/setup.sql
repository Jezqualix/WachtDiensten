-- Wachtdiensten Database Setup Script
-- Voer dit uit op je SQL Server om de database en tabellen aan te maken

-- Database aanmaken indien nodig
IF NOT EXISTS (SELECT name FROM sys.databases WHERE name = 'WachtdienstDB')
    CREATE DATABASE WachtdienstDB;
GO

USE WachtdienstDB;
GO

-- Contacten tabel: namen gekoppeld aan telefoonnummers
CREATE TABLE Contacten (
    ID INT PRIMARY KEY IDENTITY(1,1),
    Naam NVARCHAR(100) NOT NULL,
    Telefoonnummer NVARCHAR(20) NOT NULL,
    Opmerkingen NVARCHAR(500),
    AangemaaktOp DATETIME DEFAULT GETDATE()
);
GO

-- Wachtdiensten tabel: planning per diensttype
CREATE TABLE Wachtdiensten (
    ID INT PRIMARY KEY IDENTITY(1,1),
    DienstType NVARCHAR(20) NOT NULL CHECK (DienstType IN ('Garage', 'App')),
    StartDatum DATETIME NOT NULL,
    Telefoonnummer NVARCHAR(20) NOT NULL,
    Status NVARCHAR(10) DEFAULT 'Actief' CHECK (Status IN ('Actief', 'Gepland', 'Verlopen')),
    LaatstGewijzigd DATETIME DEFAULT GETDATE(),
    Opmerkingen NVARCHAR(500)
);
GO

-- Index voor snelle queries op diensttype en datum
CREATE INDEX IX_Wachtdiensten_DienstType_StartDatum
ON Wachtdiensten (DienstType, StartDatum DESC);
GO

-- Index voor wijzigingen check (monitoring script)
CREATE INDEX IX_Wachtdiensten_LaatstGewijzigd
ON Wachtdiensten (LaatstGewijzigd);
GO

-- Testdata
INSERT INTO Contacten (Naam, Telefoonnummer, Opmerkingen) VALUES
('Jan Janssens', '+32471234567', 'Garage medewerker'),
('Piet Pieters', '+32489876543', 'App support'),
('Marie Vermeulen', '+32461122334', 'Backup wachtdienst');
GO

INSERT INTO Wachtdiensten (DienstType, StartDatum, Telefoonnummer, Opmerkingen) VALUES
('Garage', '2026-04-03 08:00:00', '+32471234567', 'Week 14'),
('App', '2026-04-03 08:00:00', '+32489876543', 'Week 14'),
('Garage', '2026-04-10 08:00:00', '+32461122334', 'Week 15'),
('App', '2026-04-10 08:00:00', '+32471234567', 'Week 15');
GO
