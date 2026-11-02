"""Export the configured KinCony F16 inputs as PDF and editable Word.

Usage: python scripts/generate-kincony-input-map.py [ESPHome include directory]
Reads input definitions only; never exports credentials from the main configuration.
"""
import hashlib
import json
from pathlib import Path
import sys
from xml.sax.saxutils import escape

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "artifacts/manual-tools"))
import yaml
from docx import Document
from docx.shared import Inches, Pt, RGBColor
from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak
from reportlab.graphics.shapes import Drawing, Rect, String, Line, Polygon

SOURCE = Path(sys.argv[1]) if len(sys.argv) > 1 else ROOT.parent / "OpenBoat/esphome/includes/openboat-f16"
OUT = ROOT / "docs"
DATE = "27/10/2026"
PREFIX = "open-boad-kincony-relay"
source_files = {kind: SOURCE / f"{PREFIX}-{kind}.yaml" for kind in ("binary-sensors", "sensors", "pcf8574")}
binary = yaml.safe_load(source_files["binary-sensors"].read_text(encoding="utf-8"))
analog = yaml.safe_load(source_files["sensors"].read_text(encoding="utf-8"))
hubs = yaml.safe_load(source_files["pcf8574"].read_text(encoding="utf-8"))
inputs = [entry for entry in binary if "pcf8574" in entry.get("pin", {})]
extra = [entry for entry in binary if "pcf8574" not in entry.get("pin", {})]
assert len(inputs) == 16 and len(extra) == 7 and len(analog) == 4
assert sorted(entry["pin"]["number"] for entry in inputs) == list(range(16))
input_hub = next(hub for hub in hubs if hub["id"] == inputs[0]["pin"]["pcf8574"])
assert input_hub["address"] == 0x24 and input_hub["pcf8575"] is True

functions = ["Autopiloto", "VHF", "Sistema", "AIS", "Agua", "Sentina (bielge)", "Frigorífico", "Internet",
             "Audio / estéreo", "USB", "Confort", "Luces de navegación", "Luces de fondeo", "Luces de cubierta", "Luces de cabina", "LEDs"]
digital_rows = [[f"DI{entry['pin']['number'] + 1:02}", functions[entry["pin"]["number"]], str(entry["pin"]["number"]), entry["id"]]
                for entry in inputs]
extra_rows = [[entry["name"], f"GPIO{entry['pin']['number']}", "Sí" if entry["pin"]["inverted"] else "No", "Sin función de barco asignada"] for entry in extra]
analog_rows = []
for i, entry in enumerate(analog, 1):
    analog_rows.append([f"A{i}", f"GPIO{entry['pin']}", "0–5 V" if i < 3 else "4–20 mA", entry["id"], "V (ADC)" if i < 3 else "mA; ×6,66666666"])

snapshot = {"board": "KinCony F16 / ESP32-S3", "date": DATE,
            "digital": digital_rows, "additional_gpio": extra_rows, "analog": analog_rows,
            "input_expander": input_hub,
            "sources": [{"path": str(path), "sha256": hashlib.sha256(path.read_bytes()).hexdigest()} for path in source_files.values()]}
(OUT / "kincony-input-map.json").write_text(json.dumps(snapshot, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")

navy = colors.HexColor("#143249")
teal = colors.HexColor("#147D85")
styles = getSampleStyleSheet()
styles.add(ParagraphStyle(name="MapBody", fontName="Helvetica", fontSize=9, leading=13, spaceAfter=8))
styles.add(ParagraphStyle(name="MapCell", fontName="Helvetica", fontSize=7.5, leading=10))
styles.add(ParagraphStyle(name="MapHeader", fontName="Helvetica-Bold", textColor=colors.white, fontSize=8, leading=10))
styles["Title"].textColor = navy
styles["Heading2"].textColor = teal
pdf_path = OUT / "Mapeo-entradas-KinCony-F16.pdf"
word_path = OUT / "Mapeo-entradas-KinCony-F16.docx"
story = []
word = Document()
section = word.sections[0]
section.top_margin = section.bottom_margin = Inches(0.6)
section.left_margin = section.right_margin = Inches(0.6)
word.styles["Normal"].font.name = "Calibri"
word.styles["Normal"].font.size = Pt(9)
word.styles["Normal"].paragraph_format.space_after = Pt(6)
for name in ["Title", "Heading 1", "Heading 2"]:
    word.styles[name].font.color.rgb = RGBColor.from_string("143249")

def title(text):
    story.append(Paragraph(escape(text), styles["Title"]))
    word.add_heading(text, 0)

def heading(text):
    story.append(Paragraph(escape(text), styles["Heading2"]))
    word.add_heading(text, 1)

def paragraph(text):
    story.append(Paragraph(escape(text), styles["MapBody"]))
    word.add_paragraph(text)

def table(headers, rows, widths):
    cells = [[Paragraph(escape(str(item)), styles["MapHeader"] if index == 0 else styles["MapCell"])
              for item in row] for index, row in enumerate([headers] + rows)]
    result = Table(cells, colWidths=widths, repeatRows=1, hAlign="LEFT")
    result.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), navy), ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, colors.HexColor("#edf3f6")]),
        ("VALIGN", (0, 0), (-1, -1), "TOP"), ("LEFTPADDING", (0, 0), (-1, -1), 6),
        ("RIGHTPADDING", (0, 0), (-1, -1), 6), ("TOPPADDING", (0, 0), (-1, -1), 5), ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
        ("LINEBELOW", (0, 0), (-1, 0), 0.5, teal),
    ]))
    story.extend([result, Spacer(1, 9)])
    doc_table = word.add_table(rows=1, cols=len(headers))
    doc_table.style = "Light Shading Accent 1"
    for cell, label in zip(doc_table.rows[0].cells, headers):
        cell.text = label
    for row in rows:
        for cell, value in zip(doc_table.add_row().cells, row):
            cell.text = str(value)
    word.add_paragraph()

def page():
    story.append(PageBreak())
    word.add_page_break()

title("KinCony F16 · Mapeo de entradas")
paragraph(f"OpenBoat / NavMarina · Documento de referencia · {DATE}")
paragraph("Basado en los archivos ESPHome locales del proyecto OpenBoat. Describe la configuración encontrada; no certifica el cableado real ni que esta versión esté instalada en la placa.")
heading("1. Entradas digitales DI01–DI16")
paragraph("Todas usan el expansor PCF8575, dirección I²C 0x24, identificado como pcf8574_hub_in_1. El campo number es el pin del expansor (0–15), no un GPIO del ESP32.")
drawing = Drawing(520, 44)
for x, label in [(0, "DI01–DI16"), (180, "PCF8575 · 0x24"), (360, "ESPHome / OpenBoat")]:
    drawing.add(Rect(x, 8, 160, 28, rx=5, fillColor=colors.HexColor("#edf3f6"), strokeColor=teal))
    drawing.add(String(x + 80, 18, label, textAnchor="middle", fontName="Helvetica-Bold", fontSize=9, fillColor=navy))
for x in [160, 340]:
    drawing.add(Line(x + 2, 22, x + 16, 22, strokeColor=teal))
    drawing.add(Polygon([x + 18, 22, x + 13, 25, x + 13, 19], fillColor=teal, strokeColor=teal))
story.extend([drawing, Spacer(1, 5)])
word.add_paragraph("DI01–DI16 → PCF8575 (0x24) → ESPHome / OpenBoat")
table(["Entrada", "Función por nombre", "Pin", "ID de ESPHome"], digital_rows, [44, 127, 35, 317])
paragraph("Todas están configuradas como INPUT e inverted: true: un nivel eléctrico bajo se interpreta como estado lógico ON. Las funciones se deducen de los nombres configurados; no demuestran qué dispositivo está conectado físicamente. Se conserva la grafía original bin_bielge_in.")

page()
title("GPIO adicionales y entradas analógicas")
heading("2. Entradas GPIO adicionales")
table(["Nombre configurado", "GPIO", "Invertida", "Asignación"], extra_rows, [124, 58, 54, 287])
paragraph("GPIO48, 47, 21 y 15 corresponden a conectores 1-Wire con resistencia pull-up en la placa; GPIO13 y 14 a conectores sin esa resistencia, según KinCony. Aquí están configurados como sensores binarios GPIO, no como un bus 1-Wire. GPIO40 corresponde al receptor de 433 MHz.")
heading("3. Entradas analógicas")
table(["Entrada", "GPIO", "Tipo físico", "ID ESPHome", "Salida configurada"], analog_rows, [43, 53, 62, 131, 234])
paragraph("Los rangos físicos de A1/A2 (0–5 V) y A3/A4 (4–20 mA) proceden del pinout del fabricante. Los cuatro ADC se actualizan cada 5 segundos y usan attenuation: 11db en los archivos locales.")
paragraph("A1/A2 no tienen filtros de conversión ni calibración en el YAML encontrado: la lectura del ADC no debe interpretarse automáticamente como tensión de batería. A3/A4 aplican únicamente un factor ×6,66666666 y etiquetan la salida en mA. No consta una conversión a temperatura, presión o porcentaje de combustible.")
paragraph("Estas entradas analógicas no están asignadas a sensores concretos del barco en la configuración revisada.")

page()
title("Alcance y trazabilidad")
heading("4. Qué está definido y qué falta confirmar")
paragraph("Las 16 entradas digitales tienen nombres de servicios del barco. Las siete entradas GPIO adicionales y las cuatro analógicas conservan nombres genéricos; no se les asigna aquí una función que no figure en el YAML.")
paragraph("El archivo local openboat_engine_hours.yaml, en Descargas, referencia binary_sensor.open_boad_kincony_relay_bin_engine_on_in para contar horas de motor. No se ha encontrado una definición bin_engine_on_in ni un borne asociado en los archivos de entradas F16 revisados. Por tanto, su entrada física queda pendiente de confirmar.")
paragraph("El mapeo de los relojes y alarmas del motor en NavMarina es independiente de este listado de bornes. Los archivos F16 revisados no declaran un puente de estas entradas hacia PGN NMEA 2000 o rutas de Signal K. No se debe asumir, por ejemplo, que bin_water_in sea la alarma de temperatura del refrigerante.")
heading("5. Archivos utilizados")
paragraph("Configuración principal: C:/Users/Pc/Projects/OpenBoat/esphome/open-boad-kincony-relay.yaml. Sus inclusiones apuntan a esphome/includes/openboat-f16/.")
for kind, path in source_files.items():
    paragraph(path.name)
paragraph(f"Carpeta de origen: {SOURCE.as_posix()}")
paragraph("Bus I²C declarado en la configuración principal: SDA GPIO8, SCL GPIO18, frecuencia 400 kHz. El expansor de salidas está en 0x25; sus relés quedan fuera del alcance de este documento.")
heading("6. Referencias técnicas")
for label, url in [
    ("Pinout del fabricante KinCony F16", "https://www.kincony.com/forum/showthread.php?tid=6814"),
    ("Ejemplo de configuración ESPHome F16", "https://devices.esphome.io/devices/kincony-f16/"),
]:
    story.append(Paragraph(f'<b>{escape(label)}</b><br/><link href="{url}" color="#147D85">{url}</link>', styles["MapBody"]))
    word.add_paragraph(f"{label}: {url}")
paragraph("Se conservan los identificadores exactos de ESPHome. Los entity_id de Home Assistant pueden variar según el registro de entidades y no se dan por confirmados. No se incluyen contraseñas, claves ni datos de acceso.")
paragraph("El archivo kincony-input-map.json conserva las tablas y las huellas SHA-256 de los tres archivos de origen para identificar la versión documentada.")

def footer(canvas, document):
    canvas.setFont("Helvetica", 8)
    canvas.setFillColor(colors.HexColor("#59717D"))
    canvas.drawString(36, 23, f"OpenBoat · KinCony F16 · {DATE}")
    canvas.drawRightString(A4[0] - 36, 23, str(document.page))

SimpleDocTemplate(str(pdf_path), pagesize=A4, rightMargin=36, leftMargin=36, topMargin=32, bottomMargin=38,
                  title="Mapeo de entradas KinCony F16", author="OpenBoat").build(story, onFirstPage=footer, onLaterPages=footer)
word.save(word_path)
import pymupdf
with pymupdf.open(pdf_path) as pdf:
    assert len(pdf) == 3, f"Unexpected pagination: {len(pdf)} pages"
    extracted = "\n".join(p.get_text() for p in pdf)
    for entry in inputs:
        assert entry["id"] in extracted
    assert "sensor_adc_4" in extracted and "GPIO48" in extracted
    pdf[0].get_pixmap(matrix=pymupdf.Matrix(1.3, 1.3)).save(ROOT / "artifacts/kincony-input-map-preview.png")
print(f"Generated and checked: {pdf_path.name}, {word_path.name} (3 pages; 16 DI, 7 GPIO, 4 analog inputs).")
