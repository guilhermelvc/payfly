# 🗄️ Migração de Banco de Dados - Poupança com Recorrência

## ⚠️ Antes de Começar

Certifique-se de fazer backup de seus dados antes de executar qualquer alteração no banco de dados!

---

## 📋 Verificar Colunas Existentes

Execute a query abaixo no Supabase para verificar se as colunas já existem:

```sql
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'poupanca'
ORDER BY ordinal_position;
```

**Você deve ver:**
- ✅ `is_recorrente` (BOOLEAN)
- ✅ `recorrencia_meses` (INTEGER)

Se ambas aparecerem, **nenhuma alteração é necessária**.

---

## 🔧 Adicionar Colunas (Se Não Existirem)

Execute as queries abaixo **uma por uma** no Supabase SQL Editor:

### Query 1: Adicionar `is_recorrente`
```sql
ALTER TABLE poupanca
ADD COLUMN is_recorrente BOOLEAN NOT NULL DEFAULT false;

-- Verificar
SELECT COUNT(*) FROM poupanca WHERE is_recorrente = true;
```

**Resultado esperado:** `0` (nenhum registro recorrente ainda)

### Query 2: Adicionar `recorrencia_meses`
```sql
ALTER TABLE poupanca
ADD COLUMN recorrencia_meses INTEGER NOT NULL DEFAULT 1;

-- Verificar
SELECT MIN(recorrencia_meses), MAX(recorrencia_meses) FROM poupanca;
```

**Resultado esperado:** `1, 1` (todos com 1 mês)

---

## ✅ Validar Migração

Execute esta query para confirmar tudo está correto:

```sql
-- Verificar estrutura da tabela
SELECT 
  column_name,
  data_type,
  column_default,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'poupanca'
  AND column_name IN ('is_recorrente', 'recorrencia_meses')
ORDER BY column_name;
```

**Saída esperada:**

| column_name | data_type | column_default | is_nullable |
|---|---|---|---|
| is_recorrente | boolean | false | NO |
| recorrencia_meses | integer | 1 | NO |

---

## 🧪 Teste a Funcionalidade

Depois que as colunas forem adicionadas:

### 1. Teste Local
1. Abra `Poupanca.html` no navegador
2. Clique "+ Adicionar Poupança"
3. Preencha os campos
4. **Marque "Poupança Recorrente?"**
5. Digite "3" no campo "Duração (meses)"
6. Clique "💾 Salvar"
7. ✅ Verifique se 3 linhas foram criadas na tabela com datas incrementadas

### 2. Teste no Banco
```sql
-- Verificar se as poupanças recorrentes foram criadas
SELECT 
  id,
  descricao,
  data,
  is_recorrente,
  recorrencia_meses
FROM poupanca
WHERE is_recorrente = true
ORDER BY data ASC;
```

**Você deve ver:**
- A primeira poupança com `is_recorrente = true` e `recorrencia_meses = 3`
- As outras 2 com `is_recorrente = false` e `recorrencia_meses = 1`

### 3. Teste de Edição
1. Clique editar em uma poupança recorrente
2. Modifique o valor ou tipo
3. Altere "Duração (meses)" para outro número
4. Clique "💾 Salvar"
5. ✅ Verifique se a alteração foi aplicada

---

## 🔍 Troubleshooting

### ❌ Erro: "Column already exists"
```
ERROR: column "is_recorrente" of relation "poupanca" already exists
```

**Solução**: As colunas já existem. Apenas use o sistema normalmente.

### ❌ Erro: "Invalid default value"
```
ERROR: invalid input syntax for type boolean
```

**Solução**: Verifique se está usando `false` (lowercase) no SQL.

### ❌ Poupanças não aparecem na tabela
1. Abra DevTools (F12)
2. Vá para Console
3. Procure por erros vermelhos
4. Se vir "Cannot read property 'is_recorrente'", as colunas não foram adicionadas

---

## 📊 Queries Úteis

### Ver todas as poupanças recorrentes
```sql
SELECT 
  id,
  usuario_id,
  descricao,
  valor,
  data,
  tipo,
  is_recorrente,
  recorrencia_meses,
  criado_em
FROM poupanca
WHERE is_recorrente = true
ORDER BY data DESC;
```

### Contar poupanças por usuário
```sql
SELECT 
  usuario_id,
  COUNT(*) as total,
  COUNT(CASE WHEN is_recorrente THEN 1 END) as recorrentes,
  COUNT(CASE WHEN NOT is_recorrente THEN 1 END) as unicas
FROM poupanca
GROUP BY usuario_id;
```

### Encontrar poupanças com recorrência > 12 meses
```sql
SELECT 
  descricao,
  recorrencia_meses,
  data
FROM poupanca
WHERE is_recorrente = true
  AND recorrencia_meses > 12
ORDER BY recorrencia_meses DESC;
```

### Deletar todas as colunas de recorrência (CUIDADO!)
```sql
-- ⚠️ APENAS SE QUISER DESFAZER TUDO
ALTER TABLE poupanca DROP COLUMN is_recorrente;
ALTER TABLE poupanca DROP COLUMN recorrencia_meses;
```

---

## 📝 Checklist de Implementação

- [ ] Backup de dados realizado
- [ ] Colunas `is_recorrente` e `recorrencia_meses` criadas
- [ ] Verificação de estrutura executada
- [ ] Teste de adição de poupança recorrente
- [ ] Teste de edição de poupança recorrente
- [ ] Verificação de dados no banco
- [ ] Teste de badge "✓ Nx" na tabela
- [ ] Teste de filtros ainda funcionando
- [ ] Teste em navegador diferente (Chrome, Firefox, Edge)
- [ ] ✅ Implementação Concluída!

---

## 🚀 Próximos Passos

1. **Testar completamente** em ambiente local
2. **Fazer backup** do banco de produção
3. **Executar queries** de migração
4. **Fazer deploy** do código atualizado
5. **Monitorar logs** por erros
6. **Informar usuários** sobre nova funcionalidade

---

## 📞 Suporte

Se encontrar problemas:

1. Verifique se as colunas foram criadas: 
   ```sql
   SELECT COUNT(*) FROM information_schema.columns 
   WHERE table_name = 'poupanca' AND column_name IN ('is_recorrente', 'recorrencia_meses');
   ```
   Deve retornar `2`

2. Verifique logs do Supabase em: **Project Settings → Logs → Postgres**

3. Limpe cache do navegador: **Ctrl+Shift+Del** ou **⌘+Shift+Del**

---

*Guia de Migração - PayFly - 17 de Novembro de 2025*
