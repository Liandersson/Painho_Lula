# Compilar a versão web Tizen

Use Linux, Node.js 22+ e pnpm **11.25.0**, conforme `web/package.json`. Não é necessário Android Studio para esta versão.

```bash
corepack enable
corepack prepare pnpm@11.25.0 --activate
bash web/tizen-tv/build-web-app.sh
```

O script usa o lockfile, aplica o patch de letras, executa TypeScript e compila com `--mode tizen`. O resultado vai para `web/tizen-tv/full-app`. Os módulos originais permanecem no projeto; esse comando só constrói o runtime web da TV.

Para gerar os arquivos públicos, sem certificados:

```bash
python3 tools/build_public_release.py
```

Em `release-output/` serão gerados o ZIP de instalação sem assinatura, a fonte correspondente e SHA256SUMS.txt. O SDK só é necessário na etapa de assinar/instalar em cada TV.

Para testar o assistente e a distribuição:

```bash
python3 -m unittest discover -s tests -v
```

As regressões do app estão em `web/app/src/**/*.test.ts*`. O relatório da versão TV indica quais testes foram executados; não confunda uma compilação bem-sucedida com validação física em todos os modelos.
