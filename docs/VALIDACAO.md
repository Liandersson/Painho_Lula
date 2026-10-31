# Validação da versão TV 1.3.1

- 82 testes de regressão do app passaram na preparação da versão, cobrindo histórico, seleção isolada, recomendações, navegação espacial, controles, pesquisa e restauração de posição.
- TypeScript e Vite compilaram o modo Tizen.
- Instalação e início foram confirmados via SDK na UN50CU7700GXZD/Tizen 9.0 durante o desenvolvimento.
- Pesquisa, capas, reprodução por dois minutos e comandos básicos foram confirmados pelo proprietário na base anterior do port.
- As mudanças mais recentes de teclado Samsung, busca, Recents e foco ainda precisam de confirmação física. O navegador local só valida estados de foco/layout; ele não simula a IME Samsung.
- Nenhum benchmark de consumo, temperatura, memória ou latência é declarado.
- O assistente público é testado com ferramentas simuladas e dry-run; assinatura numa nova TV depende do certificado do usuário e não pode ser comprovada sem essa TV.

Limitações de contas/integrações e recomendações estão no README. Não há promessa de 100% de paridade com Android nem de compatibilidade com todos os Tizen 9.0+.
