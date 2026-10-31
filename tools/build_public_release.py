#!/usr/bin/env python3
"""Empacota runtime sem assinatura e fonte correspondente; nenhum certificado é lido."""
from __future__ import annotations
import argparse
import hashlib
import json
from pathlib import Path
import os
import shutil
import tempfile
import zipfile
from tizen_installer import check_app, copy_unsigned, FORBIDDEN

EXCLUDED_DIRS = {'.publication','.git', 'node_modules', '.gradle', '.idea', '.staging', 'outputs', 'build', 'dist', '.wxt', '.cache', '.kotlin', '.cxx', '__pycache__', 'release-output', 'pacotes-assinados', 'full-app'}
EXCLUDED_NAMES = {'local.properties', 'keystore.properties', 'profiles.xml', 'author-signature.xml', 'signature1.xml', '.manifest.tmp', '.delta.lst'}


def source_files(root: Path):
    for base, dirs, files in os.walk(root):
        dirs[:] = sorted(d for d in dirs if d not in EXCLUDED_DIRS and not (Path(base) / d).is_symlink())
        for name in sorted(files):
            path = Path(base) / name
            if path.is_symlink() or name in EXCLUDED_NAMES or path.suffix.lower() in FORBIDDEN | {'.wgt', '.apk', '.aab', '.deb', '.log', '.pyc'}:
                continue
            if name.startswith('.env') and name not in {'.env.example', '.env.sample'}:
                continue
            yield path


def main(argv=None):
    parser = argparse.ArgumentParser(description=__doc__)
    root = Path(__file__).resolve().parent.parent
    parser.add_argument('--runtime-from', type=Path, default=root / 'web/tizen-tv')
    parser.add_argument('--output', type=Path, default=root / 'release-output')
    args = parser.parse_args(argv)
    version = check_app(args.runtime_from)
    # A release nunca mistura runtime e fonte com números diferentes.
    import xml.etree.ElementTree as ET
    if ET.parse(root / 'web/tizen-tv/config.xml').getroot().get('version') != version:
        parser.error('Versões da fonte e do runtime são diferentes.')
    manifest=json.loads((root / 'release/manifest.json').read_text())
    if manifest != {'version':version,'tag':f'tv-v{version}'}:
        parser.error('Manifest da release não corresponde à versão do app.')
    args.output.mkdir(parents=True, exist_ok=True)
    with tempfile.TemporaryDirectory(prefix='painho-release-') as tmp:
        stage = Path(tmp) / f'LqMusic-TV-{version}'
        stage.mkdir()
        copy_unsigned(args.runtime_from, stage / 'app')
        (stage / 'tools').mkdir()
        shutil.copy2(root / 'tools/tizen_installer.py', stage / 'tools/tizen_installer.py')
        shutil.copy2(root / 'instalar-tv.sh', stage / 'instalar-tv.sh')
        for name in ['LICENSE', 'NOTICE.md']:
            shutil.copy2(root / name, stage / name)
        shutil.copy2(root / 'docs/INSTALAR-NA-TV.md', stage / 'LEIA-ME.md')
        (stage / 'FONTE.txt').write_text(f'Código-fonte completo: LqMusic-TV-{version}-Source.zip na mesma release em https://github.com/Liandersson/Painho_Lula/releases\n', encoding='utf8')
        # Distribui a licença e o patch da biblioteca modificada junto do binário.
        shutil.copytree(root / 'web/patches', stage / 'third-party/am-lyrics')
        install_zip = args.output / f'LqMusic-TV-{version}-Instalacao.zip'
        with zipfile.ZipFile(install_zip, 'w', zipfile.ZIP_DEFLATED, compresslevel=3) as archive:
            for path in sorted(stage.rglob('*')):
                if path.is_file():
                    archive.write(path, path.relative_to(stage.parent))
    source_zip = args.output / f'LqMusic-TV-{version}-Source.zip'
    with zipfile.ZipFile(source_zip, 'w', zipfile.ZIP_DEFLATED, compresslevel=3) as archive:
        for path in source_files(root):
            archive.write(path, Path(f'LqMusic-TV-{version}-Source') / path.relative_to(root))
    checksums = args.output / 'SHA256SUMS.txt'
    checksums.write_text(''.join(f'{hashlib.sha256(path.read_bytes()).hexdigest()}  {path.name}\n' for path in [install_zip, source_zip]), encoding='utf8')
    print(install_zip)
    print(source_zip)
    print(checksums)
    return 0


if __name__ == '__main__':
    raise SystemExit(main())
