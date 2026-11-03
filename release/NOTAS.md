LqMusic 1.3.2 — desempenho na Samsung Tizen 9.0+

- Navegação reaproveita as medidas da tela quando o foco muda sem rolagem; mudanças de conteúdo, classes, modais e rolagem continuam invalidando o cache.
- Registro das teclas do controle permanece ativo entre trocas de página.
- Fundo do player usa um canvas estático de 64 × 40, em vez de WebGL em resolução de tela. Cores da capa preservadas, sem transição contínua.
- Capas animadas Apple e brilho desfocado do player desativados na TV para reduzir decodificação, rede e composição.
- Barra de progresso atualiza até dez vezes por segundo na TV, preservando ajuste imediato pelo controle; suspende o trabalho quando o app fica oculto.
- Capas limpam tentativas pendentes ao sair da tela e reiniciam seu estado quando a imagem muda.

Baixe LqMusic-TV-1.3.2-Instalacao.zip e siga LEIA-ME.md. O pacote não contém assinatura ou certificados. Para atualizar mantendo a instalação e o histórico, use o mesmo certificado de autor. Fonte correspondente: LqMusic-TV-1.3.2-Source.zip; confira SHA256SUMS.txt.

As reduções de trabalho são verificadas por testes automatizados. Fluidez, latência e memória na UN50CU7700GXZD precisam de medição física; não há promessa de FPS ou compatibilidade universal. Não foram alterados IDs do app nem chaves de histórico. Reprodução e letras continuam dependendo de serviços externos.

Base original BitChord, de kushagrasinghx e colaboradores. GPL-3.0 e licenças de terceiros preservadas em LICENSE e NOTICE.md.
