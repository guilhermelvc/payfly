-- =====================================================
-- SCRIPT DE DADOS DE DEMONSTRAÇÃO - PAYFLY
-- Data de referência: 10/12/2025 (Quarta-feira)
-- Usuário de teste: 93c9a10c-15dc-4f92-829e-fb6dc028fe11
-- =====================================================
-- Distribuição temporal:
-- - Semanal: 04/12/2025 a 10/12/2025 (5 registros)
-- - Mensal: 10/11/2025 a 10/12/2025 (5 registros)
-- - 6 meses: 10/06/2025 a 09/11/2025 (5 registros)
-- - Futuros: 11/12/2025 em diante (5 registros)
-- =====================================================

-- LIMPEZA DOS DADOS DO USUÁRIO (descomente se necessário)
-- DELETE FROM receitas WHERE usuario_id = '93c9a10c-15dc-4f92-829e-fb6dc028fe11';
-- DELETE FROM despesas WHERE usuario_id = '93c9a10c-15dc-4f92-829e-fb6dc028fe11';
-- DELETE FROM planos WHERE usuario_id = '93c9a10c-15dc-4f92-829e-fb6dc028fe11';
-- DELETE FROM poupanca WHERE usuario_id = '93c9a10c-15dc-4f92-829e-fb6dc028fe11';
-- DELETE FROM investimentos WHERE usuario_id = '93c9a10c-15dc-4f92-829e-fb6dc028fe11';

-- =====================================================
-- RECEITAS (20 registros)
-- =====================================================

-- Semanal (04/12 a 10/12/2025)
INSERT INTO receitas (usuario_id, valor, descricao, categoria, data) VALUES
('93c9a10c-15dc-4f92-829e-fb6dc028fe11', 5500.00, 'Salário mensal', 'Salário', '2025-12-05'),
('93c9a10c-15dc-4f92-829e-fb6dc028fe11', 350.00, 'Freelance design logo', 'Freelance', '2025-12-06'),
('93c9a10c-15dc-4f92-829e-fb6dc028fe11', 120.00, 'Venda de livros usados', 'Vendas', '2025-12-07'),
('93c9a10c-15dc-4f92-829e-fb6dc028fe11', 85.00, 'Cashback cartão de crédito', 'Outros', '2025-12-09'),
('93c9a10c-15dc-4f92-829e-fb6dc028fe11', 200.00, 'Presente de aniversário', 'Presentes', '2025-12-10');

-- Mensal (10/11 a 03/12/2025)
INSERT INTO receitas (usuario_id, valor, descricao, categoria, data) VALUES
('93c9a10c-15dc-4f92-829e-fb6dc028fe11', 5500.00, 'Salário mensal', 'Salário', '2025-11-05'),
('93c9a10c-15dc-4f92-829e-fb6dc028fe11', 800.00, 'Freelance desenvolvimento web', 'Freelance', '2025-11-15'),
('93c9a10c-15dc-4f92-829e-fb6dc028fe11', 450.00, 'Dividendos ações', 'Investimentos', '2025-11-20'),
('93c9a10c-15dc-4f92-829e-fb6dc028fe11', 150.00, 'Reembolso despesas', 'Outros', '2025-11-25'),
('93c9a10c-15dc-4f92-829e-fb6dc028fe11', 300.00, 'Venda móvel usado', 'Vendas', '2025-12-01');

-- 6 meses (10/06 a 09/11/2025)
INSERT INTO receitas (usuario_id, valor, descricao, categoria, data) VALUES
('93c9a10c-15dc-4f92-829e-fb6dc028fe11', 5200.00, 'Salário mensal', 'Salário', '2025-07-05'),
('93c9a10c-15dc-4f92-829e-fb6dc028fe11', 5300.00, 'Salário mensal', 'Salário', '2025-08-05'),
('93c9a10c-15dc-4f92-829e-fb6dc028fe11', 1200.00, 'Bônus trimestral', 'Bônus', '2025-09-15'),
('93c9a10c-15dc-4f92-829e-fb6dc028fe11', 5400.00, 'Salário mensal', 'Salário', '2025-10-05'),
('93c9a10c-15dc-4f92-829e-fb6dc028fe11', 600.00, 'Freelance consultoria', 'Freelance', '2025-10-20');

-- Futuros (11/12/2025 em diante)
INSERT INTO receitas (usuario_id, valor, descricao, categoria, data) VALUES
('93c9a10c-15dc-4f92-829e-fb6dc028fe11', 5500.00, 'Salário mensal (previsto)', 'Salário', '2026-01-05'),
('93c9a10c-15dc-4f92-829e-fb6dc028fe11', 2500.00, 'Décimo terceiro', 'Bônus', '2025-12-20'),
('93c9a10c-15dc-4f92-829e-fb6dc028fe11', 1000.00, 'Freelance app mobile', 'Freelance', '2025-12-28'),
('93c9a10c-15dc-4f92-829e-fb6dc028fe11', 350.00, 'Dividendos previstos', 'Investimentos', '2026-01-15'),
('93c9a10c-15dc-4f92-829e-fb6dc028fe11', 5500.00, 'Salário mensal (previsto)', 'Salário', '2026-02-05');

-- =====================================================
-- DESPESAS (20 registros)
-- =====================================================

-- Semanal (04/12 a 10/12/2025)
INSERT INTO despesas (usuario_id, valor, descricao, categoria, data) VALUES
('93c9a10c-15dc-4f92-829e-fb6dc028fe11', 85.00, 'Supermercado semanal', 'Alimentação', '2025-12-04'),
('93c9a10c-15dc-4f92-829e-fb6dc028fe11', 45.00, 'Combustível', 'Transporte', '2025-12-05'),
('93c9a10c-15dc-4f92-829e-fb6dc028fe11', 120.00, 'Jantar restaurante', 'Lazer', '2025-12-07'),
('93c9a10c-15dc-4f92-829e-fb6dc028fe11', 35.00, 'Farmácia', 'Saúde', '2025-12-08'),
('93c9a10c-15dc-4f92-829e-fb6dc028fe11', 200.00, 'Presente de Natal', 'Compras', '2025-12-10');

-- Mensal (10/11 a 03/12/2025)
INSERT INTO despesas (usuario_id, valor, descricao, categoria, data) VALUES
('93c9a10c-15dc-4f92-829e-fb6dc028fe11', 1500.00, 'Aluguel apartamento', 'Moradia', '2025-11-10'),
('93c9a10c-15dc-4f92-829e-fb6dc028fe11', 280.00, 'Conta de luz', 'Moradia', '2025-11-15'),
('93c9a10c-15dc-4f92-829e-fb6dc028fe11', 150.00, 'Internet e telefone', 'Moradia', '2025-11-18'),
('93c9a10c-15dc-4f92-829e-fb6dc028fe11', 450.00, 'Plano de saúde', 'Saúde', '2025-11-25'),
('93c9a10c-15dc-4f92-829e-fb6dc028fe11', 320.00, 'Supermercado mensal', 'Alimentação', '2025-12-02');

-- 6 meses (10/06 a 09/11/2025)
INSERT INTO despesas (usuario_id, valor, descricao, categoria, data) VALUES
('93c9a10c-15dc-4f92-829e-fb6dc028fe11', 1450.00, 'Aluguel apartamento', 'Moradia', '2025-07-10'),
('93c9a10c-15dc-4f92-829e-fb6dc028fe11', 2800.00, 'IPVA carro', 'Transporte', '2025-08-15'),
('93c9a10c-15dc-4f92-829e-fb6dc028fe11', 890.00, 'Manutenção carro', 'Transporte', '2025-09-20'),
('93c9a10c-15dc-4f92-829e-fb6dc028fe11', 1500.00, 'Aluguel apartamento', 'Moradia', '2025-10-10'),
('93c9a10c-15dc-4f92-829e-fb6dc028fe11', 650.00, 'Black Friday eletrônicos', 'Compras', '2025-11-01');

-- Futuros (11/12/2025 em diante)
INSERT INTO despesas (usuario_id, valor, descricao, categoria, data) VALUES
('93c9a10c-15dc-4f92-829e-fb6dc028fe11', 1500.00, 'Aluguel apartamento', 'Moradia', '2025-12-15'),
('93c9a10c-15dc-4f92-829e-fb6dc028fe11', 800.00, 'Presentes de Natal', 'Compras', '2025-12-22'),
('93c9a10c-15dc-4f92-829e-fb6dc028fe11', 500.00, 'Ceia de Natal', 'Alimentação', '2025-12-24'),
('93c9a10c-15dc-4f92-829e-fb6dc028fe11', 350.00, 'Festa de Réveillon', 'Lazer', '2025-12-31'),
('93c9a10c-15dc-4f92-829e-fb6dc028fe11', 1500.00, 'Aluguel janeiro', 'Moradia', '2026-01-10');

-- =====================================================
-- PLANOS (20 registros)
-- Campos: usuario_id, descricao, valor, data, categoria, valor_poupado
-- =====================================================

-- Semanal (04/12 a 10/12/2025)
INSERT INTO planos (usuario_id, descricao, valor, data, categoria, valor_poupado) VALUES
('93c9a10c-15dc-4f92-829e-fb6dc028fe11', 'Presente namorada', 500.00, '2025-12-10', 'Compras', 480.00),
('93c9a10c-15dc-4f92-829e-fb6dc028fe11', 'Decoração Natal', 300.00, '2025-12-08', 'Compras', 250.00),
('93c9a10c-15dc-4f92-829e-fb6dc028fe11', 'Reserva restaurante', 200.00, '2025-12-07', 'Lazer', 200.00),
('93c9a10c-15dc-4f92-829e-fb6dc028fe11', 'Compras mercado', 400.00, '2025-12-06', 'Alimentação', 320.00),
('93c9a10c-15dc-4f92-829e-fb6dc028fe11', 'Pagamento conta luz', 280.00, '2025-12-05', 'Moradia', 280.00);

-- Mensal (10/11 a 03/12/2025)
INSERT INTO planos (usuario_id, descricao, valor, data, categoria, valor_poupado) VALUES
('93c9a10c-15dc-4f92-829e-fb6dc028fe11', 'Black Friday', 2000.00, '2025-11-29', 'Compras', 1850.00),
('93c9a10c-15dc-4f92-829e-fb6dc028fe11', 'Seguro carro anual', 1800.00, '2025-11-20', 'Transporte', 1500.00),
('93c9a10c-15dc-4f92-829e-fb6dc028fe11', 'Curso online', 450.00, '2025-11-15', 'Educação', 450.00),
('93c9a10c-15dc-4f92-829e-fb6dc028fe11', 'Manutenção preventiva', 600.00, '2025-12-01', 'Transporte', 400.00),
('93c9a10c-15dc-4f92-829e-fb6dc028fe11', 'Fundo emergência mensal', 1000.00, '2025-11-30', 'Reserva', 800.00);

-- 6 meses (10/06 a 09/11/2025)
INSERT INTO planos (usuario_id, descricao, valor, data, categoria, valor_poupado, status) VALUES
('93c9a10c-15dc-4f92-829e-fb6dc028fe11', 'Viagem férias', 5000.00, '2025-07-15', 'Lazer', 5000.00, 'concluido'),
('93c9a10c-15dc-4f92-829e-fb6dc028fe11', 'Novo notebook', 4500.00, '2025-08-20', 'Tecnologia', 4500.00, 'concluido'),
('93c9a10c-15dc-4f92-829e-fb6dc028fe11', 'IPVA 2025', 2800.00, '2025-08-15', 'Transporte', 2800.00, 'concluido'),
('93c9a10c-15dc-4f92-829e-fb6dc028fe11', 'Aniversário mãe', 800.00, '2025-09-25', 'Presentes', 800.00, 'concluido'),
('93c9a10c-15dc-4f92-829e-fb6dc028fe11', 'Reforma banheiro', 3500.00, '2025-10-30', 'Moradia', 3200.00, 'ativo');

-- Futuros (11/12/2025 em diante)
INSERT INTO planos (usuario_id, descricao, valor, data, categoria, valor_poupado) VALUES
('93c9a10c-15dc-4f92-829e-fb6dc028fe11', 'Viagem Ano Novo', 3000.00, '2025-12-28', 'Lazer', 2200.00),
('93c9a10c-15dc-4f92-829e-fb6dc028fe11', 'Ceia de Natal', 800.00, '2025-12-24', 'Alimentação', 500.00),
('93c9a10c-15dc-4f92-829e-fb6dc028fe11', 'Matrícula faculdade', 2500.00, '2026-01-15', 'Educação', 1800.00),
('93c9a10c-15dc-4f92-829e-fb6dc028fe11', 'Carro novo', 50000.00, '2026-06-30', 'Transporte', 15000.00),
('93c9a10c-15dc-4f92-829e-fb6dc028fe11', 'Apartamento próprio', 80000.00, '2027-12-31', 'Moradia', 25000.00);

-- =====================================================
-- POUPANÇA (20 registros)
-- =====================================================

-- Semanal (04/12 a 10/12/2025)
INSERT INTO poupanca (usuario_id, valor, descricao, data) VALUES
('93c9a10c-15dc-4f92-829e-fb6dc028fe11', 150.00, 'Economia semanal', '2025-12-04'),
('93c9a10c-15dc-4f92-829e-fb6dc028fe11', 80.00, 'Troco do supermercado', '2025-12-05'),
('93c9a10c-15dc-4f92-829e-fb6dc028fe11', 200.00, 'Sobra do freelance', '2025-12-07'),
('93c9a10c-15dc-4f92-829e-fb6dc028fe11', 50.00, 'Economia combustível', '2025-12-09'),
('93c9a10c-15dc-4f92-829e-fb6dc028fe11', 120.00, 'Depósito extra', '2025-12-10');

-- Mensal (10/11 a 03/12/2025)
INSERT INTO poupanca (usuario_id, valor, descricao, data) VALUES
('93c9a10c-15dc-4f92-829e-fb6dc028fe11', 500.00, 'Poupança mensal fixa', '2025-11-10'),
('93c9a10c-15dc-4f92-829e-fb6dc028fe11', 300.00, 'Sobra do mês', '2025-11-15'),
('93c9a10c-15dc-4f92-829e-fb6dc028fe11', 250.00, 'Economia nas compras', '2025-11-22'),
('93c9a10c-15dc-4f92-829e-fb6dc028fe11', 180.00, 'Reembolso para poupança', '2025-11-28'),
('93c9a10c-15dc-4f92-829e-fb6dc028fe11', 400.00, 'Depósito início dezembro', '2025-12-02');

-- 6 meses (10/06 a 09/11/2025)
INSERT INTO poupanca (usuario_id, valor, descricao, data) VALUES
('93c9a10c-15dc-4f92-829e-fb6dc028fe11', 450.00, 'Poupança julho', '2025-07-10'),
('93c9a10c-15dc-4f92-829e-fb6dc028fe11', 500.00, 'Poupança agosto', '2025-08-10'),
('93c9a10c-15dc-4f92-829e-fb6dc028fe11', 600.00, 'Poupança setembro + bônus', '2025-09-10'),
('93c9a10c-15dc-4f92-829e-fb6dc028fe11', 500.00, 'Poupança outubro', '2025-10-10'),
('93c9a10c-15dc-4f92-829e-fb6dc028fe11', 350.00, 'Poupança novembro parcial', '2025-11-05');

-- Futuros (11/12/2025 em diante)
INSERT INTO poupanca (usuario_id, valor, descricao, data) VALUES
('93c9a10c-15dc-4f92-829e-fb6dc028fe11', 500.00, 'Poupança dezembro', '2025-12-15'),
('93c9a10c-15dc-4f92-829e-fb6dc028fe11', 1000.00, 'Décimo terceiro para poupança', '2025-12-22'),
('93c9a10c-15dc-4f92-829e-fb6dc028fe11', 300.00, 'Reserva fim de ano', '2025-12-28'),
('93c9a10c-15dc-4f92-829e-fb6dc028fe11', 500.00, 'Poupança janeiro', '2026-01-10'),
('93c9a10c-15dc-4f92-829e-fb6dc028fe11', 500.00, 'Poupança fevereiro', '2026-02-10');

-- =====================================================
-- INVESTIMENTOS (20 registros)
-- Campos: usuario_id, descricao, valor_investido, data_aplicacao, tipo, rentabilidade
-- =====================================================

-- Semanal (04/12 a 10/12/2025)
INSERT INTO investimentos (usuario_id, descricao, valor_investido, data_aplicacao, tipo, rentabilidade) VALUES
('93c9a10c-15dc-4f92-829e-fb6dc028fe11', 'Tesouro Selic 2028', 500.00, '2025-12-04', 'Renda Fixa', 12.75),
('93c9a10c-15dc-4f92-829e-fb6dc028fe11', 'CDB Banco Inter', 300.00, '2025-12-05', 'Renda Fixa', 13.50),
('93c9a10c-15dc-4f92-829e-fb6dc028fe11', 'Ações PETR4', 450.00, '2025-12-06', 'Renda Variável', -2.30),
('93c9a10c-15dc-4f92-829e-fb6dc028fe11', 'FII HGLG11', 380.00, '2025-12-08', 'Fundos Imobiliários', 8.50),
('93c9a10c-15dc-4f92-829e-fb6dc028fe11', 'LCI Caixa', 600.00, '2025-12-10', 'Renda Fixa', 11.20);

-- Mensal (10/11 a 03/12/2025)
INSERT INTO investimentos (usuario_id, descricao, valor_investido, data_aplicacao, tipo, rentabilidade) VALUES
('93c9a10c-15dc-4f92-829e-fb6dc028fe11', 'Tesouro IPCA+ 2035', 1000.00, '2025-11-10', 'Renda Fixa', 6.50),
('93c9a10c-15dc-4f92-829e-fb6dc028fe11', 'Ações VALE3', 800.00, '2025-11-15', 'Renda Variável', 15.20),
('93c9a10c-15dc-4f92-829e-fb6dc028fe11', 'ETF BOVA11', 650.00, '2025-11-20', 'Renda Variável', 5.80),
('93c9a10c-15dc-4f92-829e-fb6dc028fe11', 'FII XPML11', 500.00, '2025-11-25', 'Fundos Imobiliários', 9.30),
('93c9a10c-15dc-4f92-829e-fb6dc028fe11', 'CDB Nubank', 400.00, '2025-12-01', 'Renda Fixa', 14.00);

-- 6 meses (10/06 a 09/11/2025)
INSERT INTO investimentos (usuario_id, descricao, valor_investido, data_aplicacao, tipo, rentabilidade) VALUES
('93c9a10c-15dc-4f92-829e-fb6dc028fe11', 'Tesouro Selic 2027', 2000.00, '2025-07-01', 'Renda Fixa', 13.25),
('93c9a10c-15dc-4f92-829e-fb6dc028fe11', 'Ações ITUB4', 1500.00, '2025-07-15', 'Renda Variável', 22.40),
('93c9a10c-15dc-4f92-829e-fb6dc028fe11', 'FII VISC11', 1200.00, '2025-08-20', 'Fundos Imobiliários', 10.80),
('93c9a10c-15dc-4f92-829e-fb6dc028fe11', 'LCA Santander', 1000.00, '2025-09-10', 'Renda Fixa', 12.00),
('93c9a10c-15dc-4f92-829e-fb6dc028fe11', 'Ações BBDC4', 900.00, '2025-10-05', 'Renda Variável', -5.60);

-- Futuros (11/12/2025 em diante)
INSERT INTO investimentos (usuario_id, descricao, valor_investido, data_aplicacao, tipo, rentabilidade) VALUES
('93c9a10c-15dc-4f92-829e-fb6dc028fe11', 'Tesouro IPCA+ 2045', 2000.00, '2025-12-15', 'Renda Fixa', 6.80),
('93c9a10c-15dc-4f92-829e-fb6dc028fe11', 'Ações WEGE3', 1500.00, '2025-12-20', 'Renda Variável', 0.00),
('93c9a10c-15dc-4f92-829e-fb6dc028fe11', 'ETF IVVB11', 1000.00, '2025-12-28', 'Renda Variável', 0.00),
('93c9a10c-15dc-4f92-829e-fb6dc028fe11', 'FII KNRI11', 800.00, '2026-01-05', 'Fundos Imobiliários', 0.00),
('93c9a10c-15dc-4f92-829e-fb6dc028fe11', 'CDB XP', 1500.00, '2026-01-15', 'Renda Fixa', 13.80);

-- =====================================================
-- VERIFICAÇÃO FINAL
-- =====================================================

-- Contagem de registros por tabela:
-- SELECT 'receitas' as tabela, COUNT(*) as total FROM receitas WHERE usuario_id = '93c9a10c-15dc-4f92-829e-fb6dc028fe11'
-- UNION ALL
-- SELECT 'despesas', COUNT(*) FROM despesas WHERE usuario_id = '93c9a10c-15dc-4f92-829e-fb6dc028fe11'
-- UNION ALL
-- SELECT 'planos', COUNT(*) FROM planos WHERE usuario_id = '93c9a10c-15dc-4f92-829e-fb6dc028fe11'
-- UNION ALL
-- SELECT 'poupanca', COUNT(*) FROM poupanca WHERE usuario_id = '93c9a10c-15dc-4f92-829e-fb6dc028fe11'
-- UNION ALL
-- SELECT 'investimentos', COUNT(*) FROM investimentos WHERE usuario_id = '93c9a10c-15dc-4f92-829e-fb6dc028fe11';

-- Resumo financeiro:
-- SELECT 
--   (SELECT COALESCE(SUM(valor), 0) FROM receitas WHERE usuario_id = '93c9a10c-15dc-4f92-829e-fb6dc028fe11') as total_receitas,
--   (SELECT COALESCE(SUM(valor), 0) FROM despesas WHERE usuario_id = '93c9a10c-15dc-4f92-829e-fb6dc028fe11') as total_despesas,
--   (SELECT COALESCE(SUM(valor), 0) FROM poupanca WHERE usuario_id = '93c9a10c-15dc-4f92-829e-fb6dc028fe11') as total_poupanca,
--   (SELECT COALESCE(SUM(valor_investido), 0) FROM investimentos WHERE usuario_id = '93c9a10c-15dc-4f92-829e-fb6dc028fe11') as total_investimentos;
