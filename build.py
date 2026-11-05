#!/usr/bin/env python3
"""Baut die One-for-One-Website aus content/ + templates/ nach dist/.

Aufruf:  python build.py            → baut nach dist/
         python build.py --serve    → baut und startet http://localhost:8000
"""
import shutil
import sys
from pathlib import Path

import yaml
from jinja2 import ChainableUndefined, Environment, FileSystemLoader, select_autoescape
from markupsafe import Markup
from PIL import Image, ImageOps

ROOT = Path(__file__).parent
CONTENT = ROOT / "content"
DIST = ROOT / "dist"
BILDER = ROOT / "bilder"

# Bilder, deren längere Seite darüber liegt, werden verkleinert
MAX_KANTE = 1600
JPEG_QUALITAET = 82
BILD_ENDUNGEN = {".jpg", ".jpeg", ".png", ".webp"}

# Blöcke, die für sich stehen; alle anderen gehören zum vorangehenden „abschnitt“
EIGENSTAENDIG = {"hero", "seitenkopf", "cta", "html_bereich"}


def lade_yaml(pfad):
    with open(pfad, encoding="utf-8") as f:
        return yaml.safe_load(f) or {}


def bildpfad(p):
    """CMS kann '/bilder/x.jpg' oder 'bilder/x.jpg' schreiben – relativ ausgeben."""
    return (p or "").lstrip("/")


def nbsp(text):
    return Markup((text or "").replace(" ", "&nbsp;"))


def baue_env(einstellungen):
    env = Environment(
        loader=FileSystemLoader(ROOT / "templates"),
        autoescape=select_autoescape(["html"]),
        undefined=ChainableUndefined,  # fehlende (leere) Felder sind erlaubt
        keep_trailing_newline=False,
    )
    env.filters["bild"] = bildpfad
    env.filters["nbsp"] = nbsp
    # HTML-Blöcke dürfen {{ e.iban }}, {{ e.paypal_link }} usw. verwenden
    env.filters["roh"] = lambda html: Markup(env.from_string(html or "").render(e=einstellungen))
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
        out.parent.mkdir(parents=True, exist_ok=True)
        with Image.open(quelle) as im:
            zu_gross = max(im.size) > MAX_KANTE
            hat_gps = 0x8825 in im.getexif()  # GPS-Koordinaten im EXIF
            if not (zu_gross or hat_gps):
                shutil.copy2(quelle, out)
                continue
            # Drehen nach EXIF, verkleinern, ohne Metadaten (u. a. GPS) speichern
            im = ImageOps.exif_transpose(im)
            im.thumbnail((MAX_KANTE, MAX_KANTE))
            if quelle.suffix.lower() in {".jpg", ".jpeg"}:
                im.convert("RGB").save(out, "JPEG", quality=JPEG_QUALITAET, optimize=True, progressive=True)
            else:
                im.save(out)
            print(f"  Bild optimiert: {quelle.name} → {im.size[0]}×{im.size[1]}")


def main():
    if DIST.exists():
        shutil.rmtree(DIST)
    DIST.mkdir()

    e = lade_yaml(CONTENT / "einstellungen.yml")
    env = baue_env(e)
    base = env.get_template("base.html")

    for pfad in sorted((CONTENT / "seiten").glob("*.yml")):
        seite = lade_yaml(pfad)
        datei = pfad.stem + ".html"
        html = base.render(
            seite=seite,
            e=e,
            datei=datei,
            inhalt=render_bloecke(env, seite.get("bloecke")),
            popups=popups_sammeln(seite.get("bloecke")),
        )
        (DIST / datei).write_text(html, encoding="utf-8")
        print(f"Seite: {datei}")

    for f in (ROOT / "static").iterdir():
        if f.is_file():
            shutil.copy2(f, DIST / f.name)
    bilder_kopieren()
    (DIST / ".nojekyll").touch()
    print("Fertig → dist/")

    if "--serve" in sys.argv:
        import functools
        import http.server

        handler = functools.partial(http.server.SimpleHTTPRequestHandler, directory=str(DIST))
        print("http://localhost:8000  (Strg+C beendet)")
        http.server.ThreadingHTTPServer(("", 8000), handler).serve_forever()


if __name__ == "__main__":
    main()
