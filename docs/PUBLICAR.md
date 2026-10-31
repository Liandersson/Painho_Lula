# Publicar uma versão TV

O workflow `Publicar TV` executa apenas em `main` quando `release/manifest.json` muda, ou por acionamento manual no GitHub. Ele compila o web app com lockfile, testa o assistente, cria ZIPs sem certificados e publica uma release. As ações oficiais são fixadas por SHA.

1. Atualize a versão em `web/tizen-tv/config.xml` e `release/manifest.json`.
2. Teste fonte/runtime e atualize `release/NOTAS.md` com limitações reais.
3. Faça commit e envie para `main`. O workflow cria a tag `tv-vVERSAO` e publica os ZIPs e hashes. Uma tag já existente causa falha: crie outra versão, não sobrescreva uma release publicada.
4. Confira o resultado em Actions e os arquivos em Releases.

O único token usado no workflow é o `GITHUB_TOKEN` temporário do próprio repositório com permissão de conteúdo para criar a release. Não configure certificados Samsung nem senhas em Secrets. O processo não assina WGT na nuvem.

Os workflows herdados do projeto original estão preservados como texto em `docs/upstream-workflows/`, sem executar deploys/comentários herdados neste fork.

Na primeira publicação, arquivos idênticos ao upstream são restaurados a partir de uma revisão Git fixada, e as alterações vêm de um overlay local. Cada arquivo é verificado por SHA-256 antes de ser commitado. Isso evita reenviar modelos/fontes já públicos pela conexão local. Depois, a fonte completa fica em main e o manifest de proveniência em docs/SOURCE-PROVENANCE.json; as próximas versões compilam diretamente essa fonte. O workflow publica a release apontando ao commit completo, não ao bootstrap.
