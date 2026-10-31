#!/usr/bin/env python3
"""Assistente local de assinatura/instalação Tizen. Não recebe nem salva senhas."""
from __future__ import annotations
import argparse
import ipaddress
from pathlib import Path
import re
import shlex
import shutil
import subprocess
import sys
import tempfile
import xml.etree.ElementTree as ET

APP_ID = 'painholula.PainhoLulaTV'
FORBIDDEN = {'.p12', '.pfx', '.pem', '.key', '.jks', '.keystore'}
SIGNATURES = {'author-signature.xml', 'signature1.xml', '.manifest.tmp', '.delta.lst'}


def serial_for(value: str) -> str:
    try:
        address = ipaddress.IPv4Address(value.strip())
    except ipaddress.AddressValueError as error:
        raise ValueError('Informe o IPv4 da TV, por exemplo 192.168.0.10.') from error
    if address.is_unspecified or address.is_multicast or address.is_loopback:
        raise ValueError('Informe o endereço da TV na rede local.')
    return f'{address}:26101'


def check_app(app: Path) -> str:
    root = ET.parse(app / 'config.xml').getroot()
    content = root.find('{http://www.w3.org/ns/widgets}content')
    application = root.find('{http://tizen.org/ns/widgets}application')
    if application is None or application.get('id') != APP_ID:
        raise ValueError('Este pacote não é o Painho Lula TV esperado.')
    if content is None or content.get('src') != 'full-app/index.html':
        raise ValueError('O pacote não aponta para o web app completo.')
    if not (app / 'full-app/index.html').is_file():
        raise ValueError('App não compilado. Baixe o ZIP de instalação da release ou compile o projeto.')
    version = root.get('version', '')
    if not re.fullmatch(r'\d+\.\d+\.\d+', version):
        raise ValueError('Versão inválida no config.xml.')
    return version


def copy_unsigned(app: Path, dest: Path) -> None:
    dest.mkdir(parents=True)
    for name in ('config.xml', 'icon.png'):
        shutil.copy2(app / name, dest / name)
    for source in (app / 'full-app').rglob('*'):
        if source.is_symlink():
            raise ValueError('O pacote não pode conter links simbólicos.')
        if source.is_file():
            if source.suffix.lower() in FORBIDDEN or source.name in SIGNATURES:
                raise ValueError('Material de assinatura inesperado dentro dos arquivos do app.')
            target = dest / source.relative_to(app)
            target.parent.mkdir(parents=True, exist_ok=True)
            shutil.copy2(source, target)


def execute(command: list[str], *, capture: bool = False):
    print('\n>', shlex.join(command), flush=True)
    # Sem shell, sem senha em argumentos/variáveis e sem gravar transcrição do SDK.
    return subprocess.run(command, check=True, text=True, capture_output=capture)


def parser() -> argparse.ArgumentParser:
    result = argparse.ArgumentParser(description='Instalar Painho Lula numa Samsung Tizen usando seu certificado.')
    result.add_argument('--tv', help='IPv4 da TV em Developer Mode')
    result.add_argument('--sdk', type=Path, default=Path.home() / 'tizen-studio')
    result.add_argument('--profile', help='Nome do perfil Samsung que já inclui o DUID desta TV')
    root = Path(__file__).resolve().parent.parent
    result.add_argument('--app', type=Path, default=root / ('app' if (root / 'app/config.xml').exists() else 'web/tizen-tv'))
    result.add_argument('--output', type=Path, default=Path.cwd() / 'pacotes-assinados')
    result.add_argument('--dry-run', action='store_true', help='Validar e mostrar o plano; não conectar, assinar ou instalar')
    return result


def main(argv=None) -> int:
    args = parser().parse_args(argv)
    try:
        tv = (args.tv or input('IPv4 da TV: ')).strip()
        serial = serial_for(tv)
        profile = args.profile or input('Perfil do certificado Samsung (ex.: MinhaTV): ').strip()
        if not profile or profile.startswith('-') or any(ord(c) < 32 for c in profile):
            raise ValueError('Nome de perfil inválido.')
        app = args.app.resolve()
        version = check_app(app)
        sdk = args.sdk.expanduser().resolve()
        sdb, tizen = sdk / 'tools/sdb', sdk / 'tools/ide/bin/tizen'
        print(f'\nPainho Lula TV {version} → {serial}; perfil: {profile}')
        print('A TV deve usar Tizen 9.0+, Developer Mode e estar registrada no certificado.')
        print('O SDK pedirá as senhas diretamente. Responda N se perguntar se deseja salvá-las.')
        if args.dry_run:
            print(f'SDK: {sdk}\nApp: {app}\nSaída: {args.output.resolve()}')
            print('Plano: conectar TV → validar conexão → copiar app sem assinatura → assinar com seu perfil → permitir → instalar → iniciar.')
            return 0
        if not sdb.is_file() or not tizen.is_file():
            raise ValueError('SDK não encontrado. Instale Tizen Studio/TV Tools/Samsung Certificate Extension ou informe --sdk.')
        execute([str(sdb), 'connect', serial])
        devices = execute([str(sdb), 'devices'], capture=True).stdout
        if not any(len(row.split()) >= 2 and row.split()[:2] == [serial, 'device'] for row in devices.splitlines()):
            raise ValueError('A TV indicada não aparece conectada. Confira Developer Mode, rede e IP do computador na TV.')
        with tempfile.TemporaryDirectory(prefix='painho-tv-') as temporary:
            stage, signed = Path(temporary) / 'app', Path(temporary) / 'signed'
            copy_unsigned(app, stage)
            signed.mkdir()
            execute([str(tizen), 'package', '-t', 'wgt', '-s', profile, '-o', str(signed), '--', str(stage)])
            packages = list(signed.glob('*.wgt'))
            if len(packages) != 1:
                raise ValueError('O SDK não gerou exatamente um WGT; consulte o erro de assinatura acima.')
            args.output.mkdir(parents=True, exist_ok=True)
            # Nome sem espaços evita falhas de instalação no CLI Samsung.
            target = args.output / f'Painho-Lula-TV-{version}-{ipaddress.IPv4Address(tv)}.wgt'
            if target.exists():
                raise ValueError(f'Já existe {target}. Mova-o ou use outro diretório --output.')
            shutil.copy2(packages[0], target)
        execute([str(tizen), 'install-permit', '-s', serial])
        execute([str(tizen), 'install', '-s', serial, '-n', target.name, '--', str(target.parent.resolve())])
        execute([str(tizen), 'run', '-s', serial, '-p', APP_ID])
        print(f'\nInstalado e iniciado. Seu pacote assinado ficou em: {target.resolve()}')
        return 0
    except (ValueError, OSError, ET.ParseError, subprocess.CalledProcessError) as error:
        print(f'\nNão foi possível concluir: {error}', file=sys.stderr)
        print('Certificado/DUID: confira docs/INSTALAR-NA-TV.md. Nenhuma senha foi salva pelo assistente.', file=sys.stderr)
        return 1
    except (EOFError, KeyboardInterrupt):
        print('\nOperação cancelada.', file=sys.stderr)
        return 130


if __name__ == '__main__':
    raise SystemExit(main())
