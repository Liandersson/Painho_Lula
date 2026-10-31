#!/usr/bin/env python3
"""Publicação inicial: restaura fonte exata a partir do upstream fixado e overlay verificado."""
import hashlib
import json
from pathlib import Path, PurePosixPath
import shutil
import subprocess
import tempfile
import zipfile


def safe_path(value):
    parts=PurePosixPath(value)
    if parts.is_absolute() or '..' in parts.parts or '.git' in parts.parts:
        raise ValueError('Caminho inválido no manifest de fonte.')
    return Path(*parts.parts)


def main():
    root=Path(__file__).resolve().parent.parent
    manifest_path=root/'.publication/manifest.json'
    if not manifest_path.exists():
        print('Fonte completa já presente; nada a restaurar.')
        return
    manifest=json.loads(manifest_path.read_text())
    if manifest['upstream_repository']!='https://github.com/kushagrasinghx/BitChord.git':
        raise ValueError('Upstream inesperado.')
    with tempfile.TemporaryDirectory(prefix='painho-source-') as temp:
        base=Path(temp)/'upstream'
        subprocess.run(['git','clone','--no-checkout','--filter=blob:none',manifest['upstream_repository'],str(base)],check=True)
        subprocess.run(['git','-C',str(base),'fetch','--depth','1','origin',manifest['upstream_commit']],check=True)
        subprocess.run(['git','-C',str(base),'checkout','--detach',manifest['upstream_commit']],check=True)
        with zipfile.ZipFile(root/'.publication/overlay.zip') as overlay:
            for entry in manifest['files']:
                target=root/safe_path(entry['path'])
                if 'upstream_path' in entry:
                    source=base/safe_path(entry['upstream_path'])
                    if source.is_symlink():raise ValueError('Symlink inesperado no upstream.')
                    data=source.read_bytes()
                else:
                    data=overlay.read(entry['sha256'])
                if hashlib.sha256(data).hexdigest()!=entry['sha256']:
                    raise ValueError(f"Hash inválido: {entry['path']}")
                target.parent.mkdir(parents=True,exist_ok=True)
                target.write_bytes(data)
                target.chmod(int(entry['mode'],8))
    (root/'docs/SOURCE-PROVENANCE.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2)+'\n')
    shutil.rmtree(root/'.publication')
    print(f"Fonte restaurada e verificada: {len(manifest['files'])} arquivos.")


if __name__=='__main__':
    main()
