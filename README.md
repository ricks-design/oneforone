# One for One – Website

Statische Website mit Bearbeitungsoberfläche (Pages CMS). Inhalte liegen als YAML-Dateien
in `content/`, das Layout in `templates/` und `static/`. Eine GitHub Action baut daraus bei
jeder Änderung auf `main` die fertigen HTML-Seiten und veröffentlicht sie auf GitHub Pages.

## Aufbau

| Ordner / Datei | Inhalt | Wer ändert es |
|---|---|---|
| `content/seiten/*.yml` | eine Datei pro Seite: Titel, Beschreibung, Liste der Inhaltsblöcke (`404.yml` = Fehlerseite) | Pages CMS |
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
dreht sie nach Kamera-Ausrichtung und entfernt GPS-Daten. iPhone-Fotos im HEIC-Format werden
automatisch in JPEG umgewandelt. Das Original bleibt in `bilder/`; bei vielen oder sehr großen
Fotos diese vorher verkleinern (längere Seite 1600–2000 px), damit das Repository klein bleibt.

**Prüfung beim Build:** Verweist eine Seite auf ein Bild oder eine Unterseite, die es nicht gibt
(z. B. gelöschtes Bild, Tippfehler im Link), bricht der Build ab und die bisherige Version bleibt
online. Die fehlende Datei steht im Protokoll des fehlgeschlagenen Laufs (Reiter *Actions*).
Bildnamen ohne Leerzeichen und Umlaute erleichtern die Pflege (das CMS benennt Uploads automatisch um).

### Block-Typen

Eine Seite ist eine flache Liste von Blöcken. Ein Block **„▸ Neuer Abschnitt“** öffnet einen
neuen Seitenabschnitt (`<section>`); alle folgenden Inhaltsblöcke landen darin, bis der nächste
Abschnitt oder ein eigenständiger Block kommt.

Jeder Block hat das Feld **„Interne Bezeichnung“**. Sie erscheint nur in der Blockliste des CMS
(links der Text, rechts der Block-Typ) und macht die Seite dort als Gliederung lesbar. Bei neuen
Blöcken kurz ausfüllen, z. B. die Überschrift.

| Block | Art | Verwendung |
|---|---|---|
| Titelbild groß | eigenständig | Kopf der Startseite |
| Seitenkopf | eigenständig | Kopf der Unterseiten |
| Kennzahlen mit Balken | eigenständig | Zahlenbereich der Startseite; Balkenhöhen werden aus den Werten berechnet |
| Aufruf-Band | eigenständig | farbiges Band mit Button am Seitenende |
| HTML-Bereich | eigenständig | kompletter Sonderbereich als HTML |
| ▸ Neuer Abschnitt | Rahmen | Eyebrow, Anker-ID, Breite, Hintergrund |
| Text | Inhalt | Überschriften, Absätze, Listen, Links |
| Einleitungssatz | Inhalt | größerer Satz unter einer Überschrift |
| Bildreihe | Inhalt | 2–3 Bilder nebeneinander, Klick öffnet Großansicht |
| Einzelbild groß | Inhalt | ein Bild in voller Breite, unbeschnitten (z. B. Gruppenfoto); erscheint erst, wenn ein Bild gewählt ist |
| Porträt-Galerie | Inhalt | kleine quadratische Fotos mit Namen (z. B. Freiwillige); erscheint erst, wenn Fotos eingetragen sind |
| Bildmosaik | Inhalt | Galerie der Startseite mit Kachelgrößen |
| Personen-/Bildkarten | Inhalt | Team, Slum-Porträts auf „Vor Ort“ |
| Projekt-Kacheln mit Pop-up | Inhalt | Projektübersicht der Startseite inkl. Pop-up-Texte |
| Fragen & Antworten | Inhalt | aufklappbare FAQ |
| Zeitleiste | Inhalt | Bau-Tagebuch Community Center |
| Neuigkeiten-Liste | Inhalt | Beiträge, z. B. die neuesten drei |
| Schulstufen-Grafik | Inhalt | Balken, Länge nach Dauer in Jahren |
| Kostendiagramm | Inhalt | Kreisdiagramm; Anteile und Summe werden aus den Beträgen berechnet |
| Tabelle | Inhalt | zweispaltig, z. B. Kostenübersicht |
| Wirkungsrechner | Inhalt | Schieberegler; Startbetrag und Schnellwahl-Buttons |
| HTML im Abschnitt | Inhalt | Sonderelemente mit eigenem Markup (Infobox, Spendenkarten, Karten …) |

**HTML-Blöcke** enthalten das bisherige Markup unverändert. In ihnen können Werte aus den
Einstellungen eingesetzt werden: `{{ e.iban }}`, `{{ e.bic }}`, `{{ e.bank }}`,
`{{ e.kontoinhaber }}`, `{{ e.paypal_link }}`. Die IBAN wird deshalb nur an einer Stelle gepflegt
(*Einstellungen*) und erscheint automatisch im Footer aller Seiten und auf der Spendenseite.

Die Beispiele des **Wirkungsrechners** je Betrag stehen unter *Einstellungen → Wirkungsrechner*:
je Stufe ein Betragsbereich, ein Haupt- und optional ein Alternativ-Beispiel.

**Zentrale Kostenwerte:** Unter *Einstellungen → Zentrale Kostenwerte* stehen Beträge, die an
mehreren Stellen vorkommen (Schulgebühren, Schulessen, Uniform …). In jedem Textfeld setzt
`{{ k.schluessel }}` den Wert ein, z. B. `{{ k.schulessen_jahr }} € / Jahr`. Gerechnet wird mit
`z`: `{{ (z.schulgebuehren_min + z.schulessen_jahr) | euro }}`. Kostendiagramm, Kostentabelle und
Wirkungsrechner nutzen diese Werte; wer einen Betrag ändert, ändert ihn damit überall. Die
Betragsgrenzen der Rechner-Stufen („von“/„bis“) passen sich nicht automatisch an.

**Feldtypen beachten:** Textfelder erwarten in den YAML-Dateien Text (`"237"`), Zahlenfelder
Zahlen (`237`). Wer Inhalte direkt in den Dateien ändert, sollte das einhalten, sonst meldet das
CMS beim Speichern einen Fehler.

## Neuigkeiten

Beiträge legt man im CMS unter **„Neuigkeiten (Beiträge)“** an: Titel, Datum, Kurztext, Titelbild,
Text, weitere Bilder. Jeder Beitrag wird eine eigene Seite (`neuigkeiten-<datum>-<titel>.html`) und
erscheint auf der Seite „Neuigkeiten“, sortiert nach Datum (neueste zuerst). Mit „Entwurf“ markierte
Beiträge werden nicht veröffentlicht. Der Block **„Neuigkeiten-Liste“** zeigt Beiträge an beliebiger
Stelle, z. B. mit Anzahl 3 die neuesten drei auf der Startseite. Der Menüpunkt wird unter
*Einstellungen → Navigation* ergänzt (Datei `neuigkeiten.html`).

## Datenschutz und Teilen

- Schriften liegen in `static/fonts/` (SIL Open Font License); es werden keine Google-Server angefragt.
- Google-Maps-Karten (Projekte-Seite) laden erst nach Klick: im HTML `data-src` statt `src` am `<iframe>`.
- QR-Code für die Überweisung (Spendenseite): wird beim Build automatisch aus IBAN, BIC und
  Kontoinhaber erzeugt, sobald in den Einstellungen eine gültige IBAN steht. Beim Platzhalter
  erscheint keiner.
- Bilder werden zusätzlich als WebP ausgeliefert (rund 40 % kleiner); JPEG/PNG bleiben als
  Rückfall und für das Vorschaubild beim Teilen erhalten.
- Favicon und Apple-Touch-Icon liegen in `static/`. Das Vorschaubild beim Teilen (Open Graph) ist
  *Einstellungen → Standard-Vorschaubild*; pro Seite und pro Beitrag (Titelbild) überschreibbar.
  Dafür muss *Einstellungen → Adresse der Website* stimmen (bei Domainwechsel anpassen).

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
- Porträts Familie Ouma, Sarah, Vickstone (Platzhalter)
- Jane (Mathare): Foto liegt bereit, Geschichte fehlt
- Englische Version, ggf. Videos
