-- Atualizar status de todos os itens baseado na quantidade disponível
UPDATE inventory_items 
SET status = CASE 
  WHEN quantidade_disponivel > 0 THEN 'disponivel'
  ELSE 'indisponivel'
END;

-- Verificar resultado
SELECT 
  codigo,
  quantidade_disponivel,
  status
FROM inventory_items
ORDER BY codigo;
