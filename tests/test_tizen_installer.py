import importlib.util
from pathlib import Path
import subprocess
import tempfile
import unittest
from unittest.mock import patch

SPEC = importlib.util.spec_from_file_location('tizen_installer', Path(__file__).resolve().parents[1] / 'tools/tizen_installer.py')
installer = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(installer)


def make_app(root):
    root.mkdir(parents=True)
    (root / 'config.xml').write_text('<widget xmlns="http://www.w3.org/ns/widgets" xmlns:tizen="http://tizen.org/ns/widgets" version="1.3.0"><content src="full-app/index.html"/><tizen:application id="painholula.PainhoLulaTV"/></widget>')
    (root / 'icon.png').write_bytes(b'icon')
    (root / 'full-app').mkdir()
    (root / 'full-app/index.html').write_text('<html>app</html>')


class InstallerTests(unittest.TestCase):
    def test_ipv4_and_command_injection_rejection(self):
        self.assertEqual(installer.serial_for('192.168.0.10'), '192.168.0.10:26101')
        for value in ['127.0.0.1', '0.0.0.0', '224.0.0.1', '192.168.0.2; touch x', 'bad']:
            with self.assertRaises(ValueError):
                installer.serial_for(value)

    def test_unsigned_copy_omits_old_signatures_and_rejects_embedded_private_material(self):
        with tempfile.TemporaryDirectory() as tmp:
            root=Path(tmp)
            make_app(root/'app')
            (root/'app/author-signature.xml').write_text('old signature')
            installer.copy_unsigned(root/'app',root/'clean')
            self.assertFalse((root/'clean/author-signature.xml').exists())
            self.assertTrue((root/'clean/full-app/index.html').exists())
            (root/'app/full-app/private.p12').write_bytes(b'private')
            with self.assertRaises(ValueError):
                installer.copy_unsigned(root/'app',root/'rejected')

    def test_dry_run_never_connects_or_signs(self):
        with tempfile.TemporaryDirectory() as tmp:
            app=Path(tmp)/'app';make_app(app)
            with patch.object(installer.subprocess,'run') as run:
                self.assertEqual(installer.main(['--app',str(app),'--tv','192.168.0.10','--profile','MinhaTV','--dry-run']),0)
                run.assert_not_called()

    def test_only_selected_connected_tv_receives_signed_package(self):
        with tempfile.TemporaryDirectory() as tmp:
            root=Path(tmp);make_app(root/'app')
            sdk=root/'sdk';(sdk/'tools/ide/bin').mkdir(parents=True)
            for path in [sdk/'tools/sdb',sdk/'tools/ide/bin/tizen']:path.touch()
            calls=[]
            def run(command,**kwargs):
                self.assertNotIn('shell',kwargs)
                self.assertTrue(kwargs['check'])
                calls.append(command)
                if command[-1]=='devices':
                    return subprocess.CompletedProcess(command,0,stdout='List of devices attached\n192.168.0.10:26101 device Samsung\n192.168.0.20:26101 device Other\n')
                if 'package' in command:
                    target=Path(command[command.index('-o')+1]);(target/'LqMusic.wgt').write_bytes(b'signed')
                return subprocess.CompletedProcess(command,0)
            with patch.object(installer.subprocess,'run',side_effect=run):
                result=installer.main(['--app',str(root/'app'),'--sdk',str(sdk),'--tv','192.168.0.10','--profile','Minha TV','--output',str(root/'out')])
            self.assertEqual(result,0)
            installed=next(command for command in calls if 'install' in command)
            self.assertEqual(installed[installed.index('-s')+1],'192.168.0.10:26101')
            self.assertNotIn(' ',installed[installed.index('-n')+1])
            self.assertEqual((root/'out/LqMusic-TV-1.3.0-192.168.0.10.wgt').read_bytes(),b'signed')
            self.assertFalse(any('password' in part.lower() for command in calls for part in command))

    def test_missing_target_stops_before_packaging(self):
        with tempfile.TemporaryDirectory() as tmp:
            root=Path(tmp);make_app(root/'app');sdk=root/'sdk';(sdk/'tools/ide/bin').mkdir(parents=True)
            for p in [sdk/'tools/sdb',sdk/'tools/ide/bin/tizen']:p.touch()
            with patch.object(installer.subprocess,'run',return_value=subprocess.CompletedProcess([],0,stdout='192.168.0.20:26101 device Other')) as run:
                self.assertEqual(installer.main(['--app',str(root/'app'),'--sdk',str(sdk),'--tv','192.168.0.10','--profile','MinhaTV']),1)
                self.assertEqual(run.call_count,2)


if __name__=='__main__':
    unittest.main()
