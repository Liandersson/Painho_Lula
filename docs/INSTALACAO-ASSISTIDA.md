# Instalação assistida por Codex ou Claude Code

## Escopo e entrada

Use este procedimento quando o usuário pedir a instalação do Painho Lula TV. O repositório oficial desta adaptação é `https://github.com/Liandersson/Painho_Lula`. Leia também `docs/INSTALAR-NA-TV.md`, referência para as telas Samsung e os erros conhecidos.

O objetivo é instalar e abrir o app na TV indicada, com o certificado do próprio usuário. Use o assistente publicado; não modifique o código para instalar. Execute as etapas disponíveis em vez de apenas devolver um tutorial. Respeite as permissões do ambiente, as escolhas do usuário e os contratos das ferramentas.

Se não houver acesso ao computador/terminal local, explique essa limitação e oriente abrir o projeto numa sessão local do Codex ou Claude Code. Não descreva comandos como executados sem tê-los executado.

## 1. Inspecionar antes de perguntar

Identifique sistema operacional, versão do Python, pasta de trabalho, SDK Tizen disponível e conexão de rede. Procure primeiro `~/tizen-studio/tools/sdb` e `~/tizen-studio/tools/ide/bin/tizen`; caminhos alternativos podem ser informados pelo usuário. Confira os arquivos e as opções do instalador pelo código ou `--help`.

O assistente atual suporta Linux com Python 3.10+. Em outro sistema, informe a limitação e ofereça o caminho Linux descrito no guia, sem fingir suporte. Não é necessário Android Studio, APK, pacote DEB, servidor no notebook ou compilação Android.

Ao concluir, tenha um resumo real dos requisitos encontrados e dos que faltam. Não vasculhe diretórios de credenciais nem leia certificados, senhas, cookies ou arquivos de perfis privados. O usuário informa apenas o nome do perfil, não a senha.

## 2. Obter o pacote pronto

Consulte a última release publicada por API ou página do GitHub, em vez de presumir um número fixo. Baixe o asset terminado em `-Instalacao.zip` e `SHA256SUMS.txt` da mesma release, em uma pasta nova sem sobrescrever trabalho existente. Confira o SHA-256 desse ZIP contra a entrada correspondente do arquivo de checksums antes de extrair. Se divergir, interrompa e informe o erro. O checksum verifica consistência com a release, não é uma assinatura independente.

Inspecione os nomes do ZIP antes de extrair: rejeite caminhos absolutos, entradas com `..` e links simbólicos. Extraia em uma pasta dedicada. Confirme `instalar-tv.sh`, `tools/tizen_installer.py`, `app/config.xml` e `app/full-app/index.html`. O ZIP automático de código-fonte não contém o runtime pronto. Não execute scripts baixados por pipe direto para o shell.

Critério: pacote da release conferido e os quatro arquivos presentes.

## 3. Pedir somente o que falta

Faça perguntas curtas e agrupadas quando forem independentes:

- Qual é o IPv4 da TV e ela usa Tizen 9.0+? O ano/modelo sozinho não confirma isso.
- Developer Mode está ativado com o IP deste computador e a TV foi reiniciada?
- Já existe um perfil Samsung TV com o DUID desta TV? Qual o nome?

O IP local do computador pode ser identificado pela conexão de rede; se houver várias interfaces/VPN, confirme qual rede alcança a TV. Não escolha outra TV automaticamente, nem teste uma faixa inteira de IPs. Use somente o alvo indicado. Nunca peça senha da conta Samsung ou do certificado pelo chat.

## 4. Preparar ferramentas e certificado

Se o SDK faltar, ajude a baixar o instalador oficial Samsung/Tizen compatível e preparar as dependências indicadas na documentação oficial. Instale ferramentas apenas dentro da autorização e permissões disponíveis; deixe a aceitação de contratos para o usuário. Use a conta normal do usuário para Studio e app.

Guie a instalação de TV Tools/TV Extensions e Samsung Certificate Extension. Para etapas gráficas, diga exatamente qual tela abrir e espere a confirmação necessária. Oriente Developer Mode pelo controle, login Samsung e Certificate Manager com Samsung → TV, certificado de autor, distribuidor e DUID. Preserve um certificado de autor existente para atualizações. O perfil deve estar ativo.

Essas ações humanas não podem ser inferidas como concluídas porque o usuário ficou em silêncio. Continue as verificações independentes enquanto espera. Não crie contas, aceite contratos ou escolha senhas por ele.

Critério: ferramentas presentes, usuário confirmou as etapas necessárias e informou um perfil Samsung TV preparado para o alvo.

## 5. Conectar e instalar

Use os comandos documentados, com argumentos separados e sem shell interpolation de dados do usuário. Conecte `sdb` ao IPv4 indicado, porta 26101, e confira em `sdb devices` que esse alvo exato aparece como `device`. Se estiver ausente/offline, resolva a conexão antes de assinar.

Execute o `instalar-tv.sh` da pasta extraída, informando `--tv`, `--profile` e `--sdk` quando necessário. Pode usar `--dry-run` para conferir o plano, mas isso não testa rede nem certificado. Para uma saída já existente, use outra pasta `--output`, preservando o pacote anterior.

O SDK recebe senhas diretamente no seu próprio prompt. Se o terminal do agente não permitir entrada privada pelo usuário, peça que ele execute o comando de assinatura/instalação no terminal local; nunca encaminhe a senha pelo chat, argumentos, variáveis, logs ou arquivos temporários. Não leia o conteúdo dos certificados. Não desative validação, firewall inteiro ou exigências de certificado, não desinstale uma versão anterior e não use root para o assistente.

Se ocorrer erro, identifique a etapa e a mensagem real, consulte a seção de erros do tutorial e corrija a causa. Evite repetir indefinidamente ou alterar código, versão mínima, ID do app ou assinatura para contornar a falha.

Critério: processo concluído sem erro e mensagem final de instalação e abertura. Registre somente o caminho do WGT gerado, versão instalada e alvo, sem dados privados.

## 6. Validar com o usuário

Peça confirmação na TV: app abriu, pesquisa encontra música, áudio toca, pausar/continuar e trocar faixa funcionam. O computador pode ser desligado após instalar; a TV ainda precisa de internet.

Diferencie instalação concluída de funcionamento confirmado fisicamente. Se faltar uma ação humana ou houver bloqueio, informe exatamente a pendência e o próximo passo. Não declare sucesso completo com base apenas em dry-run, download ou compilação.
