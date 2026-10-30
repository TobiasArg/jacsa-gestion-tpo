from __future__ import annotations

import tempfile
import unittest
import zipfile
from pathlib import Path
from xml.etree import ElementTree as ET

from docx_minimal import (
    PKG_REL,
    R,
    W,
    sanitize_standalone_docx,
    validate_minimal_docx,
)


def make_docx(path: Path, *, include_image: bool = True, broken_reference: bool = False) -> None:
    document = f'''<?xml version="1.0" encoding="UTF-8"?>
<w:document xmlns:w="{W}" xmlns:r="{R}"
 xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main"
 xmlns:mc="http://schemas.openxmlformats.org/markup-compatibility/2006"
 mc:Ignorable="w14"><w:body><w:p><w:r><w:t>Contenido de prueba</w:t></w:r></w:p>'''
    if include_image:
        relation_id = "rIdMissing" if broken_reference else "rId1"
        document += f'<w:p><w:r><a:blip r:embed="{relation_id}"/></w:r></w:p>'
    document += (
        f'<w:sectPr><w:headerReference r:id="rId2" w:type="default"/>'
        f'<w:footerReference r:id="rId3" w:type="default"/><w:pgSz w:w="11906"/></w:sectPr>'
        "</w:body></w:document>"
    )
    relationships = [
        f'<Relationship Id="rId1" Type="{R}/image" Target="media/used.png"/>',
        f'<Relationship Id="rId2" Type="{R}/header" Target="header1.xml"/>',
        f'<Relationship Id="rId3" Type="{R}/footer" Target="footer1.xml"/>',
        f'<Relationship Id="rId4" Type="{R}/image" Target="media/orphan.png"/>',
    ]
    rels = f'<Relationships xmlns="{PKG_REL}">{"".join(relationships)}</Relationships>'
    parts = {
        "[Content_Types].xml": b'<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"/>',
        "_rels/.rels": b'<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"/>',
        "word/document.xml": document.encode(),
        "word/_rels/document.xml.rels": rels.encode(),
        "docProps/core.xml": b'<cp:coreProperties xmlns:cp="http://schemas.openxmlformats.org/package/2006/metadata/core-properties"/>',
        "word/header1.xml": b"<header/>",
        "word/footer1.xml": b"<footer/>",
        "customXml/item1.xml": b"<custom/>",
        "word/media/used.png": b"used-png-payload",
        "word/media/orphan.png": b"orphan-png-payload",
    }
    with zipfile.ZipFile(path, "w", compression=zipfile.ZIP_DEFLATED) as package:
        for name, payload in parts.items():
            package.writestr(name, payload)


class MinimalDocxTests(unittest.TestCase):
    def test_prunes_unreachable_parts_and_preserves_only_referenced_image(self) -> None:
        with tempfile.TemporaryDirectory() as directory:
            path = Path(directory) / "standalone.docx"
            make_docx(path)

            self.assertEqual(sanitize_standalone_docx(path), (6, 1))
            self.assertEqual(validate_minimal_docx(path), (6, 1))
            with zipfile.ZipFile(path) as package:
                self.assertIsNone(package.testzip())
                self.assertEqual(
                    set(package.namelist()),
                    {
                        "[Content_Types].xml",
                        "_rels/.rels",
                        "word/document.xml",
                        "word/_rels/document.xml.rels",
                        "docProps/core.xml",
                        "word/media/used.png",
                    },
                )
                document = ET.fromstring(package.read("word/document.xml"))
                self.assertFalse(any(node.tag.endswith(("headerReference", "footerReference")) for node in document.iter()))
                self.assertNotIn("{http://schemas.openxmlformats.org/markup-compatibility/2006}Ignorable", document.attrib)
                rels = ET.fromstring(package.read("word/_rels/document.xml.rels"))
                self.assertEqual([node.attrib["Id"] for node in rels], ["rId1"])

    def test_standalone_without_images_has_no_media_relationships(self) -> None:
        with tempfile.TemporaryDirectory() as directory:
            path = Path(directory) / "text-only.docx"
            make_docx(path, include_image=False)

            self.assertEqual(sanitize_standalone_docx(path), (5, 0))
            with zipfile.ZipFile(path) as package:
                rels = ET.fromstring(package.read("word/_rels/document.xml.rels"))
                self.assertEqual(list(rels), [])
                self.assertFalse(any(name.startswith("word/media/") for name in package.namelist()))

    def test_missing_relationship_is_rejected_before_package_rewrite(self) -> None:
        with tempfile.TemporaryDirectory() as directory:
            path = Path(directory) / "broken.docx"
            make_docx(path, broken_reference=True)
            with self.assertRaisesRegex(ValueError, "relaciones inexistentes"):
                sanitize_standalone_docx(path)
            with zipfile.ZipFile(path) as package:
                self.assertIn("word/header1.xml", package.namelist())


if __name__ == "__main__":
    unittest.main()
