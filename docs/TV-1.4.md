# LqMusic 1.4 para Samsung Tizen

Esta versão mantém o identificador `painholula.PainhoLulaTV`, a licença GPL-3.0, os créditos da base BitChord e a chave existente do histórico local. A compatibilidade mínima configurada é Tizen 9.0. O modelo de referência é Samsung UN50CU7700GXZD.

## O que mudou

A Home tem destaque estático, temas escolhidos nas configurações, artistas frequentes, favoritas e recentes. Favoritar uma faixa tem peso explícito no perfil; o histórico só influencia recomendações depois de uma escuta qualificada. A referência gira entre as músicas mais fortes uma vez por dia. As sugestões vêm da rádio do serviço de música e preservam sua ordem, com novidades antes de faixas já ouvidas. Não é um modelo de IA treinado nem uma garantia de gênero exato.

O menu ⋯ permite favoritar ou escolher **Não recomendar esta música**. Ocultar tira a música das sugestões futuras e das favoritas; não interrompe uma fila escolhida manualmente. A configuração **Reexibir músicas ocultadas** remove o filtro. Favoritas e preferências são locais, sem conta; não sincronizam automaticamente com outros aparelhos.

As setas, OK e Voltar compartilham o foco com o cursor. Mover o cursor sobre um botão destaca esse alvo; o teclado de busca não perde foco por um movimento acidental. Setas seguradas têm trabalho limitado sem acumular movimentos. Fechar um menu devolve o foco ao botão ou à próxima faixa disponível.

**Melhor disponível** prefere o codec suportado e a maior taxa disponível dentro dele. **Compatibilidade · AAC** prioriza AAC, com alternativa Opus quando suportada. **Economia de dados** busca 48–96 kbps; se a fonte só oferecer outra taxa, usa a menor disponível. Faixas DRC são evitadas quando existe uma opção suportada sem DRC. Não existe conversão para áudio sem perdas ou aumento artificial da resolução.

**Equilibrar volume entre faixas** vem desligado e usa o metadado de volume da fonte para atenuar faixas mais altas, limitado a 30 dB. Não amplifica faixas silenciosas. O buffer da TV passa a 40 segundos adiante e 20 atrás; a recomposição começa após 0,5 segundo. Esses valores limitam retenção e evitam uma meta de recomposição quase nula; não prometem ausência de interrupções em qualquer rede.

Ao reabrir, **Continuar de onde parou** retoma a faixa e a fila com ação explícita. Até 30 faixas e a posição são amostradas a cada dez segundos; sair ou ocultar o app tenta gravar a posição final. A sessão expira em 30 dias. Armazenamento bloqueado ou cheio não interrompe a música.

## Trabalho reduzido na TV

- Até seis músicas por seção da Home e até doze itens nas demais coleções; cinco seções por etapa e limite de trinta seções.
- Favoritas em lotes de vinte, máximo de duzentas músicas armazenadas.
- Sem paginação automática da Home; **Explorar mais músicas** carrega a próxima etapa.
- Sugestões pessoais e temas consultados sob demanda e armazenados em cache. Desligar descobertas impede novas consultas da Home; passar o cursor em links aquece apenas o código da página.
- Relatório de histórico de conta não suportado e presença periódica desativados no Tizen; histórico local permanece ativo.
- Mantidos fundo estático, capas sem animação, atualizações de progresso limitadas e cache geométrico da navegação introduzidos na 1.3.2.

## Compilar e verificar

Siga [COMPILAR.md](COMPILAR.md). Para executar regressões:

```bash
pnpm --dir web/app exec vitest run
python3 -m unittest discover -s tests -v
```

A prévia visual local pode ser aberta em `/?tv-preview=1#/home` no servidor Vite em modo Tizen. Ela usa músicas e capas fictícias apenas para revisar layout. O import é removido da compilação de produção; não adiciona faixas demonstrativas na TV.

Foram revisados layouts 1920 × 1080 e 1280 × 720, seleção de temas, favoritas, menu e navegação por setas. Uma compilação intermediária 1.4.0 foi assinada, instalada e iniciada na TV. Depois, o usuário pediu que as próximas alterações fossem feitas somente no computador. A compilação final requer validação física posterior de reprodução, cursor Samsung, suspensão/retomada e uso prolongado. Não houve medição comparativa de FPS ou memória; não se declara melhoria percentual.

## Privacidade e distribuição

Preferências: `lqmusic:tv:preferences:v1`. Sessão: `lqmusic:tv:session:v1`. Histórico anterior: `painho:tv:recently-played:v1`. O serviço de música recebe as consultas e os identificadores usados para recomendações e reprodução. O pacote público não contém chaves, certificados, senhas ou histórico do usuário.

Atualize usando o mesmo certificado de autor. Não desinstale para trocar a versão, pois isso pode apagar os dados locais. Certificados particulares ficam fora do repositório e dos ZIPs públicos.
