# Painho Lula — Samsung Tizen TV

Adaptação do [BitChord](https://github.com/kushagrasinghx/BitChord) para Samsung Tizen TV, com a interface e o motor web originais como base. Créditos do projeto original preservados. GPL-3.0; componentes de terceiros mantêm suas próprias licenças.

## Instalar na TV

1. Abra [Releases](https://github.com/Liandersson/Painho_Lula/releases) e baixe **Painho-Lula-TV-1.3.0-Instalacao.zip**.
2. Extraia o ZIP no computador. Ele contém o app **sem assinatura**, um guia e o assistente de instalação.
3. Prepare o Developer Mode, Tizen Studio e seu certificado Samsung com o DUID da sua TV: [guia completo](docs/INSTALAR-NA-TV.md).
4. Na pasta extraída, execute `bash instalar-tv.sh` e informe o IP da TV e seu perfil de certificado.

O assistente é para **Linux, com Python 3.10+**. Ele não instala o SDK nem cria uma conta/certificado Samsung por você. Cada usuário assina localmente para sua TV. **Não há WGT universal pronto para todas as TVs**, nem instalação pela loja Samsung.

## Compatibilidade e estado real

- Pacote exige **Tizen 9.0+**; não basta saber o ano da TV. Modelos anteriores precisam de outra adaptação.
- Base validada no desenvolvimento na Samsung **UN50CU7700GXZD atualizada para Tizen 9.0**; outros modelos/firmwares ainda precisam de testes.
- Pesquisa, capas, reprodução online e comandos básicos foram confirmados nessa TV durante o desenvolvimento. Testes físicos de cada mudança recente de teclado/navegação continuam necessários.
- Controle direcional/OK/Voltar; CH+/CH− trocam faixas. Player com foco inicial em play/pause e mute/desmute.
- Recents local de até 200 músicas, em blocos de 20. Selecionar uma faixa não importa a lista inteira para a fila.
- “Continuar tocando” usa recomendações da música selecionada. A fonte não garante gênero, energia ou época exatos.
- Letras: tradução automática para português quando o serviço já usado pela biblioteca funciona; letra original permanece disponível. Depende de rede e de uma interface não oficial do Google.
- **Login Google, biblioteca pessoal sincronizada e integrações de contas não têm paridade com Android/extensão.** O port não importa cookies nem contorna restrições.
- Serviços externos podem mudar ou parar de responder. O projeto não hospeda arquivos de música.

## Desenvolver

[Fonte e compilação](docs/COMPILAR.md) · [Licença e créditos](NOTICE.md) · [Validação](docs/VALIDACAO.md) · [Publicar uma versão](docs/PUBLICAR.md)

Os módulos Android, desktop, TV Android e Wear OS foram preservados como fonte; a release desta página entrega **somente a adaptação web Tizen**. O [README anterior](docs/UPSTREAM-README.md) e os avisos de copyright originais foram mantidos.
