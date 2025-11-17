# Resumo Técnico - Sistema de Recorrência para Poupança

## Arquivo: models/poupanca.js

### 1. Função `savePoupanca()` - Linhas 271-360
**Mudança Principal**: Adição de suporte a recorrência com criação de múltiplas registros

```javascript
// NOVO: Verifica recorrência
const isRecorrente = document.getElementById("is_recorrente")?.checked || false;
const recorrenciaMeses = isRecorrente
  ? parseInt(document.getElementById("recorrencia_meses")?.value || 1)
  : 1;

// NOVO: Se > 1 mês, cria loop
if (isRecorrente && recorrenciaMeses > 1) {
  for (let i = 0; i < recorrenciaMeses; i++) {
    const novaData = new Date(dataInicial);
    novaData.setMonth(novaData.getMonth() + i);
    const dataFormatada = novaData.toISOString().split("T")[0];
    
    poupancasParaCriar.push({
      // ... dados
      is_recorrente: i === 0 ? true : false,
      recorrencia_meses: i === 0 ? recorrenciaMeses : 1,
    });
  }
  // Insert múltiplas
}
```

### 2. Função `applyStoredPoupancaFilter()` - Linhas 58-61
**Mudança**: Mapeamento inclui campos de recorrência

```javascript
// NOVO: Campos adicionados ao map
is_recorrente: item.is_recorrente || false,
recorrencia_meses: item.recorrencia_meses || 1,
```

### 3. Função `loadPoupancaFromSupabase()` - Linhas 114-120
**Mudança**: Carregamento inclui campos de recorrência

```javascript
// NOVO: Campos adicionados ao map
is_recorrente: item.is_recorrente || false,
recorrencia_meses: item.recorrencia_meses || 1,
```

### 4. Função `loadDemoDataFallback()` - Linhas 134-139
**Mudança**: Dados demo incluem campos de recorrência

```javascript
// NOVO: Adicionado aos dados demo
is_recorrente: false,
recorrencia_meses: 1,
```

### 5. Função `addPoupancaRowToTable()` - Linhas 569-595
**Mudança**: Renderização da coluna recorrência

```javascript
// NOVO: Construção do badge
const recorrenciaCell = item.is_recorrente
  ? `<span class="recorrencia-badge">✓ ${item.recorrencia_meses}x</span>`
  : "-";

// NOVO: HTML incluindo coluna recorrência
row.innerHTML = `
  ...
  <td>${recorrenciaCell}</td>
  ...
`;
```

### 6. Função `updateTable()` - Linhas 617-634
**Mudança**: Renderização inclui badge de recorrência

```javascript
// NOVO: Badge de recorrência
const recorrenciaCell = transaction.is_recorrente
  ? `<span class="recorrencia-badge">✓ ${transaction.recorrencia_meses}x</span>`
  : "-";

// NOVO: HTML incluindo coluna
row.innerHTML = `...${recorrenciaCell}...`;
```

### 7. Função `editTransaction()` - Linhas 816-835
**Mudança**: Preenchimento dos campos de recorrência

```javascript
// NOVO: Popula campos de recorrência
const isRecorrente = transaction.is_recorrente || false;
const recorrenciaMeses = transaction.recorrencia_meses || 1;

document.getElementById("edit-is-recorrente").checked = isRecorrente;
document.getElementById("edit-recorrencia-meses").value = recorrenciaMeses;

// NOVO: Mostra/esconde campo de meses
if (isRecorrente) {
  document.getElementById("edit-recorrencia-meses-group").style.display = "block";
} else {
  document.getElementById("edit-recorrencia-meses-group").style.display = "none";
}
```

### 8. Função `submitEditForm()` - Linhas 837-893
**Mudança**: Atualização com suporte a recorrência

```javascript
// NOVO: Obtém valores de recorrência
const isRecorrente = document.getElementById("edit-is-recorrente").checked;
const recorrenciaMeses = isRecorrente
  ? parseInt(document.getElementById("edit-recorrencia-meses").value || 1)
  : 1;

// NOVO: Adiciona ao updateData
const updateData = {
  // ... dados existentes
  is_recorrente: isRecorrente,
  recorrencia_meses: recorrenciaMeses,
};
```

### 9. Função `closeEditModal()` - Linhas 895-898
**Mudança**: Reseta visibilidade do campo de recorrência

```javascript
// NOVO: Reseta campo de meses
document.getElementById("edit-recorrencia-meses-group").style.display = "none";
```

### 10. NOVAS Funções - Linhas 900-930
**Adição Completa**: Funções toggle para recorrência

```javascript
// NOVA FUNÇÃO: toggleRecorrenciaFields()
function toggleRecorrenciaFields() {
  const isRecorrente = document.getElementById("is_recorrente").checked;
  const mesesGroup = document.getElementById("recorrencia_meses_group");
  
  if (isRecorrente) {
    mesesGroup.style.display = "block";
    const mesesInput = document.getElementById("recorrencia_meses");
    if (!mesesInput.value || mesesInput.value === "1") {
      mesesInput.value = "1";
    }
  } else {
    mesesGroup.style.display = "none";
    document.getElementById("recorrencia_meses").value = "1";
  }
}

// NOVA FUNÇÃO: toggleEditRecorrenciaFields()
function toggleEditRecorrenciaFields() {
  const isRecorrente = document.getElementById("edit-is-recorrente").checked;
  const mesesGroup = document.getElementById("edit-recorrencia-meses-group");
  
  if (isRecorrente) {
    mesesGroup.style.display = "block";
    const mesesInput = document.getElementById("edit-recorrencia-meses");
    if (!mesesInput.value || mesesInput.value === "1") {
      mesesInput.value = "1";
    }
  } else {
    mesesGroup.style.display = "none";
    document.getElementById("edit-recorrencia-meses").value = "1";
  }
}
```

---

## Arquivo: views/Poupanca.html

### 1. Tabela HTML - Coluna Recorrente
**Localização**: Linha ~196

```html
<!-- NOVO: Coluna adicionada -->
<th>Recorrente</th>
```

### 2. Modal Adicionar - Seção Recorrência
**Localização**: Linhas ~323-336

```html
<!-- NOVA: Grupo recorrência -->
<div class="standardized-input-group recorrencia-group">
  <label for="is_recorrente" class="recorrencia-label">
    <span class="recorrencia-text">Poupança Recorrente?</span>
    <div class="switch-toggle">
      <input type="checkbox" id="is_recorrente" name="is_recorrente" 
             onchange="toggleRecorrenciaFields()">
      <span class="slider"></span>
    </div>
  </label>
</div>

<!-- NOVA: Campo meses (oculto por padrão) -->
<div class="standardized-input-group" id="recorrencia_meses_group" 
     style="display: none;">
  <label for="recorrencia_meses">Duração (meses)</label>
  <input type="number" id="recorrencia_meses" name="recorrencia_meses" 
         placeholder="Ex: 6, 12..." min="1" max="120" value="1">
  <div class="standardized-help-text">
    A poupança será replicada a cada mês até o prazo especificado, 
    no mesmo dia da data informada.
  </div>
</div>
```

### 3. Modal Editar - Seção Recorrência
**Localização**: Linhas ~452-465

```html
<!-- NOVA: Grupo recorrência (edição) -->
<div class="standardized-input-group recorrencia-group">
  <label for="edit-is-recorrente" class="recorrencia-label">
    <span class="recorrencia-text">Poupança Recorrente?</span>
    <div class="switch-toggle">
      <input type="checkbox" id="edit-is-recorrente" name="is_recorrente" 
             onchange="toggleEditRecorrenciaFields()">
      <span class="slider"></span>
    </div>
  </label>
</div>

<!-- NOVA: Campo meses (edição) -->
<div class="standardized-input-group" id="edit-recorrencia-meses-group" 
     style="display: none;">
  <label for="edit-recorrencia-meses">Duração (meses)</label>
  <input type="number" id="edit-recorrencia-meses" name="recorrencia_meses" 
         placeholder="Ex: 6, 12..." min="1" max="120" value="1">
  <div class="standardized-help-text">
    A poupança será replicada a cada mês até o prazo especificado.
  </div>
</div>
```

### 4. Script - Funções Toggle
**Localização**: Linhas ~477-520

```html
<script>
  // NOVA: Função toggle adicionar
  function toggleRecorrenciaFields() {
    const isRecorrente = document.getElementById('is_recorrente').checked;
    const mesesGroup = document.getElementById('recorrencia_meses_group');
    
    if (isRecorrente) {
      mesesGroup.style.display = 'block';
      const mesesInput = document.getElementById('recorrencia_meses');
      if (!mesesInput.value || mesesInput.value === '1') {
        mesesInput.value = '1';
      }
    } else {
      mesesGroup.style.display = 'none';
      document.getElementById('recorrencia_meses').value = '1';
    }
  }

  // NOVA: Função toggle editar
  function toggleEditRecorrenciaFields() {
    const isRecorrente = document.getElementById('edit-is-recorrente').checked;
    const mesesGroup = document.getElementById('edit-recorrencia-meses-group');
    
    if (isRecorrente) {
      mesesGroup.style.display = 'block';
      const mesesInput = document.getElementById('edit-recorrencia-meses');
      if (!mesesInput.value || mesesInput.value === '1') {
        mesesInput.value = '1';
      }
    } else {
      mesesGroup.style.display = 'none';
      document.getElementById('edit-recorrencia-meses').value = '1';
    }
  }

  // NOVA: Exponibilidade global
  window.toggleRecorrenciaFields = toggleRecorrenciaFields;
  window.toggleEditRecorrenciaFields = toggleEditRecorrenciaFields;
</script>
```

---

## Resumo de Mudanças

### Total de Modificações:
- **models/poupanca.js**: 10 funções/secções modificadas
- **views/Poupanca.html**: 4 seções adicionadas

### Linhas de Código Adicionadas:
- JavaScript (poupanca.js): ~150 linhas
- HTML (Poupanca.html): ~60 linhas

### Novas Funcionalidades:
1. ✅ Campo checkbox `is_recorrente`
2. ✅ Campo numérico `recorrencia_meses`
3. ✅ Toggle dinâmico de visibilidade
4. ✅ Criação de múltiplas poupanças
5. ✅ Coluna "Recorrente" na tabela
6. ✅ Badge "✓ Nx" para recorrentes
7. ✅ Suporte em edição

### Campos de Banco Necessários:
```sql
ALTER TABLE poupanca ADD COLUMN is_recorrente BOOLEAN DEFAULT false;
ALTER TABLE poupanca ADD COLUMN recorrencia_meses INTEGER DEFAULT 1;
```

---

*Documentação Técnica - 17 de Novembro de 2025*
