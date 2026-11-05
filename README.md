# One for One – Website

Statische Website mit Bearbeitungsoberfläche (Pages CMS). Inhalte liegen als YAML-Dateien
in `content/`, das Layout in `templates/` und `static/`. Eine GitHub Action baut daraus bei
jeder Änderung auf `main` die fertigen HTML-Seiten und veröffentlicht sie auf GitHub Pages.

## Aufbau

| Ordner / Datei | Inhalt | Wer ändert es |
|---|---|---|
| `content/seiten/*.yml` | eine Datei pro Seite: Titel, Beschreibung, Liste der Inhaltsblöcke | Pages CMS |
| `content/einstellungen.yml` | Navigation, Footer, Links, Kontodaten (IBAN, BIC, PayPal) | Pages CMS |
| `bilder/` | alle Bilder (Uploads aus dem CMS landen hier) | Pages CMS |
| `templates/base.html` | Kopf, Navigation, Footer | Code |
| `templates/blocks/*.html` | ein Template pro Block-Typ | Code |
| `static/` | `styles.css`, `main.js` | Code |
| `build.py` | Build-Skript | Code |
| `.pages.yml` | Konfiguration der CMS-Oberfläche | Code |
| `.github/workflows/deploy.yml` | automatischer Build und Veröffentlichung | Code |
| `_eingang/` | Rohfotos, werden nicht veröffentlicht | – |
| `_archiv/` | Farbvergleichsseiten, werden nicht veröffentlicht | – |

`dist/` entsteht beim Build und wird nicht eingecheckt.

## Einrichtung (einmalig)

1. **GitHub Pages:** Repository → *Settings → Pages → Build and deployment → Source:* „GitHub Actions“.
2. **Pages CMS:** auf <https://app.pagescms.org> mit GitHub anmelden, die Pages-CMS-App installieren
   und nur für dieses Repository freigeben. Das Repository öffnen, Branch `main` wählen.
3. **Bearbeiter:** im Repository unter *Settings → Collaborators* mit Rolle „Write“ hinzufügen.
   Zwei-Faktor-Authentifizierung für alle Konten aktivieren.

## Bearbeiten

In Pages CMS: links die Seite wählen → Blöcke auf- und zuklappen, ändern, per Ziehen sortieren,
über „Hinzufügen“ neue Blöcke einfügen → „Speichern“. Jede Speicherung ist ein Commit.
Nach ca. 1–2 Minuten ist die Änderung online (Status im Reiter *Actions*).

**Bilder:** in einem Bildfeld hochladen oder aus der Mediathek wählen. Handyfotos können in
Originalgröße hochgeladen werden: Der Build verkleinert Bilder über 1600 px (längere Seite),
dreht sie nach Kamera-Ausrichtung und entfernt GPS-Daten. Das Original bleibt in `bilder/`.
Bildnamen ohne Leerzeichen und Umlaute erleichtern die Pflege (das CMS benennt Uploads automatisch um).

### Block-Typen

Eine Seite ist eine flache Liste von Blöcken. Ein Block **„── Neuer Abschnitt ──“** öffnet einen
neuen Seitenabschnitt (`<section>`); alle folgenden Inhaltsblöcke landen darin, bis der nächste
Abschnitt oder ein eigenständiger Block kommt.

| Block | Art | Verwendung |
|---|---|---|
| Titelbild groß | eigenständig | Kopf der Startseite |
| Seitenkopf | eigenständig | Kopf der Unterseiten |
| Aufruf-Band | eigenständig | grünes Band mit Button am Seitenende |
| HTML-Bereich | eigenständig | kompletter Sonderbereich als HTML (z. B. Kennzahlen der Startseite) |
| ── Neuer Abschnitt ── | Rahmen | Eyebrow, Anker-ID, Hintergrund/Klasse |
| Text | Inhalt | Überschriften, Absätze, Listen, Links |
| Bildreihe | Inhalt | 2–3 Bilder nebeneinander, Klick öffnet Lightbox |
| Bildmosaik | Inhalt | Galerie der Startseite mit Kachelgrößen |
| Fragen & Antworten | Inhalt | aufklappbare FAQ |
| Zeitleiste | Inhalt | Bau-Tagebuch Community Center |
| Personen-/Bildkarten | Inhalt | Team, Slum-Porträts auf „Vor Ort“ |
| Projekt-Kacheln mit Pop-up | Inhalt | Projektübersicht der Startseite inkl. Pop-up-Texte |
| HTML im Abschnitt | Inhalt | Sonderelemente mit eigenem Markup (Infoboxen, Diagramme, Tabellen, Spendenkarten …) |

**HTML-Blöcke** enthalten das bisherige Markup unverändert. In ihnen können Werte aus den
Einstellungen eingesetzt werden: `{{ e.iban }}`, `{{ e.bic }}`, `{{ e.bank }}`,
`{{ e.kontoinhaber }}`, `{{ e.paypal_link }}`. Die IBAN wird deshalb nur an einer Stelle gepflegt
(*Einstellungen*) und erscheint automatisch im Footer aller Seiten und auf der Spendenseite.

Die Stufen des **Wirkungsrechners** (Startseite, Spendenseite) stehen unter *Einstellungen → Wirkungsrechner*: je Stufe ein Betragsbereich, ein Haupt- und optional ein Alternativ-Beispiel. Der Slider läuft in 1-€-Schritten von 5 bis 200 €; Schrittweite und Schnellwahl-Buttons stehen im HTML-Block des jeweiligen Rechner-Abschnitts.

## Lokal bauen

```bash
pip install -r requirements.txt
python build.py            # baut nach dist/
python build.py --serve    # baut und startet http://localhost:8000
```

Neuer Block-Typ: Template in `templates/blocks/<name>.html` anlegen (Zugriff auf Felder über
`b.<feld>`, Bildpfade mit `| bild`), Felder in `.pages.yml` unter `components → bloecke → blocks`
ergänzen. Gehört der Block nicht in einen Abschnitt, Namen in `EIGENSTAENDIG` in `build.py` eintragen.

## Vor dem Launch

- ECHTE IBAN einsetzen (*Einstellungen*, derzeit Platzhalter DE00…)
- Datenschutzerklärung juristisch prüfen
- Zahl-Abgleich Schulessen (1,50 €/Woche ≈ 78 €/Jahr vs. Diagramm ≈ 40 €/Jahr) – danach Kostentabelle, Kostendiagramm und Rechner-Stufe 50–77 € angleichen
- Porträts Familie Ouma, Sarah, Vickstone (Platzhalter)
- Jane (Mathare): Foto liegt bereit, Geschichte fehlt
- Englische Version, ggf. Videos
