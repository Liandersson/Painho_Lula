# Desempenho TV — 1.3.2

Alvo de referência: Samsung UN50CU7700GXZD com Tizen 9.0, conforme a base documentada do projeto. O perfil é aplicado somente ao build `tizen`; não há detecção presumida de hardware por user agent.

## Mudanças verificáveis

- Navegação: uma sequência sem rolagem reutiliza a geometria por até 250 ms. Rolagem, resize, imagens carregadas, conteúdo, classes, estilos e modais invalidam as medidas. Retirar a invalidação incondicional após revelar um item evita varrer todos os controles a cada seta.
- O teste usa 200 botões e dez movimentos, verificando 210 leituras de retângulos: 200 na varredura inicial e dez para revelar o destino. Também verifica que classe e rolagem forçam nova medição. Isso mede trabalho de layout solicitado, não tempo de resposta na TV.
- Barra de progresso: no máximo dez atualizações por segundo enquanto a música toca na TV; nenhuma enquanto o documento está oculto. Seek e retorno à tela repintam imediatamente. Desktop mantém requestAnimationFrame. Os valores ARIA só são escritos quando mudam.
- Fundo do player: canvas 2D de 64 × 40, estático, atualizado com as cores da capa. Evita o shader de resolução de tela e a transição de 1,2 segundo entre capas.
- Capas animadas Apple não iniciam consultas na TV. O brilho desfocado extra do player também não é criado. A capa estática permanece.
- Temporizadores de repetição de imagens são cancelados quando a imagem é substituída ou desmontada.
- As teclas Samsung são registradas uma vez por montagem do shell, em vez de a cada rota.

## Verificação local

Execute os comandos de `COMPILAR.md` e `pnpm --dir web/app exec vitest run`. O workflow `validar-tv.yml` executa instalador, build, regressões completas e empacotamento em PRs e mudanças de main, sem publicar releases.

## Medição física pendente

Não foram medidos FPS, memória, latência ou temperatura na TV nesta revisão. Para comparar 1.3.1 e 1.3.2, use a mesma TV, rede, volume e sequência de telas:

1. Abrir Home e percorrer dez linhas de conteúdo segurando as setas; conferir foco visível, menu, player e retorno ao item anterior.
2. Buscar com a IME Samsung, abrir resultado, voltar e abrir Recents; confirmar posição e ausência de saltos de foco.
3. Reproduzir e trocar faixas com o player aberto e fechado; testar seek pausado, letras, fila e CH+/CH−.
4. Deixar tocar por duas horas, desconectar e reconectar a rede e alternar para outro app da TV e voltar.
5. Quando o Web Inspector estiver disponível, comparar gravações de Performance e memória antes/depois sob a mesma sequência, com atenção a tarefas longas e crescimento contínuo de heap.

O sucesso automatizado não substitui esses testes. IDs do app e chaves de histórico foram preservados; atualize usando o mesmo certificado de autor. Nunca remova o app para uma simples atualização, pois isso pode apagar dados locais.
