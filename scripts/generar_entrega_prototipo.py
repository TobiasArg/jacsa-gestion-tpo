#!/usr/bin/env python3
"""Regenerate the validation DOCX files and attach the local demo evidence."""

from __future__ import annotations

import importlib.util
import os
import re
import struct
import sys
import tempfile
import zipfile
from pathlib import Path
from xml.etree import ElementTree as ET
from xml.sax.saxutils import escape


ROOT = Path(__file__).resolve().parent.parent
SCRIPTS = ROOT / "scripts"
OUT = ROOT / "entregables"
DOCS = ROOT / "documentacion"
SOURCE_DOCX = ROOT / "TPO General.docx"
CHAPTER_DOCX = OUT / "TPO General - Validacion.docx"
SECTION_DOCX = OUT / "Seccion 4 - Validacion.docx"
SCRIPT_DOCX = OUT / "Guion de presentacion.docx"
EVIDENCE_DOCX = OUT / "Prototipo - Evidencias.docx"
CHAPTER_MD = DOCS / "capitulo-4-validacion.md"
SCRIPT_MD = DOCS / "guion-presentacion.md"
EVIDENCE_MD = DOCS / "evidencias-prototipo.md"
SCREENSHOT_DIR = ROOT / "evidencias" / "prototipo"
SCREENSHOTS = (
    "01cotizador.png",
    "02cotizacion.png",
    "03stockfaltante.png",
    "04tableropedidos.png",
    "05operariocola.png",
    "06portalcliente.png",
    "07mobilelogin.png",
)

W = "http://schemas.openxmlformats.org/wordprocessingml/2006/main"
WP = "http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing"
A = "http://schemas.openxmlformats.org/drawingml/2006/main"
PIC = "http://schemas.openxmlformats.org/drawingml/2006/picture"
R = "http://schemas.openxmlformats.org/officeDocument/2006/relationships"
IMAGE_REL_TYPE = f"{R}/image"
PNG_DEFAULT = b'<Default Extension="png" ContentType="image/png"/>'
MAX_IMAGE_WIDTH_DXA = 8504
MAX_IMAGE_HEIGHT_EMU = 6_000_000
EMU_PER_PIXEL = 9525
EMU_PER_DXA = 635


def load_document_generator():
    path = SCRIPTS / "generar_documentos.py"
    spec = importlib.util.spec_from_file_location("generar_documentos", path)
    if spec is None or spec.loader is None:
        raise RuntimeError(f"No se pudo importar el generador base: {path}")
    module = importlib.util.module_from_spec(spec)
    sys.modules[spec.name] = module
    spec.loader.exec_module(module)
    return module


def body_child_count(document_xml: bytes) -> int:
    root = ET.fromstring(document_xml)
    body = root.find(f"{{{W}}}body")
    if body is None:
        raise ValueError("word/document.xml no contiene w:body")
    children = list(body)
    if not children or children[-1].tag != f"{{{W}}}sectPr":
        raise ValueError("El cuerpo del DOCX no termina con sectPr")
    return len(children) - 1


def fragment_element_count(fragment: str) -> int:
    wrapped = f'<w:body xmlns:w="{W}">{fragment}</w:body>'.encode("utf-8")
    return len(list(ET.fromstring(wrapped)))


def image_dimensions(image_bytes: bytes) -> tuple[int, int]:
    if len(image_bytes) < 24 or image_bytes[:8] != b"\x89PNG\r\n\x1a\n" or image_bytes[12:16] != b"IHDR":
        raise ValueError("La evidencia no es un PNG válido con encabezado IHDR")
    width, height = struct.unpack(">II", image_bytes[16:24])
    if width < 1 or height < 1:
        raise ValueError("Dimensiones PNG inválidas")
    return width, height


def picture_extent(image_bytes: bytes, content_width_dxa: int) -> tuple[int, int]:
    width_px, height_px = image_dimensions(image_bytes)
    max_width = min(MAX_IMAGE_WIDTH_DXA, content_width_dxa) * EMU_PER_DXA
    max_height = MAX_IMAGE_HEIGHT_EMU
    scale = min(max_width / (width_px * EMU_PER_PIXEL), max_height / (height_px * EMU_PER_PIXEL))
    return int(width_px * EMU_PER_PIXEL * scale), int(height_px * EMU_PER_PIXEL * scale)


def next_relationship_id(rels_root: ET.Element) -> int:
    largest = 0
    for relationship in rels_root:
        match = re.fullmatch(r"rId(\d+)", relationship.attrib.get("Id", ""))
        if match:
            largest = max(largest, int(match.group(1)))
    return largest + 1


def image_paragraph(name: str, relationship_id: str, image_bytes: bytes, content_width_dxa: int, drawing_id: int) -> str:
    cx, cy = picture_extent(image_bytes, content_width_dxa)
    safe_name = escape(name, {'"': "&quot;"})
    namespaces = f'xmlns:w="{W}" xmlns:wp="{WP}" xmlns:a="{A}" xmlns:pic="{PIC}" xmlns:r="{R}"'
    drawing = (
        f'<w:drawing {namespaces}>'
        '<wp:inline distT="0" distB="0" distL="0" distR="0">'
        f'<wp:extent cx="{cx}" cy="{cy}"/>'
        '<wp:effectExtent l="0" t="0" r="0" b="0"/>'
        f'<wp:docPr id="{drawing_id}" name="{safe_name}" descr="Captura local del prototipo"/>'
        '<wp:cNvGraphicFramePr><a:graphicFrameLocks noChangeAspect="1"/></wp:cNvGraphicFramePr>'
        '<a:graphic><a:graphicData uri="http://schemas.openxmlformats.org/drawingml/2006/picture">'
        '<pic:pic>'
        f'<pic:nvPicPr><pic:cNvPr id="{drawing_id}" name="{safe_name}"/>'
        '<pic:cNvPicPr><a:picLocks noChangeAspect="1"/></pic:cNvPicPr></pic:nvPicPr>'
        f'<pic:blipFill><a:blip r:embed="{relationship_id}"/>'
        '<a:stretch><a:fillRect/></a:stretch></pic:blipFill>'
        f'<pic:spPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="{cx}" cy="{cy}"/></a:xfrm>'
        '<a:prstGeom prst="rect"><a:avLst/></a:prstGeom></pic:spPr>'
        '</pic:pic></a:graphicData></a:graphic></wp:inline></w:drawing>'
    )
    return f'<w:p><w:pPr><w:jc w:val="center"/></w:pPr><w:r>{drawing}</w:r></w:p>'


def centered_caption(generator, text: str) -> str:
    return (
        '<w:p><w:pPr><w:jc w:val="center"/></w:pPr>'
        f'{generator.inline_xml(text, 20, bold=True)}</w:p>'
    )


def add_screenshots(generator, document_xml: bytes, rels_xml: bytes, content_types_xml: bytes):
    rels_root = ET.fromstring(rels_xml)
    existing_ids = [node.attrib.get("Id", "") for node in rels_root]
    if len(existing_ids) != len(set(existing_ids)):
        raise ValueError("El DOCX ya contiene Id de relación duplicados")

    root = ET.fromstring(document_xml)
    existing_docpr = [int(node.attrib["id"]) for node in root.iter(f"{{{WP}}}docPr") if node.attrib.get("id", "").isdigit()]
    next_drawing_id = max(existing_docpr, default=0) + 1
    page_width = generator.content_width(document_xml)
    fragment: list[str] = [generator.paragraph("Anexo visual — capturas del prototipo", "h2")]
    media_entries: dict[str, bytes] = {}
    relationships: list[tuple[str, str]] = []
    next_rid = next_relationship_id(rels_root)

    for index, filename in enumerate(SCREENSHOTS, start=1):
        source = SCREENSHOT_DIR / filename
        image_bytes = source.read_bytes()
        image_dimensions(image_bytes)
        media_name = f"word/media/prototipo-{filename}"
        if media_name in media_entries:
            raise ValueError(f"Nombre multimedia repetido: {media_name}")
        relationship_id = f"rId{next_rid}"
        next_rid += 1
        relationships.append((relationship_id, f"media/prototipo-{filename}"))
        media_entries[media_name] = image_bytes
        fragment.extend(
            (
                generator.page_break(),
                centered_caption(generator, f"Captura {index:02d} — {filename}"),
                image_paragraph(filename, relationship_id, image_bytes, page_width, next_drawing_id),
            )
        )
        next_drawing_id += 1

    rels_text = rels_xml.decode("utf-8")
    close_match = re.search(r"</(?:[A-Za-z_][\w.-]*:)?Relationships\s*>", rels_text)
    if close_match is None:
        raise ValueError("No se encontró cierre Relationships en word/_rels/document.xml.rels")
    relationship_xml = "".join(
        f'<Relationship Id="{rid}" Type="{IMAGE_REL_TYPE}" Target="{target}"/>'
        for rid, target in relationships
    )
    rels_updated = (rels_text[: close_match.start()] + relationship_xml + rels_text[close_match.start() :]).encode("utf-8")
    ET.fromstring(rels_updated)

    content_root = ET.fromstring(content_types_xml)
    has_png = any(
        node.tag.rsplit("}", 1)[-1] == "Default" and node.attrib.get("Extension", "").lower() == "png"
        for node in content_root
    )
    content_updated = content_types_xml
    if not has_png:
        content_text = content_types_xml.decode("utf-8")
        type_close = re.search(r"</(?:[A-Za-z_][\w.-]*:)?Types\s*>", content_text)
        if type_close is None:
            raise ValueError("No se encontró cierre Types en [Content_Types].xml")
        content_updated = (
            content_text[: type_close.start()] + PNG_DEFAULT.decode("ascii") + content_text[type_close.start() :]
        ).encode("utf-8")
    ET.fromstring(content_updated)

    return "".join(fragment), rels_updated, content_updated, media_entries, relationships


def write_package(target: Path, source: Path, replacements: dict[str, bytes], additions: dict[str, bytes] | None = None) -> None:
    additions = additions or {}
    fd, temp_name = tempfile.mkstemp(prefix=f".{target.name}.", suffix=".tmp", dir=OUT)
    os.close(fd)
    temporary = Path(temp_name)
    try:
        with zipfile.ZipFile(source, "r") as original:
            original_names = set(original.namelist())
            collisions = original_names.intersection(additions)
            if collisions:
                raise ValueError(f"No se reemplazan entradas existentes al adjuntar evidencias: {sorted(collisions)}")
            with zipfile.ZipFile(temporary, "w") as generated:
                generated.comment = original.comment
                for info in original.infolist():
                    payload = replacements.get(info.filename)
                    if payload is None:
                        payload = original.read(info.filename)
                    generated.writestr(info, payload)
                for name, payload in additions.items():
                    generated.writestr(name, payload, compress_type=zipfile.ZIP_DEFLATED)
        with zipfile.ZipFile(temporary, "r") as check:
            bad_entry = check.testzip()
            if bad_entry:
                raise ValueError(f"ZIP inválido en {bad_entry}")
        os.replace(temporary, target)
    finally:
        if temporary.exists():
            temporary.unlink()


def package_appendix(generator, source: Path, target: Path, report_blocks, report_shapes, report_title: str) -> None:
    with zipfile.ZipFile(source, "r") as package:
        original_document = package.read("word/document.xml")
        original_relationships = package.read("word/_rels/document.xml.rels")
        original_types = package.read("[Content_Types].xml")
        original_core = package.read("docProps/core.xml")

    appendix, rels, content_types, media, image_relationships = add_screenshots(
        generator, original_document, original_relationships, original_types
    )
    report_fragment, _ = generator.render_blocks(
        report_blocks, generator.content_width(original_document), add_page_break=True
    )
    appendix_start = body_child_count(original_document)
    report_end = appendix_start + fragment_element_count(report_fragment)
    complete_fragment = report_fragment + appendix
    updated_document = generator.splice_before_final_section(original_document, complete_fragment)
    replacements = {
        "word/document.xml": updated_document,
        "word/_rels/document.xml.rels": rels,
        "[Content_Types].xml": content_types,
        "docProps/core.xml": generator.core_with_title(original_core, report_title),
    }
    write_package(target, source, replacements, media)
    generator.validate_rendered(
        updated_document,
        report_blocks,
        report_shapes,
        appendix_start,
        f"anexo de evidencias {target.name}",
        report_end,
    )
    validate_screenshot_appendix(target, image_relationships)


def standalone_document(generator, source: Path, target: Path, blocks, shapes, title: str) -> None:
    with zipfile.ZipFile(source, "r") as package:
        original_document = package.read("word/document.xml")
        original_core = package.read("docProps/core.xml")
    page_width = generator.content_width(original_document)
    fragment, _ = generator.render_blocks(blocks, page_width, add_page_break=False)
    document = generator.standalone_document(original_document, fragment)
    replacements = {
        "word/document.xml": document,
        "docProps/core.xml": generator.core_with_title(original_core, title),
    }
    write_package(target, source, replacements)
    generator.validate_rendered(document, blocks, shapes, 0, target.name, fragment_element_count(fragment))
    validate_docx(target)


def standalone_evidence_document(generator, source: Path, target: Path, blocks, shapes, title: str) -> None:
    with zipfile.ZipFile(source, "r") as package:
        original_document = package.read("word/document.xml")
        original_relationships = package.read("word/_rels/document.xml.rels")
        original_types = package.read("[Content_Types].xml")
        original_core = package.read("docProps/core.xml")
    page_width = generator.content_width(original_document)
    report_fragment, _ = generator.render_blocks(blocks, page_width, add_page_break=False)
    appendix, rels, content_types, media, image_relationships = add_screenshots(
        generator, original_document, original_relationships, original_types
    )
    full_fragment = report_fragment + appendix
    document = generator.standalone_document(original_document, full_fragment)
    replacements = {
        "word/document.xml": document,
        "word/_rels/document.xml.rels": rels,
        "[Content_Types].xml": content_types,
        "docProps/core.xml": generator.core_with_title(original_core, title),
    }
    write_package(target, source, replacements, media)
    generator.validate_rendered(document, blocks, shapes, 0, target.name, fragment_element_count(report_fragment))
    validate_screenshot_appendix(target, image_relationships)
    validate_docx(target)


def validate_docx(path: Path) -> None:
    with zipfile.ZipFile(path, "r") as package:
        bad_entry = package.testzip()
        if bad_entry:
            raise ValueError(f"ZIP inválido en {path}: {bad_entry}")
        ET.fromstring(package.read("word/document.xml"))
        ET.fromstring(package.read("word/_rels/document.xml.rels"))
        ET.fromstring(package.read("[Content_Types].xml"))


def validate_screenshot_appendix(path: Path, new_relationships: list[tuple[str, str]]) -> None:
    with zipfile.ZipFile(path, "r") as package:
        names = set(package.namelist())
        document = ET.fromstring(package.read("word/document.xml"))
        rels = ET.fromstring(package.read("word/_rels/document.xml.rels"))
        content_types = ET.fromstring(package.read("[Content_Types].xml"))
        has_png_type = any(
            node.tag.rsplit("}", 1)[-1] == "Default" and node.attrib.get("Extension", "").lower() == "png"
            for node in content_types
        )
        if not has_png_type:
            raise ValueError(f"Falta Content Type para PNG en {path}")
        rel_ids = [node.attrib.get("Id", "") for node in rels]
        if len(rel_ids) != len(set(rel_ids)):
            raise ValueError(f"Relaciones duplicadas en {path}")
        rel_by_id = {node.attrib.get("Id"): node for node in rels}
        drawing_names = {
            node.attrib.get("name")
            for node in document.iter(f"{{{WP}}}docPr")
            if node.attrib.get("name") in SCREENSHOTS
        }
        if drawing_names != set(SCREENSHOTS):
            raise ValueError(f"Capturas dibujadas incorrectas en {path}: {sorted(drawing_names)}")
        media_names = {name for name in names if name.startswith("word/media/prototipo-")}
        expected_media = {f"word/media/prototipo-{filename}" for filename in SCREENSHOTS}
        if media_names != expected_media:
            raise ValueError(f"Entradas multimedia del anexo incorrectas en {path}: {sorted(media_names)}")
        if len(new_relationships) != len(SCREENSHOTS):
            raise ValueError(f"Cantidad de nuevas relaciones incorrecta en {path}")
        for relationship_id, target in new_relationships:
            relationship = rel_by_id.get(relationship_id)
            if relationship is None or relationship.attrib.get("Target") != target:
                raise ValueError(f"Relación multimedia ausente o incorrecta: {relationship_id} en {path}")
            package_name = f"word/{target}"
            if package_name not in names:
                raise ValueError(f"Destino de imagen inexistente en {path}: {package_name}")
        blip_ids = {
            node.attrib.get(f"{{{R}}}embed")
            for node in document.iter(f"{{{A}}}blip")
            if node.attrib.get(f"{{{R}}}embed") in rel_by_id
            and rel_by_id[node.attrib.get(f"{{{R}}}embed")].attrib.get("Target", "").startswith("media/prototipo-")
        }
        if len(blip_ids) != len(SCREENSHOTS):
            raise ValueError(f"Hay {len(blip_ids)} referencias dibujo a evidencia, se esperaban 7 en {path}")
        all_text = "".join(node.text or "" for node in document.iter(f"{{{W}}}t"))
        required_chapter_sections = (
            "4.1 Estrategia de validación",
            "4.2 Validación con stakeholders",
            "4.3 Resultados de la validación",
            "4.4 Cambios derivados de la validación",
            "4.5 Técnica de prototipado",
            "4.6 Evidencia de validación",
        )
        if path.name in {CHAPTER_DOCX.name, SECTION_DOCX.name}:
            missing = [section for section in required_chapter_sections if section not in all_text]
            if missing:
                raise ValueError(f"Faltan subsecciones de Capítulo 4 en {path}: {missing}")
        for filename in SCREENSHOTS:
            if filename not in all_text:
                raise ValueError(f"Falta pie de captura {filename} en {path}")


def main() -> None:
    required_paths = (SOURCE_DOCX, CHAPTER_MD, SCRIPT_MD, EVIDENCE_MD, SCREENSHOT_DIR, OUT)
    missing = [str(path) for path in required_paths if not path.exists()]
    missing.extend(str(SCREENSHOT_DIR / name) for name in SCREENSHOTS if not (SCREENSHOT_DIR / name).is_file())
    if missing:
        raise SystemExit("Faltan entradas requeridas; no se generó la entrega:\n" + "\n".join(missing))

    generator = load_document_generator()
    generator.main()

    script_blocks = generator.parse_markdown(SCRIPT_MD)
    evidence_blocks = generator.parse_markdown(EVIDENCE_MD)
    evidence_shapes = [
        (len(value), len(value[0])) for kind, value in evidence_blocks if kind == "table"
    ]
    standalone_document(
        generator,
        SOURCE_DOCX,
        SCRIPT_DOCX,
        script_blocks,
        [(len(value), len(value[0])) for kind, value in script_blocks if kind == "table"],
        "Guion de presentación — JACSA Gestión",
    )
    standalone_evidence_document(
        generator,
        SOURCE_DOCX,
        EVIDENCE_DOCX,
        evidence_blocks,
        evidence_shapes,
        "Prototipo JACSA — Registro de evidencias",
    )
    package_appendix(
        generator,
        CHAPTER_DOCX,
        CHAPTER_DOCX,
        evidence_blocks,
        evidence_shapes,
        "TPO General — Validación y anexo de evidencias del prototipo",
    )
    package_appendix(
        generator,
        SECTION_DOCX,
        SECTION_DOCX,
        evidence_blocks,
        evidence_shapes,
        "Sección 4 — Validación y anexo de evidencias del prototipo",
    )
    validate_docx(SCRIPT_DOCX)
    for path in (CHAPTER_DOCX, SECTION_DOCX, EVIDENCE_DOCX):
        validate_docx(path)
        print(f"{path.relative_to(ROOT)}: DOCX/XML/ZIP válido; 7 capturas PNG, 7 relaciones y anexos completos")
    print(f"{SCRIPT_DOCX.relative_to(ROOT)}: DOCX/XML/ZIP válido; guion completo")


if __name__ == "__main__":
    main()
