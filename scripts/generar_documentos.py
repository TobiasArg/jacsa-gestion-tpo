#!/usr/bin/env python3
"""Append the approved Markdown annexes to working DOCX copies, without dependencies."""

from __future__ import annotations

import hashlib
import os
import re
import tempfile
import zipfile
from pathlib import Path
from statistics import median
from xml.etree import ElementTree as ET
from xml.sax.saxutils import escape


ROOT = Path(__file__).resolve().parent.parent
SOURCE_DOCX = ROOT / "TPO General.docx"
TEMPLATE = ROOT / "TEMPLATE CONSIGNAS"
ADENDA = ROOT / "documentacion" / "adenda-punto-3.md"
CAPITULO = ROOT / "documentacion" / "capitulo-4-validacion.md"
OUT = ROOT / "entregables"

EXPECTED_SOURCE_HASH = "09517ee799de479a83f791fc49656d1ee43690284c4922ab264af726c8f5ff5f"
EXPECTED_TEMPLATE_HASH = "079bfc995300e5ad83800469b72958ec71192bf6f5ed7be61b003c0d533ed07d"

W = "http://schemas.openxmlformats.org/wordprocessingml/2006/main"
XMLNS = {"w": W}
ET.register_namespace("w", W)

INLINE_MARKUP = re.compile(
    r"(\*\*.+?\*\*|(?<!\*)\*[^*\n]+\*|`[^`]*`|\[[^\]]+\]\([^)]+\))"
)
LIST_LINE = re.compile(r"^(\s*)([-+*]|\d+[.)])\s+(.*)$")


def sha256(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as source:
        for chunk in iter(lambda: source.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def split_table_row(line: str) -> list[str]:
    text = line.strip()
    if text.startswith("|"):
        text = text[1:]
    if text.endswith("|"):
        text = text[:-1]
    cells: list[str] = []
    current: list[str] = []
    escaped = False
    for char in text:
        if char == "|" and not escaped:
            cells.append("".join(current).strip().replace(r"\|", "|"))
            current = []
        else:
            current.append(char)
        escaped = char == "\\" and not escaped
        if char != "\\":
            escaped = False
    cells.append("".join(current).strip().replace(r"\|", "|"))
    return cells


def is_table_separator(line: str) -> bool:
    cells = split_table_row(line)
    return bool(cells) and all(re.fullmatch(r":?-{3,}:?", cell.strip()) for cell in cells)


def parse_markdown(path: Path) -> list[tuple[str, object]]:
    lines = path.read_text(encoding="utf-8").splitlines()
    blocks: list[tuple[str, object]] = []
    i = 0
    while i < len(lines):
        line = lines[i]
        if not line.strip():
            i += 1
            continue
        if line.lstrip().startswith("|") and line.rstrip().endswith("|"):
            rows: list[list[str]] = []
            while i < len(lines) and lines[i].lstrip().startswith("|") and lines[i].rstrip().endswith("|"):
                if not is_table_separator(lines[i]):
                    rows.append(split_table_row(lines[i]))
                i += 1
            if rows:
                column_count = len(rows[0])
                if any(len(row) != column_count for row in rows):
                    raise ValueError(f"Tabla con diferente número de columnas en {path}:{i}")
                blocks.append(("table", rows))
            continue
        heading = re.match(r"^\s{0,3}(#{1,6})\s+(.*?)\s*#*\s*$", line)
        if heading:
            blocks.append((f"h{len(heading.group(1))}", heading.group(2)))
            i += 1
            continue
        list_match = LIST_LINE.match(line)
        if list_match:
            while i < len(lines):
                current = LIST_LINE.match(lines[i])
                if not current:
                    break
                level = len(current.group(1).expandtabs(4)) // 2
                blocks.append(("list", (level, current.group(2), current.group(3))))
                i += 1
            continue
        if line.lstrip().startswith(">"):
            quote_parts = []
            while i < len(lines) and lines[i].lstrip().startswith(">"):
                quote_parts.append(re.sub(r"^\s*>\s?", "", lines[i]).strip())
                i += 1
            blocks.append(("quote", " ".join(quote_parts)))
            continue
        paragraph_parts = [line.strip()]
        i += 1
        while i < len(lines) and lines[i].strip():
            if (
                re.match(r"^\s{0,3}#{1,6}\s+", lines[i])
                or LIST_LINE.match(lines[i])
                or lines[i].lstrip().startswith(">")
                or (lines[i].lstrip().startswith("|") and lines[i].rstrip().endswith("|"))
            ):
                break
            paragraph_parts.append(lines[i].strip())
            i += 1
        blocks.append(("p", " ".join(paragraph_parts)))
    return blocks


def inline_tokens(text: str, bold: bool = False, italic: bool = False) -> list[tuple[str, bool, bool]]:
    tokens: list[tuple[str, bool, bool]] = []
    cursor = 0
    for match in INLINE_MARKUP.finditer(text):
        if match.start() > cursor:
            tokens.append((text[cursor:match.start()], bold, italic))
        markup = match.group(0)
        if markup.startswith("**") and markup.endswith("**"):
            tokens.extend(inline_tokens(markup[2:-2], bold=True, italic=italic))
        elif markup.startswith("*") and markup.endswith("*"):
            tokens.extend(inline_tokens(markup[1:-1], bold=bold, italic=True))
        elif markup.startswith("`"):
            tokens.append((markup[1:-1], bold, italic))
        else:
            link = re.fullmatch(r"\[([^\]]+)\]\(([^)]+)\)", markup)
            if link:
                tokens.append((f"{link.group(1)} ({link.group(2)})", bold, italic))
        cursor = match.end()
    if cursor < len(text):
        tokens.append((text[cursor:], bold, italic))
    return [(value, b, it) for value, b, it in tokens if value]


def plain_inline(text: str) -> str:
    return "".join(token[0] for token in inline_tokens(text))


def expected_segments(blocks: list[tuple[str, object]]) -> list[str]:
    segments: list[str] = []
    for kind, value in blocks:
        if kind == "table":
            for row in value:  # type: ignore[union-attr]
                segments.extend(plain_inline(cell) for cell in row)
        elif kind == "list":
            segments.append(plain_inline(value[2]))  # type: ignore[index]
        else:
            segments.append(plain_inline(str(value)))
    return segments


def xml_run(text: str, size: int, bold: bool = False, italic: bool = False, color: str | None = None) -> str:
    if not text:
        return ""
    props = (
        '<w:rPr><w:rFonts w:ascii="Calibri" w:hAnsi="Calibri" w:eastAsia="Calibri" w:cs="Calibri"/>'
        f'<w:sz w:val="{size}"/><w:szCs w:val="{size}"/>'
        + ("<w:b/><w:bCs/>" if bold else "")
        + ("<w:i/><w:iCs/>" if italic else "")
        + (f'<w:color w:val="{color}"/>' if color else "")
        + "</w:rPr>"
    )
    escaped = escape(text).replace("\t", "</w:t><w:tab/><w:t>")
    space = ' xml:space="preserve"' if text[:1].isspace() or text[-1:].isspace() else ""
    return f"<w:r>{props}<w:t{space}>{escaped}</w:t></w:r>"


def inline_xml(text: str, size: int, bold: bool = False, italic: bool = False) -> str:
    return "".join(xml_run(value, size, b, it) for value, b, it in inline_tokens(text, bold, italic))


def paragraph(text: str, kind: str = "p", table_size: int = 22, list_marker: str | None = None, level: int = 0) -> str:
    size = table_size
    ppr: list[str] = []
    base_spacing = f'<w:spacing w:before="0" w:after="{30 if table_size <= 18 else 100}" w:line="{230 if table_size <= 18 else 276}" w:lineRule="auto"/>'
    ppr.append(base_spacing)
    bold = False
    italic = False
    if kind.startswith("h"):
        level_num = int(kind[1:])
        size = 28
        bold = True
        ppr = [f'<w:spacing w:before="{260 if level_num == 1 else 170}" w:after="120"/>', "<w:keepNext/>"]
    elif kind == "quote":
        italic = True
        ppr.append('<w:ind w:left="360"/>')
    elif kind == "list":
        ppr.append(f'<w:ind w:left="{360 + level * 360}" w:hanging="180"/>')
    elif kind == "table-header":
        bold = True
    runs = ""
    if list_marker is not None:
        runs += xml_run(list_marker, size, bold=bold)
    runs += inline_xml(text, size, bold=bold, italic=italic)
    if not runs:
        runs = xml_run("", size)
    return f'<w:p><w:pPr>{"".join(ppr)}</w:pPr>{runs}</w:p>'


def page_break() -> str:
    return '<w:p><w:r><w:br w:type="page"/></w:r></w:p>'


def content_width(document_xml: bytes) -> int:
    root = ET.fromstring(document_xml)
    body = root.find("w:body", XMLNS)
    section = body.find("w:sectPr", XMLNS) if body is not None else None
    page_size = section.find("w:pgSz", XMLNS) if section is not None else None
    margins = section.find("w:pgMar", XMLNS) if section is not None else None
    if page_size is None or margins is None:
        return 8504
    page_width = int(page_size.attrib.get(f"{{{W}}}w", "11906"))
    left = int(margins.attrib.get(f"{{{W}}}left", "1701"))
    right = int(margins.attrib.get(f"{{{W}}}right", "1701"))
    return page_width - left - right


def column_widths(rows: list[list[str]], total: int) -> list[int]:
    count = len(rows[0])
    minimum = min(700, total // count)
    scores = []
    for col in range(count):
        lengths = [len(plain_inline(row[col])) for row in rows if row[col].strip()]
        scores.append(max(8, min(60, int(median(lengths)) if lengths else 12)))
    remaining = total - minimum * count
    score_sum = sum(scores)
    widths = [minimum + remaining * score // score_sum for score in scores]
    widths[-1] += total - sum(widths)
    return widths


def table_xml(rows: list[list[str]], available_width: int) -> str:
    columns = len(rows[0])
    width = min(9500, available_width)
    widths = column_widths(rows, width)
    table_size = 18 if columns >= 4 else 20
    borders = (
        '<w:tblBorders><w:top w:val="single" w:sz="4" w:color="A6B4C4"/>'
        '<w:left w:val="single" w:sz="4" w:color="A6B4C4"/>'
        '<w:bottom w:val="single" w:sz="4" w:color="A6B4C4"/>'
        '<w:right w:val="single" w:sz="4" w:color="A6B4C4"/>'
        '<w:insideH w:val="single" w:sz="4" w:color="D6DEE7"/>'
        '<w:insideV w:val="single" w:sz="4" w:color="D6DEE7"/></w:tblBorders>'
    )
    margins = '<w:tblCellMar><w:top w:w="65" w:type="dxa"/><w:left w:w="75" w:type="dxa"/><w:bottom w:w="65" w:type="dxa"/><w:right w:w="75" w:type="dxa"/></w:tblCellMar>'
    output = [
        '<w:tbl><w:tblPr>'
        f'<w:tblW w:w="{width}" w:type="dxa"/><w:tblLayout w:type="fixed"/>'
        f'{borders}{margins}</w:tblPr><w:tblGrid>',
    ]
    output.extend(f'<w:gridCol w:w="{col_width}"/>' for col_width in widths)
    output.append("</w:tblGrid>")
    for row_index, row in enumerate(rows):
        if len(row) != columns:
            raise ValueError("Tabla Markdown con filas de diferente ancho")
        if row_index == 0:
            output.append('<w:tr><w:trPr><w:tblHeader w:val="true"/></w:trPr>')
        else:
            output.append("<w:tr>")
        for cell_index, text in enumerate(row):
            shade = '<w:shd w:val="clear" w:fill="EAF0F6"/>' if row_index == 0 else ""
            cell_properties = (
                f'<w:tcPr><w:tcW w:w="{widths[cell_index]}" w:type="dxa"/>{shade}'
                '<w:vAlign w:val="top"/></w:tcPr>'
            )
            cell_para = paragraph(text, "table-header" if row_index == 0 else "p", table_size)
            output.append(f"<w:tc>{cell_properties}{cell_para}</w:tc>")
        output.append("</w:tr>")
    output.append("</w:tbl>")
    return "".join(output)


def render_blocks(blocks: list[tuple[str, object]], available_width: int, add_page_break: bool) -> tuple[str, list[tuple[int, int]]]:
    parts = [page_break()] if add_page_break else []
    shapes: list[tuple[int, int]] = []
    for kind, value in blocks:
        if kind == "table":
            rows = value  # type: ignore[assignment]
            parts.append(table_xml(rows, available_width))
            shapes.append((len(rows), len(rows[0])))
        elif kind == "list":
            level, marker, text = value  # type: ignore[misc]
            prefix = f"{marker} " if marker not in ("-", "+", "*") else "• "
            parts.append(paragraph(text, "list", list_marker=prefix, level=level))
        else:
            parts.append(paragraph(str(value), kind))
    return "".join(parts), shapes


def splice_before_final_section(document_xml: bytes, fragment: str) -> bytes:
    section_start = document_xml.rfind(b"<w:sectPr")
    body_end = document_xml.rfind(b"</w:body>")
    if section_start < 0 or body_end < section_start:
        raise ValueError("No se encontró el sectPr final de word/document.xml")
    return document_xml[:section_start] + fragment.encode("utf-8") + document_xml[section_start:]


def standalone_document(document_xml: bytes, fragment: str) -> bytes:
    body_start = document_xml.find(b"<w:body>")
    section_start = document_xml.rfind(b"<w:sectPr")
    body_end = document_xml.rfind(b"</w:body>")
    if min(body_start, section_start, body_end) < 0 or not body_start < section_start < body_end:
        raise ValueError("No se pudo aislar el cuerpo/sectPr del documento original")
    body_content_start = body_start + len(b"<w:body>")
    return document_xml[:body_content_start] + fragment.encode("utf-8") + document_xml[section_start:]


def core_with_title(core_xml: bytes, title: str) -> bytes:
    title_xml = f"<dc:title>{escape(title)}</dc:title>".encode("utf-8")
    existing = re.compile(rb"<dc:title(?:\s[^>]*)?>.*?</dc:title>", re.DOTALL)
    if existing.search(core_xml):
        return existing.sub(title_xml, core_xml, count=1)
    closing_tag = b"</cp:coreProperties>"
    if closing_tag not in core_xml:
        raise ValueError("No se encontró coreProperties para establecer dc:title")
    return core_xml.replace(closing_tag, title_xml + closing_tag, 1)


def write_package(target: Path, replacements: dict[str, bytes]) -> None:
    fd, temp_name = tempfile.mkstemp(prefix=f".{target.name}.", suffix=".tmp", dir=OUT)
    os.close(fd)
    temp_path = Path(temp_name)
    try:
        with zipfile.ZipFile(SOURCE_DOCX, "r") as original, zipfile.ZipFile(temp_path, "w") as generated:
            generated.comment = original.comment
            for info in original.infolist():
                payload = replacements.get(info.filename)
                if payload is None:
                    payload = original.read(info.filename)
                generated.writestr(info, payload)
        with zipfile.ZipFile(temp_path, "r") as check:
            bad_entry = check.testzip()
            if bad_entry:
                raise ValueError(f"ZIP inválido en {bad_entry}")
        os.replace(temp_path, target)
    finally:
        if temp_path.exists():
            temp_path.unlink()


def normalize_segment(text: str) -> str:
    text = re.sub(r"^\s*(?:•\s+|\d+[.)]\s+)", "", text)
    return re.sub(r"\s+", " ", text).strip()


def actual_segments(
    document_xml: bytes, appended_start: int | None, appended_end: int | None = None
) -> tuple[list[str], list[ET.Element]]:
    root = ET.fromstring(document_xml)
    body = root.find("w:body", XMLNS)
    if body is None:
        raise ValueError("word/document.xml no contiene w:body")
    children = list(body)
    if appended_start is None:
        added = children[:-1]
    else:
        added = children[appended_start:appended_end]
    segments: list[str] = []
    tables: list[ET.Element] = []

    def add_paragraph(node: ET.Element) -> None:
        text = "".join(item.text or "" for item in node.iter(f"{{{W}}}t"))
        if text:
            segments.append(normalize_segment(text))

    for node in added:
        if node.tag == f"{{{W}}}p":
            add_paragraph(node)
        elif node.tag == f"{{{W}}}tbl":
            tables.append(node)
            for row in node.findall("w:tr", XMLNS):
                for cell in row.findall("w:tc", XMLNS):
                    for cell_paragraph in cell.findall("w:p", XMLNS):
                        add_paragraph(cell_paragraph)
    return segments, tables


def validate_rendered(
    document_xml: bytes,
    blocks: list[tuple[str, object]],
    expected_shapes: list[tuple[int, int]],
    appended_start: int | None,
    label: str,
    appended_end: int | None = None,
) -> None:
    actual, tables = actual_segments(document_xml, appended_start, appended_end)
    expected = [normalize_segment(item) for item in expected_segments(blocks)]
    if actual != expected:
        for index, (got, wanted) in enumerate(zip(actual, expected)):
            if got != wanted:
                raise ValueError(f"Texto no coincide en {label}, segmento {index + 1}: {got!r} != {wanted!r}")
        raise ValueError(f"Número de segmentos de texto no coincide en {label}: {len(actual)} != {len(expected)}")
    if len(tables) != len(expected_shapes):
        raise ValueError(f"Número de tablas incorrecto en {label}")
    for table, (expected_rows, expected_columns) in zip(tables, expected_shapes):
        rows = table.findall("w:tr", XMLNS)
        if len(rows) != expected_rows or any(len(row.findall("w:tc", XMLNS)) != expected_columns for row in rows):
            raise ValueError(f"Estructura de tabla incorrecta en {label}")
        header_props = rows[0].find("w:trPr", XMLNS)
        if header_props is None or header_props.find("w:tblHeader", XMLNS) is None:
            raise ValueError(f"Falta encabezado repetible en tabla de {label}")
        if any(row.find("w:trPr/w:cantSplit", XMLNS) is not None for row in rows):
            raise ValueError(f"Se encontró cantSplit en tabla de {label}")
    root = ET.fromstring(document_xml)
    body = root.find("w:body", XMLNS)
    children = list(body) if body is not None else []
    if appended_start is None:
        added = children[:-1]
    else:
        added = children[appended_start:appended_end]
    for node in added:
        for run in node.iter(f"{{{W}}}r"):
            if run.find("w:t", XMLNS) is None:
                continue
            rpr = run.find("w:rPr", XMLNS)
            fonts = rpr.find("w:rFonts", XMLNS) if rpr is not None else None
            if fonts is None or fonts.attrib.get(f"{{{W}}}ascii") != "Calibri":
                raise ValueError(f"Fuente Calibri ausente en texto agregado de {label}")
    if "<w:sectPr" not in document_xml.decode("utf-8"):
        raise ValueError(f"Falta sectPr en {label}")


def verify_package_contents(target: Path, replacements: dict[str, bytes]) -> None:
    with zipfile.ZipFile(SOURCE_DOCX, "r") as original, zipfile.ZipFile(target, "r") as generated:
        if generated.testzip() is not None:
            raise ValueError(f"ZIP dañado: {target}")
        if original.namelist() != generated.namelist():
            raise ValueError(f"Cambió el inventario de entradas ZIP: {target}")
        allowed = set(replacements)
        for name in original.namelist():
            if name not in allowed and original.read(name) != generated.read(name):
                raise ValueError(f"Entrada ZIP modificada fuera de alcance: {name}")
        for name in original.namelist():
            if name.endswith(".rels") and original.read(name) != generated.read(name):
                raise ValueError(f"Relación OOXML modificada: {name}")


def main() -> None:
    OUT.mkdir(exist_ok=True)
    if sha256(SOURCE_DOCX) != EXPECTED_SOURCE_HASH:
        raise SystemExit("El hash de TPO General.docx no coincide con el original esperado; no se generó nada.")
    if sha256(TEMPLATE) != EXPECTED_TEMPLATE_HASH:
        raise SystemExit("El hash de TEMPLATE CONSIGNAS no coincide con el original esperado; no se generó nada.")

    adenda_blocks = parse_markdown(ADENDA)
    capitulo_blocks = parse_markdown(CAPITULO)
    with zipfile.ZipFile(SOURCE_DOCX, "r") as source:
        original_xml = source.read("word/document.xml")
        original_core = source.read("docProps/core.xml")
        original_root = ET.fromstring(original_xml)
        original_body = original_root.find("w:body", XMLNS)
        if original_body is None or list(original_body)[-1].tag != f"{{{W}}}sectPr":
            raise SystemExit("El documento original no termina el cuerpo con sectPr; se canceló.")
        original_body_count = len(list(original_body)) - 1
        page_width = content_width(original_xml)
        section = original_body.find("w:sectPr", XMLNS)
        page_size = section.find("w:pgSz", XMLNS) if section is not None else None
        if page_size is not None and page_size.attrib.get(f"{{{W}}}orient", "portrait") == "landscape":
            raise SystemExit("La sección final original es apaisada; se canceló para no alterar la orientación solicitada.")

    adenda_xml, adenda_shapes = render_blocks(adenda_blocks, page_width, add_page_break=True)
    capitulo_xml, capitulo_shapes = render_blocks(capitulo_blocks, page_width, add_page_break=True)
    integrated_fragment = adenda_xml + capitulo_xml
    integrated_xml = splice_before_final_section(original_xml, integrated_fragment)
    integrated_title = "TPO General — Adenda punto 3 y Capítulo 4 Validación"
    integrated_replacements = {
        "word/document.xml": integrated_xml,
        "docProps/core.xml": core_with_title(original_core, integrated_title),
    }
    integrated_path = OUT / "TPO General - Validacion.docx"
    write_package(integrated_path, integrated_replacements)
    verify_package_contents(integrated_path, integrated_replacements)
    if integrated_xml.replace(integrated_fragment.encode("utf-8"), b"", 1) != original_xml:
        raise ValueError("La copia integrada alteró bytes originales fuera del punto de inserción")
    # The second annex begins after the first annex's page-break paragraph and content.
    integrated_body = ET.fromstring(integrated_xml).find("w:body", XMLNS)
    if integrated_body is None:
        raise ValueError("No se encontró w:body tras generar la copia integrada")
    adenda_element_count = len(list(ET.fromstring(b"<w:body xmlns:w='" + W.encode() + b"'>" + adenda_xml.encode() + b"</w:body>")))
    validate_rendered(
        integrated_xml,
        adenda_blocks,
        adenda_shapes,
        original_body_count,
        "adenda integrada",
        original_body_count + adenda_element_count,
    )
    validate_rendered(
        integrated_xml,
        capitulo_blocks,
        capitulo_shapes,
        original_body_count + adenda_element_count,
        "capítulo integrado",
    )

    standalone_chapter_fragment = render_blocks(capitulo_blocks, page_width, add_page_break=False)[0]
    standalone_adenda_fragment = render_blocks(adenda_blocks, page_width, add_page_break=False)[0]
    standalone_fragment = standalone_chapter_fragment + page_break() + standalone_adenda_fragment
    standalone_xml = standalone_document(original_xml, standalone_fragment)
    standalone_title = "Sección 4 — Validación JACSA"
    standalone_replacements = {
        "word/document.xml": standalone_xml,
        "docProps/core.xml": core_with_title(original_core, standalone_title),
    }
    standalone_path = OUT / "Seccion 4 - Validacion.docx"
    write_package(standalone_path, standalone_replacements)
    verify_package_contents(standalone_path, standalone_replacements)
    standalone_body = ET.fromstring(standalone_xml).find("w:body", XMLNS)
    if standalone_body is None:
        raise ValueError("No se encontró w:body en documento autónomo")
    chapter_element_count = len(
        list(
            ET.fromstring(
                b"<w:body xmlns:w='" + W.encode() + b"'>"
                + standalone_chapter_fragment.encode()
                + b"</w:body>"
            )
        )
    )
    validate_rendered(
        standalone_xml,
        capitulo_blocks,
        capitulo_shapes,
        0,
        "capítulo autónomo",
        chapter_element_count,
    )
    # Confirm adenda text/tables after the chapter in the standalone body.
    adenda_start = chapter_element_count + 1
    validate_rendered(
        standalone_xml,
        adenda_blocks,
        adenda_shapes,
        adenda_start,
        "adenda autónoma",
    )

    for target, replacements in (
        (integrated_path, integrated_replacements),
        (standalone_path, standalone_replacements),
    ):
        with zipfile.ZipFile(target, "r") as output:
            image_count = sum(1 for name in output.namelist() if name.startswith("word/media/"))
        print(f"{target.relative_to(ROOT)}: ZIP válido; {image_count} entradas multimedia preservadas; título OOXML actualizado")
    print(
        f"Validado texto completo (sin markup), tablas reales/repetición de cabecera y Calibri: "
        f"adenda {sum(1 for kind, _ in adenda_blocks if kind == 'table')} tablas; "
        f"capítulo {sum(1 for kind, _ in capitulo_blocks if kind == 'table')} tablas."
    )


if __name__ == "__main__":
    main()
