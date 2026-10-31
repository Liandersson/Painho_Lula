# Painho Lula para Pop!_OS / Linux

Este projeto produz um pacote `.deb` para computadores **Linux x86_64 (amd64)**. Ele não é o APK Android.

## Instalar o pacote pronto

No terminal, entre na pasta onde salvou o arquivo e execute:

```bash
sudo apt install ./painho-lula_1.9.30_amd64.deb
```

Depois, abra **Painho Lula** pelo menu de aplicativos. Para remover:

```bash
sudo apt remove painho-lula
```

O pacote inclui runtime Java próprio. Ele foi gerado no Pop!_OS 24.04 x86_64 e suas dependências de sistema são declaradas no `.deb`.

## Gerar outro pacote

Use JDK 21, CMake e um compilador C++ (`g++`). Na raiz deste projeto:

```bash
./gradlew :desktopApp:packageDeb
desktopApp/packaging/fix-deb-launcher-name.sh desktopApp/build/compose/binaries/main/deb/painho-lula_1.9.30_amd64.deb
```

O arquivo de saída fica em `desktopApp/build/compose/binaries/main/deb/`.

## Origem e licença

O módulo desktop foi portado do código desktop beta do BitChord e compilado junto aos módulos compartilhados v1.9 deste projeto. O upstream encerrou a distribuição desktop; portanto, esta compilação pessoal não é uma versão oficial e ainda precisa ser validada no notebook alvo. Avisos de autoria foram preservados e o projeto continua sob GPL-3.0; consulte `LICENSE` e o código-fonte incluído no arquivo de origem.

O analisador nativo do Automix foi compilado com CMake e incluído no pacote. Não foi executado um teste de instalação ou reprodução neste ambiente.
