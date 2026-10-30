"""Reduce standalone DOCX packages to the parts reachable from their document body."""

from __future__ import annotations

import os
import posixpath
import re
import tempfile
import zipfile
from pathlib import Path
from xml.etree import ElementTree as ET


W = "http://schemas.openxmlformats.org/wordprocessingml/2006/main"
R = "http://schemas.openxmlformats.org/officeDocument/2006/relationships"
PKG_REL = "http://schemas.openxmlformats.org/package/2006/relationships"
CT = "http://schemas.openxmlformats.org/package/2006/content-types"
MC = "http://schemas.openxmlformats.org/markup-compatibility/2006"
IMAGE_REL_TYPE = f"{R}/image"
DOCUMENT_REL_TYPE = "http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument"
CORE_REL_TYPE = "http://schemas.openxmlformats.org/package/2006/relationships/metadata/core-properties"
DOCUMENT_CONTENT_TYPE = "application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"
CORE_CONTENT_TYPE = "application/vnd.openxmlformats-package.core-properties+xml"
PNG_CONTENT_TYPE = "image/png"

DOCUMENT = "word/document.xml"
DOCUMENT_RELS = "word/_rels/document.xml.rels"
CONTENT_TYPES = "[Content_Types].xml"
ROOT_RELS = "_rels/.rels"
CORE = "docProps/core.xml"

ET.register_namespace("w", W)
ET.register_namespace("r", R)
ET.register_namespace("", PKG_REL)


def _xml(root: ET.Element) -> bytes:
    return ET.tostring(root, encoding="utf-8", xml_declaration=True)


def _relationship_root(relationships: list[tuple[str, str, str]]) -> ET.Element:
    root = ET.Element(f"{{{PKG_REL}}}Relationships")
    for relationship_id, relationship_type, target in relationships:
        ET.SubElement(
            root,
            f"{{{PKG_REL}}}Relationship",
            {"Id": relationship_id, "Type": relationship_type, "Target": target},
        )
    return root


def _document_relationships(document_root: ET.Element, rels_xml: bytes, parts: dict[str, bytes]):
    rels_root = ET.fromstring(rels_xml)
    relationships = list(rels_root)
    ids = [node.attrib.get("Id", "") for node in relationships]
    if len(ids) != len(set(ids)) or any(not relationship_id for relationship_id in ids):
        raise ValueError("Relaciones OOXML duplicadas o sin Id")
    by_id = {node.attrib["Id"]: node for node in relationships}
    used_ids = {
        value
        for node in document_root.iter()
        for attribute, value in node.attrib.items()
        if attribute.startswith(f"{{{R}}}")
    }
    missing = used_ids - by_id.keys()
    if missing:
        raise ValueError(f"El documento referencia relaciones inexistentes: {sorted(missing)}")

    kept: list[tuple[str, str, str]] = []
    media_names: set[str] = set()
    for relationship_id in sorted(used_ids):
        node = by_id[relationship_id]
        relationship_type = node.attrib.get("Type", "")
        target = node.attrib.get("Target", "")
        if relationship_type != IMAGE_REL_TYPE or node.attrib.get("TargetMode") == "External":
            raise ValueError(f"Relación no permitida en el documento autónomo: {relationship_id}")
        if not target:
            raise ValueError(f"La relación {relationship_id} no tiene destino")
        if target.startswith("/"):
            media_name = posixpath.normpath(target.lstrip("/"))
        else:
            media_name = posixpath.normpath(posixpath.join("word", target))
        if not media_name.startswith("word/media/") or not media_name.lower().endswith(".png"):
            raise ValueError(f"Destino multimedia no admitido en documento autónomo: {target}")
        if media_name not in parts:
            raise ValueError(f"Falta el recurso multimedia relacionado: {media_name}")
        kept.append((relationship_id, relationship_type, target))
        media_names.add(media_name)
    return _relationship_root(kept), media_names


def _minimal_content_types(has_png: bool) -> bytes:
    root = ET.Element(f"{{{CT}}}Types")
    ET.SubElement(root, f"{{{CT}}}Default", {"Extension": "rels", "ContentType": "application/vnd.openxmlformats-package.relationships+xml"})
    ET.SubElement(root, f"{{{CT}}}Default", {"Extension": "xml", "ContentType": "application/xml"})
    if has_png:
        ET.SubElement(root, f"{{{CT}}}Default", {"Extension": "png", "ContentType": PNG_CONTENT_TYPE})
    ET.SubElement(root, f"{{{CT}}}Override", {"PartName": "/word/document.xml", "ContentType": DOCUMENT_CONTENT_TYPE})
    ET.SubElement(root, f"{{{CT}}}Override", {"PartName": "/docProps/core.xml", "ContentType": CORE_CONTENT_TYPE})
    return _xml(root)


def _root_relationships() -> bytes:
    return _xml(
        _relationship_root(
            [
                ("rId1", DOCUMENT_REL_TYPE, "word/document.xml"),
                ("rId2", CORE_REL_TYPE, "docProps/core.xml"),
            ]
        )
    )


def sanitize_standalone_docx(path: Path) -> tuple[int, int]:
    """Keep only the document, core metadata, used PNGs, and their relationships."""
    path = Path(path)
    with zipfile.ZipFile(path, "r") as package:
        bad_entry = package.testzip()
        if bad_entry:
            raise ValueError(f"ZIP dañado antes de sanitizar {path}: {bad_entry}")
        parts = {name: package.read(name) for name in package.namelist()}

    for required in (DOCUMENT, DOCUMENT_RELS, CORE):
        if required not in parts:
            raise ValueError(f"Falta la parte OOXML necesaria: {required}")

    document_root = ET.fromstring(parts[DOCUMENT])
    body = document_root.find(f"{{{W}}}body")
    if body is None or not list(body) or list(body)[-1].tag != f"{{{W}}}sectPr":
        raise ValueError("El documento autónomo debe terminar el cuerpo con w:sectPr")
    for section in document_root.iter(f"{{{W}}}sectPr"):
        for child in list(section):
            if child.tag in {f"{{{W}}}headerReference", f"{{{W}}}footerReference"}:
                section.remove(child)
    # The isolated body contains no markup-compatibility extension payloads.
    document_root.attrib.pop(f"{{{MC}}}Ignorable", None)
    document_xml = _xml(document_root)
    document_text = "".join(node.text or "" for node in document_root.iter(f"{{{W}}}t"))
    if re.search(r"(?:<!--\s*/?LOC-B\d+\s*-->|LOC-B\d+)", document_text, re.IGNORECASE):
        raise ValueError("Se encontró un marcador LOC visible en el Word autónomo")

    document_rels, media_names = _document_relationships(document_root, parts[DOCUMENT_RELS], parts)
    minimal_parts = {
        CONTENT_TYPES: _minimal_content_types(bool(media_names)),
        ROOT_RELS: _root_relationships(),
        DOCUMENT: document_xml,
        DOCUMENT_RELS: _xml(document_rels),
        CORE: parts[CORE],
    }
    minimal_parts.update({name: parts[name] for name in sorted(media_names)})

    fd, temporary_name = tempfile.mkstemp(prefix=f".{path.name}.", suffix=".tmp", dir=path.parent)
    os.close(fd)
    temporary = Path(temporary_name)
    try:
        with zipfile.ZipFile(temporary, "w", compression=zipfile.ZIP_DEFLATED) as generated:
            for name, payload in minimal_parts.items():
                generated.writestr(name, payload)
        with zipfile.ZipFile(temporary, "r") as check:
            bad_entry = check.testzip()
            if bad_entry:
                raise ValueError(f"ZIP dañado tras sanitizar {path}: {bad_entry}")
        os.replace(temporary, path)
    finally:
        if temporary.exists():
            temporary.unlink()

    validate_minimal_docx(path)
    return len(minimal_parts), len(media_names)


def validate_minimal_docx(path: Path) -> tuple[int, int]:
    """Validate ZIP/XML closure and prove the standalone package has no orphan media."""
    with zipfile.ZipFile(path, "r") as package:
        bad_entry = package.testzip()
        if bad_entry:
            raise ValueError(f"ZIP dañado en {path}: {bad_entry}")
        names = set(package.namelist())
        for required in (CONTENT_TYPES, ROOT_RELS, DOCUMENT, DOCUMENT_RELS, CORE):
            if required not in names:
                raise ValueError(f"Falta una parte mínima de DOCX en {path}: {required}")
        forbidden_prefixes = ("word/header", "word/footer", "customXml/")
        forbidden = sorted(name for name in names if name.startswith(forbidden_prefixes))
        if forbidden:
            raise ValueError(f"Partes de encabezado/pie/customXML no permitidas en {path}: {forbidden}")

        parsed: dict[str, ET.Element] = {}
        for name in names:
            if name.endswith((".xml", ".rels")) or name == CONTENT_TYPES:
                parsed[name] = ET.fromstring(package.read(name))
        document_root = parsed[DOCUMENT]
        if any(node.tag in {f"{{{W}}}headerReference", f"{{{W}}}footerReference"} for node in document_root.iter()):
            raise ValueError(f"Quedó una referencia a encabezado/pie en {path}")
        document_text = "".join(node.text or "" for node in document_root.iter(f"{{{W}}}t"))
        if re.search(r"(?:<!--\s*/?LOC-B\d+\s*-->|LOC-B\d+)", document_text, re.IGNORECASE):
            raise ValueError(f"Marcador LOC visible en {path}")

        used_ids = {
            value
            for node in document_root.iter()
            for attribute, value in node.attrib.items()
            if attribute.startswith(f"{{{R}}}")
        }
        document_rels = parsed[DOCUMENT_RELS]
        relationships = list(document_rels)
        relationship_ids = [node.attrib.get("Id", "") for node in relationships]
        if len(relationship_ids) != len(set(relationship_ids)) or set(relationship_ids) != used_ids:
            raise ValueError(f"Relaciones del documento no coinciden con sus referencias en {path}")
        targets: set[str] = set()
        for relation in relationships:
            target = relation.attrib.get("Target", "")
            if relation.attrib.get("Type") != IMAGE_REL_TYPE or relation.attrib.get("TargetMode") == "External":
                raise ValueError(f"Relación no multimedia no permitida en {path}: {relation.attrib}")
            target_name = posixpath.normpath(posixpath.join("word", target))
            if not target_name.startswith("word/media/") or target_name not in names:
                raise ValueError(f"Destino de relación inválido o ausente en {path}: {target}")
            targets.add(target_name)
        media_names = {name for name in names if name.startswith("word/media/")}
        if media_names != targets:
            raise ValueError(f"Medios huérfanos o no relacionados en {path}: {sorted(media_names ^ targets)}")
        if names != {CONTENT_TYPES, ROOT_RELS, DOCUMENT, DOCUMENT_RELS, CORE, *media_names}:
            raise ValueError(f"Partes extra no alcanzables en el DOCX autónomo {path}")

        root_rels = parsed[ROOT_RELS]
        root_ids = [node.attrib.get("Id", "") for node in root_rels]
        if len(root_ids) != len(set(root_ids)) or len(root_ids) != 2:
            raise ValueError(f"Relaciones de paquete inesperadas en {path}")
        root_targets = {node.attrib.get("Target") for node in root_rels}
        if root_targets != {DOCUMENT, CORE}:
            raise ValueError(f"Relaciones raíz incompletas o inesperadas en {path}")
        return len(names), len(media_names)
