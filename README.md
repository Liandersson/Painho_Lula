# Painho Lula TV

Web app de música para **Samsung Smart TV com Tizen 9.0 ou superior**, adaptado do [BitChord](https://github.com/kushagrasinghx/BitChord).

## Instalar com Codex ou Claude Code

Abra uma sessão com acesso ao terminal do seu computador Linux e envie:

> Instale este app na minha Samsung Tizen TV: https://github.com/Liandersson/Painho_Lula — siga as instruções de instalação assistida do repositório, comece pelas verificações e me peça apenas o que faltar.

O repositório contém `AGENTS.md`, `CLAUDE.md` e um [roteiro para o assistente](docs/INSTALACAO-ASSISTIDA.md). Se ele não ler o projeto automaticamente, peça para abrir esse roteiro. Assim ele pode conferir o computador, baixar a release, verificar o pacote e conduzir a instalação.

Só colar o link não garante iniciar uma instalação: o pedido acima deixa sua intenção clara. Você ainda fará as etapas no controle, o login Samsung e a criação do certificado. **Não envie senhas pelo chat.**

## Instalação na Samsung TV

**Comece pelo [tutorial completo de instalação](docs/INSTALAR-NA-TV.md).** Ele explica cada etapa, o que conferir e como resolver os erros mais comuns.

1. Baixe **Instalacao.zip** em [Releases](https://github.com/Liandersson/Painho_Lula/releases/latest). Não baixe “Source code” para instalar.
2. No computador Linux, extraia o ZIP e prepare as ferramentas oficiais Samsung.
3. Ative o Developer Mode na TV e crie seu certificado Samsung incluindo essa TV.
4. Execute `bash instalar-tv.sh` na pasta extraída. O assistente assina, instala e abre o app.

**Pode ser mais fácil usar Codex ou Claude Code no computador para acompanhar os comandos.** O [tutorial contém um pedido pronto para copiar](docs/INSTALAR-NA-TV.md#usar-codex-ou-claude-code). Você ainda precisa usar o controle da TV, entrar na sua conta Samsung e criar o certificado pessoalmente.

O ZIP não é instalado por pendrive nem aberto no navegador da TV. Não existe um WGT universal: cada usuário precisa assinar para o DUID da própria TV. Esta distribuição não está na loja Samsung.

## Requisitos e compatibilidade

- Samsung TV com **Tizen 9.0+**. Verifique o sistema; o ano do modelo não basta.
- Computador **Linux com Python 3.10+**, Tizen Studio, TV Tools e Samsung Certificate Extension. O assistente publicado é para Linux; não há instalador Windows/macOS nesta release.
- Computador e TV na mesma rede local e acesso à internet.
- Conta Samsung e certificado Samsung TV com o DUID correto.

Base usada no desenvolvimento: **UN50CU7700GXZD atualizada para Tizen 9.0**. Outros modelos e firmwares não têm validação física garantida.

## O que a versão TV oferece

- Pesquisa de músicas e reprodução online; navegação por setas, OK e Voltar.
- Player, fila, letras e comandos CH+/CH− para trocar faixas.
- Histórico local Recents com até 200 músicas.
- Continuação automática por recomendações; o gênero exato não é garantido.
- Tradução de letras para português quando o serviço externo estiver disponível.

Login Google, biblioteca sincronizada e integrações de contas não têm paridade com o aplicativo Android. Serviços externos podem mudar ou ficar indisponíveis. A tradução também depende de serviço externo. A validação física das mudanças recentes de navegação e teclado continua necessária.

## Ajuda

[Tutorial e solução de erros](docs/INSTALAR-NA-TV.md) · [Relatório de validação](docs/VALIDACAO.md) · [Informar um problema](https://github.com/Liandersson/Painho_Lula/issues)

Ao informar um erro, inclua modelo, versão Tizen, etapa e mensagem completa. Não publique senhas ou certificados.

## Código-fonte e créditos

A instalação distribuída aqui é **somente para Samsung Tizen TV**. Os módulos originais foram preservados como código-fonte para manter a base do projeto; não são opções de instalação desta release.

[Compilar a versão Tizen](docs/COMPILAR.md) · [Licença GPL-3.0](LICENSE) · [Créditos e licenças de terceiros](NOTICE.md)
