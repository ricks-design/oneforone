#!/usr/bin/env python3
"""Baut die One-for-One-Website aus content/ + templates/ nach dist/.

Aufruf:  python build.py            → baut nach dist/
         python build.py --serve    → baut und startet http://localhost:8000
"""
import datetime
import re
import shutil
import sys
from pathlib import Path

import yaml
from jinja2 import ChainableUndefined, Environment, FileSystemLoader, select_autoescape
from markupsafe import Markup
from PIL import Image, ImageOps
from pillow_heif import register_heif_opener

register_heif_opener()  # iPhone-Fotos (HEIC/HEIF) lesbar machen

ROOT = Path(__file__).parent
CONTENT = ROOT / "content"
DIST = ROOT / "dist"
BILDER = ROOT / "bilder"

# Bilder, deren längere Seite darüber liegt, werden verkleinert
MAX_KANTE = 1600
JPEG_QUALITAET = 82
WEBP_QUALITAET = 78
BILD_ENDUNGEN = {".jpg", ".jpeg", ".png", ".webp", ".heic", ".heif"}
# Formate, die Browser nicht zuverlässig anzeigen → werden immer in JPEG umgewandelt
NACH_JPEG = {".heic", ".heif"}

# Blöcke, die für sich stehen; alle anderen gehören zum vorangehenden „abschnitt“
EIGENSTAENDIG = {"hero", "seitenkopf", "cta", "html_bereich", "kennzahlen"}


def lade_yaml(pfad):
    with open(pfad, encoding="utf-8") as f:
        return yaml.safe_load(f) or {}


def bildpfad(p):
    """CMS kann '/bilder/x.jpg' oder 'bilder/x.jpg' schreiben – relativ ausgeben.
    HEIC/HEIF-Bilder werden beim Build zu JPEG, der Pfad zeigt dann auf die .jpg-Datei."""
    p = (p or "").lstrip("/")
    stamm, punkt, endung = p.rpartition(".")
    if punkt and "." + endung.lower() in NACH_JPEG:
        return stamm + ".jpg"
    return p


MONATE = ["Januar", "Februar", "März", "April", "Mai", "Juni", "Juli", "August",
          "September", "Oktober", "November", "Dezember"]


def als_datum(wert):
    if isinstance(wert, datetime.datetime):
        return wert.date()
    if isinstance(wert, datetime.date):
        return wert
    try:
        return datetime.date.fromisoformat(str(wert)[:10])
    except ValueError:
        return None


def datum_de(wert):
    d = als_datum(wert)
    return f"{d.day}. {MONATE[d.month - 1]} {d.year}" if d else ""


def basis_url(url):
    url = (url or "").strip()
    return url if url.endswith("/") else url + "/"


def lade_neuigkeiten():
    """content/neuigkeiten/*.md: YAML-Kopf zwischen '---' + Text (HTML) darunter."""
    posts = []
    for pfad in sorted((CONTENT / "neuigkeiten").glob("*.md")):
        roh = pfad.read_text(encoding="utf-8")
        kopf, inhalt = {}, roh
        teile = re.match(r"^---\s*\n(.*?)\n---\s*\n?(.*)$", roh, re.S)
        if teile:
            kopf = yaml.safe_load(teile.group(1)) or {}
            inhalt = teile.group(2)
        if kopf.get("entwurf"):
            continue
        kopf["inhalt"] = inhalt.strip()
        kopf["datum"] = als_datum(kopf.get("datum")) or datetime.date.min
        kopf["datei"] = f"neuigkeiten-{pfad.stem}.html"
        posts.append(kopf)
    posts.sort(key=lambda p: p["datum"], reverse=True)
    return posts


# Farben für Diagramme (Feld „farbe“ im CMS)
FARBEN = {"gruen": "var(--green)", "ocker": "var(--amber)", "grau": "#adae9c", "hell": "#d3d3c6"}
FARBFOLGE = ["gruen", "ocker", "grau", "hell"]


def farbwert(name, index=0):
    return FARBEN.get(name) or FARBEN[FARBFOLGE[index % len(FARBFOLGE)]]


def euro(betrag):
    """60 → '60', 1.5 → '1,50'."""
    try:
        zahl = float(betrag)
    except (TypeError, ValueError):
        return str(betrag or "")
    return str(int(zahl)) if zahl == int(zahl) else f"{zahl:.2f}".replace(".", ",")


def torte(posten):
    """Kreisdiagramm als CSS-Verlauf, Anteile aus den Beträgen berechnet."""
    posten = [p for p in posten or [] if p.get("betrag")]
    summe = sum(float(p["betrag"]) for p in posten) or 1
    teile, start = [], 0.0
    for i, p in enumerate(posten):
        ende = 100.0 if i == len(posten) - 1 else start + float(p["betrag"]) / summe * 100
        teile.append(f"{farbwert(p.get('farbe'), i)} {start:.2f}% {ende:.2f}%")
        start = ende
    return f"conic-gradient({', '.join(teile)})"


def nbsp(text):
    return Markup((text or "").replace(" ", "&nbsp;"))


def zentrale_werte(e):
    """Einstellungen → Zentrale Kostenwerte: z = Zahlen, k = formatiert ('1,50')."""
    z = {x["schluessel"]: x["betrag"] for x in e.get("kosten") or [] if x.get("schluessel")}
    return {name: euro(wert) for name, wert in z.items()}, z


def platzhalter_einsetzen(daten, env, kontext):
    """Ersetzt {{ k.name }} / {{ z.name }} / {{ e.name }} in allen Texten (rekursiv)."""
    if isinstance(daten, str):
        return str(env.from_string(daten).render(**kontext)) if "{{" in daten else daten
    if isinstance(daten, list):
        return [platzhalter_einsetzen(x, env, kontext) for x in daten]
    if isinstance(daten, dict):
        return {key: platzhalter_einsetzen(x, env, kontext) for key, x in daten.items()}
    return daten


def bloecke_vorbereiten(bloecke, z):
    """Kostendiagramm: Posten mit „Zentraler Wert“ bekommen ihren Betrag aus den Einstellungen."""
    for b in bloecke or []:
        if b.get("type") == "kostendiagramm":
            for p in b.get("posten") or []:
                if p.get("kosten") in z:
                    p["betrag"] = z[p["kosten"]]
    return bloecke


def iban_gueltig(iban):
    roh = re.sub(r"\s+", "", iban or "").upper()
    if not re.fullmatch(r"[A-Z]{2}\d{2}[A-Z0-9]{11,30}", roh) or set(roh[4:]) == {"0"}:
        return False
    umgestellt = roh[4:] + roh[:4]
    return int("".join(str(int(c, 36)) for c in umgestellt)) % 97 == 1


def girocode_erzeugen(e):
    """QR-Code für Banking-Apps (EPC069-12). Nur bei gültiger IBAN – nie für den Platzhalter."""
    if not iban_gueltig(e.get("iban")):
        return None
    import segno

    zeilen = ["BCD", "002", "1", "SCT", re.sub(r"\s+", "", e.get("bic") or ""), (e.get("kontoinhaber") or "")[:70],
              re.sub(r"\s+", "", e["iban"]).upper(), "", "", "", e.get("girocode_zweck") or "Spende"]
    segno.make("\n".join(zeilen), error="m", micro=False).save(
        str(DIST / "girocode.svg"), scale=4, border=2, dark="#181a17", light="#ffffff")
    return "girocode.svg"


def baue_env(einstellungen):
    env = Environment(
        loader=FileSystemLoader(ROOT / "templates"),
        autoescape=select_autoescape(["html"]),
        undefined=ChainableUndefined,  # fehlende (leere) Felder sind erlaubt
        keep_trailing_newline=False,
    )
    env.filters["bild"] = bildpfad
    env.filters["nbsp"] = nbsp
    env.filters["datum_de"] = datum_de
    env.filters["euro"] = euro
    env.filters["torte"] = torte
    env.filters["farbwert"] = farbwert
    env.filters["basis_url"] = basis_url
    # HTML-Blöcke dürfen {{ e.iban }}, {{ e.paypal_link }} usw. verwenden
    k, z = zentrale_werte(einstellungen)
    env.filters["roh"] = lambda html: Markup(env.from_string(html or "").render(e=einstellungen, k=k, z=z))
    return env


def render_block(env, b, **extra):
    vorlage = env.get_template(f"blocks/{b['type']}.html")
    return vorlage.render(b=b, **extra)


def render_bloecke(env, bloecke):
    """Gruppiert die flache Blockliste in Abschnitte und rendert sie."""
    teile, abschnitt, kinder = [], None, []

    def abschliessen():
        nonlocal abschnitt, kinder
        if abschnitt is not None:
            teile.append(render_block(env, abschnitt, kinder=Markup("\n".join(kinder))))
        else:
            teile.extend(kinder)
        abschnitt, kinder = None, []

    for b in bloecke or []:
        typ = b.get("type")
        if typ == "abschnitt":
            abschliessen()
            abschnitt = b
        elif typ in EIGENSTAENDIG:
            abschliessen()
            teile.append(render_block(env, b))
        else:
            kinder.append(render_block(env, b))
    abschliessen()
    return Markup("\n".join(teile))


def popups_sammeln(bloecke):
    daten = {}
    for b in bloecke or []:
        if b.get("type") != "projektkacheln":
            continue
        for k in b.get("kacheln") or []:
            p = k.get("popup") or {}
            daten[k["schluessel"]] = {
                "img": bildpfad(p.get("bild") or k.get("bild")),
                "title": p.get("titel") or k.get("titel"),
                "body": p.get("text") or "",
                "href": p.get("link") or "#",
                "label": p.get("linktext") or "Mehr erfahren",
            }
    return daten


def bilder_kopieren():
    ziel = DIST / "bilder"
    ziel.mkdir(parents=True, exist_ok=True)
    for quelle in sorted(BILDER.rglob("*")):
        if not quelle.is_file() or quelle.suffix.lower() not in BILD_ENDUNGEN:
            continue
        out = ziel / quelle.relative_to(BILDER)
        umwandeln = quelle.suffix.lower() in NACH_JPEG
        if umwandeln:
            out = out.with_suffix(".jpg")
        out.parent.mkdir(parents=True, exist_ok=True)
        with Image.open(quelle) as im:
            zu_gross = max(im.size) > MAX_KANTE
            hat_gps = 0x8825 in im.getexif()  # GPS-Koordinaten im EXIF
            if not (zu_gross or hat_gps or umwandeln):
                shutil.copy2(quelle, out)
                continue
            # Drehen nach EXIF, verkleinern, ohne Metadaten (u. a. GPS) speichern
            im = ImageOps.exif_transpose(im)
            im.thumbnail((MAX_KANTE, MAX_KANTE))
            if umwandeln or quelle.suffix.lower() in {".jpg", ".jpeg"}:
                im.convert("RGB").save(out, "JPEG", quality=JPEG_QUALITAET, optimize=True, progressive=True)
            else:
                im.save(out)
            print(f"  Bild optimiert: {quelle.name} → {out.name} {im.size[0]}×{im.size[1]}")
    # Zusätzlich WebP (deutlich kleiner); die Seiten verweisen darauf, JPEG/PNG bleiben als Rückfall liegen
    for bild in sorted(ziel.rglob("*")):
        if bild.suffix.lower() not in {".jpg", ".jpeg", ".png"}:
            continue
        webp = bild.with_suffix(".webp")
        if webp.exists():
            continue  # gleichnamige .webp-Datei wurde hochgeladen
        with Image.open(bild) as im:
            im.save(webp, "WEBP", quality=WEBP_QUALITAET, method=4)
        if webp.stat().st_size >= bild.stat().st_size:
            webp.unlink()


def webp_verweise(html):
    """Bildverweise auf die WebP-Fassung umstellen, wo es eine gibt (nicht im Teilen-Vorschaubild)."""
    def ersetze(treffer):
        pfad = treffer.group(2)
        webp = (DIST / pfad).with_suffix(".webp")
        return treffer.group(1) + (str(webp.relative_to(DIST)) if webp.is_file() else pfad) + treffer.group(3)
    return re.sub(r'((?:src="|"img":\s*"))(bilder/[^"]+\.(?:jpe?g|png))(")', ersetze, html, flags=re.I)


def verweise_pruefen():
    """Bricht ab, wenn eine Seite auf ein fehlendes Bild oder eine fehlende Seite verweist."""
    fehlend = []
    muster = re.compile(r'(?:src|href)="([^"]+)"|"img":\s*"([^"]+)"')
    for seite in sorted(DIST.glob("*.html")):
        for treffer in muster.finditer(seite.read_text(encoding="utf-8")):
            ziel = (treffer.group(1) or treffer.group(2)).split("#")[0].split("?")[0]
            if not ziel or re.match(r"^[a-z]+:|^//", ziel):
                continue  # externe Links, mailto:, tel:, reine Sprungmarken
            if not (DIST / ziel).is_file():
                fehlend.append(f"{seite.name}: {ziel}")
    if fehlend:
        print("\nFEHLER – Verweis auf nicht vorhandene Datei:")
        for f in fehlend:
            print("  " + f)
        print("Bild hochladen bzw. Dateinamen/Link im CMS korrigieren.")
        sys.exit(1)


def main():
    if DIST.exists():
        shutil.rmtree(DIST)
    DIST.mkdir()

    e = lade_yaml(CONTENT / "einstellungen.yml")
    env = baue_env(e)
    k, z = zentrale_werte(e)
    kontext = {"e": e, "k": k, "z": z}
    e["wirkungsrechner"] = platzhalter_einsetzen(e.get("wirkungsrechner"), env, kontext)
    e["girocode"] = girocode_erzeugen(e)
    base = env.get_template("base.html")
    seiten = {}
    neuigkeiten = lade_neuigkeiten()
    env.globals["neuigkeiten"] = neuigkeiten

    for pfad in sorted((CONTENT / "seiten").glob("*.yml")):
        seite = lade_yaml(pfad)
        # HTML-Blöcke werden beim Rendern aufgelöst (dort sind auch {% if %}-Anweisungen erlaubt)
        seite["bloecke"] = bloecke_vorbereiten(
            [b if b.get("type") in ("html", "html_bereich") else platzhalter_einsetzen(b, env, kontext)
             for b in seite.get("bloecke") or []], z)
        datei = pfad.stem + ".html"
        html = base.render(
            seite=seite,
            e=e,
            datei=datei,
            inhalt=render_bloecke(env, seite.get("bloecke")),
            popups=popups_sammeln(seite.get("bloecke")),
        )
        seiten[datei] = html
        print(f"Seite: {datei}")

    artikel = env.get_template("neuigkeit.html")
    for n in neuigkeiten:
        seite = {"seitentitel": f"{n.get('titel', '')} | One for One", "beschreibung": n.get("kurztext", ""),
                 "teilen_bild": n.get("bild"), "artikel": True}
        html = base.render(seite=seite, e=e, datei=n["datei"], popups={},
                           inhalt=Markup(artikel.render(n=n, e=e)))
        seiten[n["datei"]] = html
        print(f"Neuigkeit: {n['datei']}")

    shutil.copytree(ROOT / "static", DIST, dirs_exist_ok=True)
    bilder_kopieren()
    for datei, html in seiten.items():
        (DIST / datei).write_text(webp_verweise(html), encoding="utf-8")
    (DIST / ".nojekyll").touch()
    verweise_pruefen()
    print("Fertig → dist/")

    if "--serve" in sys.argv:
        import functools
        import http.server

        handler = functools.partial(http.server.SimpleHTTPRequestHandler, directory=str(DIST))
        print("http://localhost:8000  (Strg+C beendet)")
        http.server.ThreadingHTTPServer(("", 8000), handler).serve_forever()


if __name__ == "__main__":
    main()
