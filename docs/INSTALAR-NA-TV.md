# Instalar Painho Lula TV na Samsung Tizen

[Consulte a versão atualizada deste tutorial no GitHub](https://github.com/Liandersson/Painho_Lula/blob/main/docs/INSTALAR-NA-TV.md).

Este guia instala a versão Samsung Tizen usando um **computador Linux** (como Pop!_OS ou Ubuntu). Leia uma etapa, faça a conferência indicada e só depois avance. Não é possível garantir ausência de erros em todos os firmwares; a seção final explica como identificar os mais comuns.

## Antes de começar

Separe:

- Samsung TV com **Tizen 9.0 ou superior** e controle remoto.
- Computador Linux com acesso à internet e Python 3.10 ou superior.
- TV e computador na mesma rede local. Evite rede de convidados, que pode impedir a comunicação entre aparelhos.
- Sua conta Samsung, necessária para emitir o certificado.

Confira a versão do sistema em Informações/Sobre esta TV; o caminho varia por firmware. O modelo ou número de atualização do firmware não é necessariamente a versão Tizen. Se não encontrar essa informação, consulte o suporte Samsung para seu modelo. Esta release não suporta Tizen anterior a 9.0; editar o requisito no arquivo não cria compatibilidade.

O computador é necessário para instalar e atualizar. Depois, o app roda na própria TV, com o computador desligado, dependendo da internet e dos serviços de música.

## 1. Baixar o arquivo certo

1. Abra [a última release](https://github.com/Liandersson/Painho_Lula/releases/latest).
2. Na seção **Assets**, baixe o arquivo terminado em **Instalacao.zip**.
3. Não escolha **Source.zip**, **Source code (zip)** ou **Source code (tar.gz)**: são destinados à compilação, não ao assistente pronto.
4. No gerenciador de arquivos do Linux, clique com o botão direito no ZIP e escolha **Extrair aqui**.
5. Abra a pasta extraída. Localize `instalar-tv.sh`, `tools/`, `app/` e `LEIA-ME.md`. Se aparecer outra pasta dentro, entre nela até encontrar esses itens.
6. Abra o terminal nessa pasta: botão direito em uma área vazia → **Abrir no terminal**. O nome dessa opção pode variar.

Confira:

```bash
ls instalar-tv.sh tools/tizen_installer.py app/config.xml app/full-app/index.html
python3 --version
```

O primeiro comando deve listar os quatro arquivos, sem “No such file”. O segundo deve mostrar Python **3.10 ou superior**. No Pop!_OS/Ubuntu, se Python não estiver instalado, use `sudo apt update` e depois `sudo apt install python3`. Se a versão continuar antiga, atualize seu sistema por um método suportado; não substitua o Python do sistema manualmente.

## 2. Anotar os dois IPs corretamente

Você precisa de **dois endereços diferentes**:

| Endereço | Onde será usado |
| --- | --- |
| IP do computador | No Developer Mode da TV |
| IP da TV | No assistente de instalação |

No computador, abra Configurações → Rede ou Wi-Fi → detalhes da conexão e procure **IPv4**. Também pode executar `hostname -I`, mas ele pode listar vários endereços: escolha o da conexão à mesma rede da TV, não VPN, Docker ou outra rede virtual.

Na TV, abra Configurações → Rede → Status da rede → Configurações de IP (nomes variam) e anote o IPv4.

**Exemplo apenas:** computador `192.168.0.20`, TV `192.168.0.30`. Não copie esses números se seus aparelhos mostram outros. Não use o IP público da internet. Se trocar de rede ou reiniciar o roteador, confira os endereços novamente.

## 3. Ativar Developer Mode na TV

1. Abra **Apps** na TV.
2. Na tela **Apps Settings/Configurações de Apps**, digite **1 2 3 4 5** usando o controle ou o teclado numérico na tela. Em alguns firmwares o painel abre diretamente em Apps.
3. No painel **Developer Mode**, selecione **On/Ativado**.
4. No campo de IP do computador/Host PC, digite o **IP do computador** anotado na etapa 2.
5. Confirme e reinicie a TV conforme a instrução exibida. Apenas sair de Apps ou colocar em espera pode não bastar; siga o procedimento de reinicialização indicado para seu modelo.
6. Volte ao painel e confira se o modo continua ativado e o IP está correto.

Isso é o modo de desenvolvimento de Apps. Não entre no menu de serviço da TV. Se o painel não abrir, consulte o [procedimento oficial Samsung](https://developer.samsung.com/smarttv/develop/getting-started/using-sdk/tv-device.html) para seu firmware.

## 4. Preparar o Tizen Studio no Linux

1. Abra a [página oficial de instalação do TV SDK](https://developer.samsung.com/smarttv/develop/getting-started/setting-up-sdk/installing-tv-sdk.html).
2. Baixe o instalador Linux do Tizen Studio com as ferramentas web, seguindo os requisitos de sistema da página oficial. Não use instaladores de terceiros.
3. Abra as propriedades do arquivo baixado e permita executá-lo como programa. Execute o instalador com seu usuário normal e siga as telas.
4. Para facilitar, mantenha a pasta padrão **`~/tizen-studio`**. Anote o caminho se escolher outro.
5. Abra o **Package Manager** do Tizen Studio.
6. Instale as ferramentas de desenvolvimento web necessárias e, na área de extensões, **TV Extensions/TV Tools** e **Samsung Certificate Extension**. Os nomes podem incluir o número da versão.
7. Leia e aceite os contratos diretamente na ferramenta se concordar. Aguarde a conclusão dos downloads.

Confira no terminal:

```bash
ls "$HOME/tizen-studio/tools/sdb" "$HOME/tizen-studio/tools/ide/bin/tizen"
```

Os dois arquivos devem existir. Se não existirem, confira o caminho e os pacotes instalados. Se o Studio informar dependências Linux faltando, instale as indicadas pela documentação oficial para sua distribuição, em vez de copiar listas antigas de pacotes.

## 5. Conectar a TV e obter o DUID

1. Mantenha a TV ligada e o computador na mesma rede.
2. No Tizen Studio, abra **Tools → Device Manager**.
3. Abra **Remote Device Manager** (o botão pode aparecer como conexão remota).
4. Adicione um dispositivo: um nome de sua escolha, **IP da TV** e porta **26101**.
5. Ative a conexão. A TV deve aparecer conectada.
6. No dispositivo conectado, procure a opção **DUID** para copiar o identificador. Ele também pode ser preenchido automaticamente durante a criação do certificado.

Conferência alternativa no terminal, substituindo o IP de exemplo:

```bash
"$HOME/tizen-studio/tools/sdb" connect 192.168.0.30:26101
"$HOME/tizen-studio/tools/sdb" devices
```

A lista precisa mostrar **o IP da sua TV seguido de `:26101`**, com estado **`device`**. Não avance se estiver ausente ou offline. DUID não é IP, endereço MAC nem número de série da etiqueta.

## 6. Criar seu certificado Samsung TV

1. Abra **Tools → Certificate Manager** ou o Tizen Certificate Manager pelo menu do Linux.
2. Clique em **+** para criar um perfil.
3. Escolha **Samsung**, depois **TV**. Não escolha um certificado genérico Tizen para esta instalação.
4. Dê um nome simples ao perfil, por exemplo **MinhaTV**. Esse nome será pedido pelo assistente.
5. Para uma primeira instalação, crie um certificado de autor. Preencha seus dados e escolha sua senha. Para atualizar um app já assinado por você, reutilize seu certificado de autor existente.
6. Faça login na **sua própria conta Samsung** quando a ferramenta solicitar. Conclua eventuais confirmações no navegador.
7. Na etapa de certificado de distribuidor, inclua o **DUID da TV conectada**. Confira se ele realmente aparece na lista autorizada antes de concluir.
8. Termine o assistente e marque **MinhaTV** como perfil ativo no Certificate Manager.
9. Guarde uma cópia segura do certificado de autor e da senha: você precisará deles para futuras atualizações.

Nunca envie senha ou arquivos `.p12`, `.pem`, `.key` para o GitHub ou para um assistente de IA. Se o login ou a emissão falhar, corrija essa etapa antes de instalar. Veja o [guia oficial de certificados Samsung](https://developer.samsung.com/smarttv/develop/getting-started/setting-up-sdk/creating-certificates.html).

## 7. Instalar com o assistente

Volte ao terminal aberto na pasta extraída na etapa 1. Para conferir essa localização, execute `ls instalar-tv.sh`.

Opcional: veja o plano, sem conectar, assinar ou instalar:

```bash
bash instalar-tv.sh --tv 192.168.0.30 --profile MinhaTV --dry-run
```

Troque o IP e o nome do perfil pelos seus. **Dry-run não valida rede, senha nem autorização do certificado.** Ele apenas confere o pacote e mostra o plano.

Para instalar de verdade:

```bash
bash instalar-tv.sh
```

Quando solicitado:

1. Informe o **IPv4 da TV**, sem asteriscos, sem `http://` e sem a porta. Exemplo: `192.168.0.30`.
2. Informe o **nome do perfil**, exatamente como aparece no Certificate Manager. Exemplo: `MinhaTV`.
3. Se o SDK pedir senha do certificado, digite diretamente no prompt da ferramenta. Se perguntar se deseja salvá-la, prefira **N**. Não cole a senha no chat.
4. Aguarde as etapas de conexão, assinatura, permissão, instalação e abertura. Não desligue a TV nem interrompa o terminal.

Para SDK em outra pasta, use o caminho real, entre aspas se contiver espaços:

```bash
bash instalar-tv.sh --tv 192.168.0.30 --profile MinhaTV --sdk "/caminho/para/tizen-studio"
```

Ao terminar, o assistente deve mostrar **“Instalado e iniciado”**. O `.wgt` assinado ficará em **`pacotes-assinados/`**. Esse WGT foi assinado para os dispositivos autorizados no seu certificado; não é um instalador universal para outras TVs.

## 8. Conferir na TV

- O app abriu? Caso não, procure **Painho Lula** em Apps.
- Teste Home, Search e Recents com as setas e OK.
- Pesquise uma música, inicie e deixe tocar; teste pausar/continuar e trocar faixa.
- Confira CH+/CH− e o acesso ao player. O volume geral é controlado pelo controle da TV; no player há mute/desmute.
- Depois da instalação, desligue o computador e confira a reprodução na TV. A TV ainda precisa de internet.

Uma mensagem de instalação concluída confirma a instalação, não garante que todos os serviços online ou recursos funcionem em qualquer firmware.

## Usar Codex ou Claude Code

**Pode ser mais fácil fazer a instalação com Codex ou Claude Code**, especialmente para abrir a pasta certa, verificar ferramentas e interpretar erros. Use uma sessão com acesso local à pasta extraída e ao terminal do seu computador. Um chat sem acesso ao computador só consegue orientar.

Para começar sem preencher todos os dados antes, envie:

> Instale este app na minha Samsung Tizen TV: https://github.com/Liandersson/Painho_Lula — leia AGENTS.md e docs/INSTALACAO-ASSISTIDA.md, confira meu computador e me peça apenas o que faltar.

O assistente começa pedindo apenas **o IP da TV** e **se o Developer Mode está ativo**. Ele detecta as ferramentas e os perfis disponíveis, obtém o ZIP da última release e confere o checksum. Só interrompe para uma ação humana quando ela for necessária, como login Samsung ou criação do certificado. Não é preciso saber nome de perfil, DUID ou caminho do SDK para começar. Se o projeto não for lido automaticamente pelo seu ambiente, forneça o [link direto do roteiro](https://github.com/Liandersson/Painho_Lula/blob/main/docs/INSTALACAO-ASSISTIDA.md).

O assistente não substitui a conta Samsung, o certificado ou as ações no controle. Se não tiver acesso ao terminal, execute os comandos orientados manualmente. Não há garantia de instalação sem erros por usar uma IA.

## Erros comuns: como resolver

| Mensagem ou situação | O que conferir |
| --- | --- |
| `instalar-tv.sh: No such file` | Você abriu o terminal na pasta errada. Entre na pasta que contém `instalar-tv.sh`, `tools` e `app`. |
| `App não compilado` | Baixou Source.zip ou o ZIP automático do GitHub. Use **Instalacao.zip** da release. |
| Python ausente ou erro de sintaxe | Confira `python3 --version`: precisa ser 3.10+. |
| `SDK não encontrado` | Confira os dois arquivos da etapa 4 e use `--sdk` com a pasta real. |
| TV não conectada, offline ou conexão recusada | Confira IPs, Developer Mode, reinicialização, porta 26101, mesma rede e isolamento de convidados. Verifique firewall sem desativar a proteção inteira. |
| Perfil não encontrado | Use exatamente o nome do Certificate Manager e confira se o perfil Samsung TV está ativo. |
| Erro de assinatura, DUID ou certificado | Confira validade, senha, perfil Samsung TV e DUID incluído no certificado de distribuidor. Não remova verificações. |
| Erro de permissão para instalar | Com a TV conectada, confira o perfil ativo e a opção **Permit to install applications** no Device Manager; siga a mensagem oficial. O assistente também executa `install-permit`. |
| `1010` ou instalação falhou | O código é genérico: copie a mensagem completa e confira certificado, versão Tizen e permissão. Não presuma uma única causa. |
| Arquivo de saída já existe | Preserve o pacote anterior e use `bash instalar-tv.sh --output pacotes-novos`. |
| Autor/certificado diferente da instalação anterior | Reutilize o certificado de autor original. Desinstalar pode apagar histórico; o assistente não faz isso automaticamente. |
| Instalou, mas pesquisa ou áudio falham | Confira internet da TV, hora/data e mensagem do app. Pode ser indisponibilidade do serviço externo; reinstalar não é solução garantida. |

Se continuar falhando, [abra um problema](https://github.com/Liandersson/Painho_Lula/issues) com modelo, versão Tizen, etapa e saída do terminal sem dados privados. Não publique os certificados.

## Atualizar ou instalar em outra TV

Para atualizar: baixe o novo **Instalacao.zip**, extraia em outra pasta e repita a instalação usando o **mesmo certificado de autor**. Faça cópia segura dos seus certificados; não sobrescreva o pacote anterior sem necessidade.

Para outra TV: confirme Tizen 9.0+, ative Developer Mode nela, conecte-a e inclua seu DUID no certificado de distribuidor pelo Certificate Manager. Gere e instale um novo WGT com o IP dessa TV. Não basta enviar o WGT assinado para sua primeira TV.

## Referências oficiais

- [Configurar a TV e Developer Mode](https://developer.samsung.com/smarttv/develop/getting-started/using-sdk/tv-device.html)
- [Instalar TV SDK e extensões](https://developer.samsung.com/smarttv/develop/getting-started/setting-up-sdk/installing-tv-sdk.html)
- [Criar certificados](https://developer.samsung.com/smarttv/develop/getting-started/setting-up-sdk/creating-certificates.html)
- [CLI para assinar, instalar e executar](https://developer.samsung.com/smarttv/develop/getting-started/using-sdk/command-line-interface.html)
