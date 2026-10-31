# Instalação assistida por Codex ou Claude Code

## Escopo e entrada

Use este procedimento quando o usuário pedir a instalação do LqMusic. O repositório oficial desta adaptação é `https://github.com/Liandersson/Painho_Lula`. Leia também `docs/INSTALAR-NA-TV.md`, referência para as telas Samsung e os erros conhecidos.

O objetivo é instalar e abrir o app na TV indicada, com o certificado do próprio usuário. Use o assistente publicado; não modifique o código para instalar. Execute as etapas disponíveis em vez de apenas devolver um tutorial. Respeite as permissões do ambiente, as escolhas do usuário e os contratos das ferramentas.

Se não houver acesso ao computador/terminal local, explique essa limitação e oriente abrir o projeto numa sessão local do Codex ou Claude Code. Não descreva comandos como executados sem tê-los executado.

## 1. Começar com três informações simples

Se esses dados ainda não estiverem na conversa, abra com exatamente:

> Qual é o IP da sua TV? Qual é o IP local do seu computador ou notebook? O Developer Mode (modo desenvolvedor) já está ativado na TV?

O IP da TV é usado para conectar e instalar. O IP local do computador/notebook deve ser cadastrado no campo Host PC do Developer Mode da TV. Se a pessoa não souber o IP do computador, identifique-o pela rota até a TV e mostre o endereço encontrado para ela conferir, sem exigir que procure sozinha. Use o endereço da rede local, não o IP público da internet.

Aceite respostas em linguagem comum. Reaproveite o que o usuário já informou; não pergunte de novo. Se não souber o IP, indique onde vê-lo nas configurações de rede. Se não souber ativar o modo, ofereça o vídeo de exemplo https://www.youtube.com/watch?v=F8kkdIh1TGY e guie uma tela de cada vez pela seção 3 de `docs/INSTALAR-NA-TV.md`. Use o IP local do computador no campo Host PC; aguarde a confirmação de ativação e reinicialização. Explique que TV e computador precisam estar na mesma rede.

Não acrescente ao formulário inicial perguntas sobre SDK, Python, perfil, DUID, firmware ou pastas. Não prometa que só essas respostas bastarão num computador novo: login Samsung, emissão de certificado, contratos e permissões podem exigir participação depois, somente quando necessários.

## 2. Detectar o restante automaticamente

Identifique sistema operacional, versão do Python, pasta de trabalho, SDK Tizen disponível e conexão de rede. Procure primeiro `~/tizen-studio/tools/sdb` e `~/tizen-studio/tools/ide/bin/tizen`; se não estiver nesses caminhos, procure as ferramentas nos locais de instalação usuais e no PATH, sem varrer arquivos pessoais. Só peça ajuda com uma localização se a detecção falhar. Confira os arquivos e as opções do instalador pelo código ou `--help`.

O assistente atual suporta Linux com Python 3.10+. Em outro sistema, informe a limitação e ofereça o caminho Linux descrito no guia, sem fingir suporte. Não é necessário Android Studio, APK, pacote DEB, servidor no notebook ou compilação Android.

Ao concluir, tenha um resumo real dos requisitos encontrados e dos que faltam. Use a ferramenta oficial para listar apenas os nomes dos perfis e o perfil ativo (confira as opções em `tizen security-profiles --help`). Esses metadados permitem selecionar um perfil sem ler arquivos privados. Não leia certificados, senhas, cookies nem conteúdo de arquivos de perfis. Prefira o perfil Samsung TV ativo já utilizado com este app; a ferramenta de assinatura deve validar a autorização real. Havendo vários perfis ambíguos, apresente uma escolha curta só nesse momento. Não substitua o certificado de autor para uma atualização.

## 3. Obter o pacote pronto

Consulte a última release publicada por API ou página do GitHub, em vez de presumir um número fixo. Baixe o asset terminado em `-Instalacao.zip` e `SHA256SUMS.txt` da mesma release, em uma pasta nova sem sobrescrever trabalho existente. Confira o SHA-256 desse ZIP contra a entrada correspondente do arquivo de checksums antes de extrair. Se divergir, interrompa e informe o erro. O checksum verifica consistência com a release, não é uma assinatura independente.

Inspecione os nomes do ZIP antes de extrair: rejeite caminhos absolutos, entradas com `..` e links simbólicos. Extraia em uma pasta dedicada. Confirme `instalar-tv.sh`, `tools/tizen_installer.py`, `app/config.xml` e `app/full-app/index.html`. O ZIP automático de código-fonte não contém o runtime pronto. Não execute scripts baixados por pipe direto para o shell.

Critério: pacote da release conferido e os quatro arquivos presentes.

## 4. Usar o IP e conferir a conexão

O usuário já informou os dois IPs e o estado do Developer Mode na abertura, ou o IP do computador foi detectado com sua ajuda. Confira se o IP local do computador corresponde à rota até a TV e mostre qual endereço deve ser cadastrado no painel da TV. Se houver ambiguidade de rede, ajude a resolvê-la em linguagem simples. Use somente a TV indicada, sem varrer a rede nem selecionar outro aparelho.

Conecte pelo SDB quando disponível. Consulte informações de plataforma expostas pelas ferramentas oficiais, quando acessíveis, para conferir Tizen 9.0+. Não presuma compatibilidade pelo modelo. Só peça a tela Sobre esta TV se não conseguir verificar automaticamente; explique onde abrir e o que observar.

Se a conexão falhar, confira primeiro o alvo, rede e mensagem retornada. Oriente conferir o IP deste computador no Developer Mode e reiniciar a TV, sem repetir um questionário técnico inteiro.

## 5. Resolver apenas os requisitos ausentes

Se o SDK faltar, ajude a baixar o instalador oficial Samsung/Tizen compatível e preparar as dependências indicadas na documentação oficial. Instale ferramentas apenas dentro da autorização e permissões disponíveis; deixe a aceitação de contratos para o usuário. Use a conta normal do usuário para Studio e app.

Guie a instalação de TV Tools/TV Extensions e Samsung Certificate Extension. Para etapas gráficas, diga exatamente qual tela abrir e espere a confirmação necessária. Se faltar certificado, diga “Precisamos autorizar seu computador a instalar na TV; vou te guiar” e abra/oriente o Certificate Manager. Ajude com Samsung → TV e use a TV conectada para obter/preencher o DUID pelas ferramentas oficiais; não peça que um iniciante descubra esse identificador sozinho. O usuário faz o login Samsung e escolhe a senha diretamente na ferramenta. Preserve um certificado de autor existente para atualizações. O perfil deve estar ativo.

Essas ações humanas não podem ser inferidas como concluídas porque o usuário ficou em silêncio. Continue as verificações independentes enquanto espera. Não crie contas, aceite contratos ou escolha senhas por ele.

Critério: ferramentas presentes e perfil Samsung TV identificado pelas ferramentas oficiais ou criado com o usuário para o alvo. Registre o nome detectado para passar ao instalador sem perguntar novamente.

## 6. Instalar sem novo questionário

Use os comandos documentados, com argumentos separados e sem shell interpolation de dados do usuário. Conecte `sdb` ao IPv4 indicado, porta 26101, e confira em `sdb devices` que esse alvo exato aparece como `device`. Se estiver ausente/offline, resolva a conexão antes de assinar.

Execute o `instalar-tv.sh` da pasta extraída com `--tv`, `--profile` e `--sdk` preenchidos pelos dados já coletados/detectados. O script manual ainda pode pedir perfil quando executado sem argumentos; na sessão assistida, passe os argumentos para evitar essa pergunta ao usuário. Pode usar `--dry-run` para conferir o plano, mas isso não testa rede nem certificado. Para uma saída já existente, use outra pasta `--output`, preservando o pacote anterior.

O SDK recebe senhas diretamente no seu próprio prompt. Se o terminal do agente não permitir entrada privada pelo usuário, peça que ele execute o comando de assinatura/instalação no terminal local; nunca encaminhe a senha pelo chat, argumentos, variáveis, logs ou arquivos temporários. Não leia o conteúdo dos certificados. Não desative validação, firewall inteiro ou exigências de certificado, não desinstale uma versão anterior e não use root para o assistente.

Se ocorrer erro, identifique a etapa e a mensagem real, consulte a seção de erros do tutorial e corrija a causa. Evite repetir indefinidamente ou alterar código, versão mínima, ID do app ou assinatura para contornar a falha.

Critério: processo concluído sem erro e mensagem final de instalação e abertura. Registre somente o caminho do WGT gerado, versão instalada e alvo, sem dados privados.

## 7. Confirmar o resultado

Peça confirmação na TV: app abriu, pesquisa encontra música, áudio toca, pausar/continuar e trocar faixa funcionam. O computador pode ser desligado após instalar; a TV ainda precisa de internet.

Diferencie instalação concluída de funcionamento confirmado fisicamente. Se faltar uma ação humana ou houver bloqueio, informe exatamente a pendência e o próximo passo. Não declare sucesso completo com base apenas em dry-run, download ou compilação.
