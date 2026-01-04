# Regras de Escopo (para evitar mexer em outras salas)

Este projeto foi estruturado para evoluir **por sala**, sem efeitos colaterais.

## Modelo obrigatório de pedido

Sempre use este formato quando for pedir alterações (para qualquer agente/IA):

```txt
ESCOPO BLOQUEADO

SOMENTE EDITAR ESTES ARQUIVOS:
- sections/SymbolRoom.tsx
- sections/SymbolRoom.module.css

PROIBIDO EDITAR:
- sections/DreamInterpretRoom.tsx
- sections/DreamInterpretRoom.module.css
- qualquer outro arquivo

Objetivo único:
<descreva UMA mudança>
```

## Travar uma sala (lock real)

Quando uma sala estiver “perfeita”, trave:

```bash
npm run lock -- sections/DreamInterpretRoom.tsx sections/DreamInterpretRoom.module.css
```

Depois disso, qualquer mudança nesses arquivos **quebra o build**.
