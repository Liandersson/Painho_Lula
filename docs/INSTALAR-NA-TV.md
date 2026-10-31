# Instalar Painho Lula em outra Samsung Tizen TV

Requer Tizen 9.0+, computador Linux, Python 3.10+ e rede local entre computador e TV. O ZIP de instalação não é para abrir diretamente na TV. O assistente usa as ferramentas oficiais; não exige root, kernel ou drivers modificados.

## 1. Preparar a TV

Abra Apps, ative Developer Mode (normalmente digitando 12345 nessa tela), informe o IP local do computador e reinicie a TV conforme as instruções da Samsung. Anote o IP da TV. O menu pode variar por firmware.

## 2. Preparar o computador e o certificado

Instale o [Tizen Studio/TV SDK oficial](https://developer.samsung.com/smarttv/develop/getting-started/setting-up-sdk/installing-tv-sdk.html), com TV Tools e Samsung Certificate Extension. Aceite os termos diretamente na ferramenta, após ler.

No Certificate Manager, crie um perfil **Samsung → TV**. Entre na sua própria conta Samsung, escolha uma senha e inclua o **DUID da sua TV** no certificado de distribuidor. Defina esse perfil como ativo no Certificate Manager. Preserve o certificado de autor se já tem uma instalação sua para atualizar.

A [documentação oficial dos certificados](https://developer.samsung.com/smarttv/develop/getting-started/setting-up-sdk/creating-certificates.html) explica esse cadastro. Uma TV fora da lista do certificado não pode instalar aquele pacote de desenvolvimento. Não copie certificados ou senhas do mantenedor nem publique os seus.

## 3. Rodar o assistente

Extraia o arquivo `Painho-Lula-TV-1.3.0-Instalacao.zip`, abra o terminal nessa pasta e execute:

```bash
bash instalar-tv.sh
```

Informe o IPv4 da TV e o nome do perfil criado. O caminho padrão do SDK é `~/tizen-studio`. Para outro caminho:

```bash
bash instalar-tv.sh --tv 192.168.0.10 --profile MinhaTV --sdk /caminho/tizen-studio
```

O IP acima é apenas um exemplo. Use o da sua TV. Você pode conferir o plano sem conectar ou instalar:

```bash
bash instalar-tv.sh --tv 192.168.0.10 --profile MinhaTV --dry-run
```

O assistente conecta à TV indicada, confirma que ela aparece no SDB, copia o runtime sem assinatura, pede ao SDK para assinar com seu perfil, solicita permissão de instalação e instala/inicia o app. As senhas são digitadas **diretamente no SDK**; o assistente não as recebe nem salva. Se o SDK perguntar se deseja guardá-las, prefira **N**. Um pacote com nome sem espaços fica em `pacotes-assinados/`.

## Atualizações e erros comuns

- Use o mesmo certificado de autor para atualizar sua instalação. Trocar o autor pode exigir desinstalar a anterior; isso pode apagar o histórico local. O assistente **não desinstala** apps automaticamente.
- Erro de certificado: verifique perfil Samsung, DUID correto, validade e permissão para instalar. Não desative verificações de segurança.
- TV não conectada: confira Developer Mode, IP do computador configurado na TV, reinicialização, rede e firewall.
- SDK não encontrado: informe `--sdk` apontando à pasta que contém `tools/sdb`.
- App não compilado: baixe o ZIP de instalação da release ou siga COMPILAR.md. O ZIP Source é para desenvolvimento.
- Arquivo de saída já existe: use `--output outra-pasta` para preservar o pacote anterior.
- Tizen anterior a 9.0: esta release não oferece compatibilidade; não basta editar a versão mínima.

[CLI oficial Samsung](https://developer.samsung.com/smarttv/develop/getting-started/using-sdk/command-line-interface.html).
