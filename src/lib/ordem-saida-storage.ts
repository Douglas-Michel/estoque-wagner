import { supabase } from '@/integrations/supabase/client';
import { OrdemSaida, OrdemSaidaItem, OrdemStatus } from '@/types/ordem-saida';

export class OrdemSaidaStorage {
  static async gerarNumeroOrdem(): Promise<string> {
    const { data, error } = await supabase.rpc('gerar_numero_ordem');
    
    if (error) {
      console.error('Error generating order number:', error);
      throw error;
    }
    
    return data;
  }

  static async criarOrdem(
    itens: OrdemSaidaItem[],
    observacoes?: string
  ): Promise<OrdemSaida> {
    // Get current user
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      throw new Error('User not authenticated');
    }

    // Get user profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('full_name')
      .eq('id', user.id)
      .single();

    // Generate order number
    const numeroOrdem = await this.gerarNumeroOrdem();

    // Reserve items in inventory
    for (const item of itens) {
      const { data: inventoryItem, error: fetchError } = await supabase
        .from('inventory_items')
        .select('*')
        .eq('id', item.item_id)
        .single();

      if (fetchError || !inventoryItem) {
        console.error('Error fetching inventory item:', fetchError);
        throw new Error(`Item ${item.codigo} não encontrado no estoque`);
      }

      if (inventoryItem.quantidade_disponivel < item.quantidade) {
        throw new Error(`Quantidade insuficiente disponível para o item ${item.codigo}`);
      }

      // Update inventory: decrease disponivel, increase reservado
      const { error: updateError } = await supabase
        .from('inventory_items')
        .update({
          quantidade_disponivel: inventoryItem.quantidade_disponivel - item.quantidade,
          quantidade_reservada: inventoryItem.quantidade_reservada + item.quantidade
        })
        .eq('id', item.item_id);

      if (updateError) {
        console.error('Error updating inventory:', updateError);
        throw new Error(`Erro ao reservar item ${item.codigo}`);
      }

      // Log movement as reservation
      await supabase
        .from('stock_movements')
        .insert({
          item_id: item.item_id,
          tipo: 'saida',
          quantidade: item.quantidade,
          position_column: item.position_column,
          position_floor: item.position_floor,
          observacoes: `Ordem de Saída ${numeroOrdem} - Em Separação`,
          user_id: user.id,
          user_name: profile?.full_name || user.email?.split('@')[0] || 'Usuário',
          user_email: user.email
        });
    }

    // Create order
    const { data: ordem, error: ordemError } = await supabase
      .from('ordens_saida')
      .insert({
        numero_ordem: numeroOrdem,
        usuario_id: user.id,
        usuario_nome: profile?.full_name || user.email?.split('@')[0] || 'Usuário',
        usuario_email: user.email,
        status: 'em_separacao' as OrdemStatus,
        observacoes
      })
      .select()
      .single();

    if (ordemError) {
      console.error('Error creating order:', ordemError);
      throw ordemError;
    }

    // Insert order items
    const itensComOrdemId = itens.map(item => ({
      ordem_id: ordem.id,
      item_id: item.item_id,
      codigo: item.codigo,
      tipo: item.tipo,
      quantidade: item.quantidade,
      position_column: item.position_column,
      position_floor: item.position_floor,
      empresa: item.empresa,
      observacoes: item.observacoes
    }));

    const { error: itensError } = await supabase
      .from('ordens_saida_itens')
      .insert(itensComOrdemId);

    if (itensError) {
      console.error('Error creating order items:', itensError);
      throw itensError;
    }

    return {
      ...ordem,
      data_emissao: new Date(ordem.data_emissao),
      created_at: new Date(ordem.created_at),
      updated_at: new Date(ordem.updated_at),
      itens: itensComOrdemId
    };
  }

  static async getOrdens(): Promise<OrdemSaida[]> {
    const { data, error } = await supabase
      .from('ordens_saida')
      .select(`
        *,
        itens:ordens_saida_itens(*)
      `)
      .order('data_emissao', { ascending: false });

    if (error) {
      console.error('Error fetching orders:', error);
      throw error;
    }

    return data.map(ordem => ({
      ...ordem,
      data_emissao: new Date(ordem.data_emissao),
      created_at: new Date(ordem.created_at),
      updated_at: new Date(ordem.updated_at),
      itens: ordem.itens?.map(item => ({
        ...item,
        created_at: new Date(item.created_at)
      }))
    }));
  }

  static async getOrdem(id: string): Promise<OrdemSaida | null> {
    const { data, error } = await supabase
      .from('ordens_saida')
      .select(`
        *,
        itens:ordens_saida_itens(*)
      `)
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error fetching order:', error);
      return null;
    }

    return {
      ...data,
      data_emissao: new Date(data.data_emissao),
      created_at: new Date(data.created_at),
      updated_at: new Date(data.updated_at),
      itens: data.itens?.map(item => ({
        ...item,
        created_at: new Date(item.created_at)
      }))
    };
  }

  static async atualizarOrdem(
    id: string,
    updates: { 
      observacoes?: string;
      itens?: OrdemSaidaItem[];
    }
  ): Promise<void> {
    // First check if order can be modified
    const { data: ordem, error: fetchError } = await supabase
      .from('ordens_saida')
      .select('status')
      .eq('id', id)
      .single();

    if (fetchError) {
      console.error('Error fetching order:', fetchError);
      throw fetchError;
    }

    // Prevent edits for completed or cancelled orders
    if (ordem.status === 'concluida' || ordem.status === 'cancelada') {
      throw new Error('Ordens concluídas ou canceladas não podem ser editadas por questão de segurança');
    }

    // Update ordem observacoes (always update to allow clearing)
    if ('observacoes' in updates) {
      const { error: ordemError } = await supabase
        .from('ordens_saida')
        .update({ observacoes: updates.observacoes || null })
        .eq('id', id);

      if (ordemError) {
        console.error('Error updating order:', ordemError);
        throw ordemError;
      }
    }

    // Update items if provided
    if (updates.itens && updates.itens.length > 0) {
      for (const item of updates.itens) {
        const { error: itemError } = await supabase
          .from('ordens_saida_itens')
          .update({
            codigo: item.codigo,
            tipo: item.tipo,
            quantidade: item.quantidade,
            observacoes: item.observacoes || null,
            empresa: item.empresa || null
          })
          .eq('id', item.id);

        if (itemError) {
          console.error('Error updating order item:', itemError);
          throw itemError;
        }
      }
    }
  }

  static async atualizarStatus(id: string, status: OrdemStatus): Promise<void> {
    // First check if order can be modified
    const { data: ordem, error: fetchError } = await supabase
      .from('ordens_saida')
      .select('status')
      .eq('id', id)
      .single();

    if (fetchError) {
      console.error('Error fetching order:', fetchError);
      throw fetchError;
    }

    // Prevent status changes for completed or cancelled orders
    if (ordem.status === 'concluida' || ordem.status === 'cancelada') {
      throw new Error('Ordens concluídas ou canceladas não podem ser alteradas por questão de segurança');
    }

    const { error } = await supabase
      .from('ordens_saida')
      .update({ status })
      .eq('id', id);

    if (error) {
      console.error('Error updating order status:', error);
      throw error;
    }

    // If completing order, finalize inventory removal
    if (status === 'concluida') {
      await this.concluirOrdem(id);
    }

    // If canceling order, return items to available inventory
    if (status === 'cancelada') {
      await this.cancelarOrdem(id);
    }
  }

  private static async concluirOrdem(ordemId: string): Promise<void> {
    // Get order items
    const { data: itens, error: itensError } = await supabase
      .from('ordens_saida_itens')
      .select('*')
      .eq('ordem_id', ordemId);

    if (itensError) {
      console.error('Error fetching order items:', itensError);
      throw itensError;
    }

    // Get user for movement log
    const { data: { user } } = await supabase.auth.getUser();
    const { data: profile } = await supabase
      .from('profiles')
      .select('full_name')
      .eq('id', user?.id || '')
      .single();

    // Update inventory for each item
    for (const item of itens || []) {
      // Get current inventory item
      const { data: inventoryItem, error: fetchError } = await supabase
        .from('inventory_items')
        .select('*')
        .eq('id', item.item_id)
        .single();

      if (fetchError || !inventoryItem) {
        console.error('Error fetching inventory item:', fetchError);
        continue;
      }

      // Log movement BEFORE deleting/updating item (to avoid foreign key constraint violation)
      await supabase
        .from('stock_movements')
        .insert({
          item_id: item.item_id,
          tipo: 'saida',
          quantidade: item.quantidade,
          position_column: item.position_column,
          position_floor: item.position_floor,
          observacoes: `Ordem de Saída concluída`,
          user_id: user?.id,
          user_name: profile?.full_name || user?.email?.split('@')[0] || 'Usuário',
          user_email: user?.email
        });

      // Remove from reserved and from total quantity
      const novaQuantidade = inventoryItem.quantidade - item.quantidade;
      const novaQuantidadeReservada = inventoryItem.quantidade_reservada - item.quantidade;

      if (novaQuantidade === 0) {
        // Delete item if quantity reaches zero
        await supabase
          .from('inventory_items')
          .delete()
          .eq('id', item.item_id);
      } else {
        // Update quantities
        await supabase
          .from('inventory_items')
          .update({ 
            quantidade: novaQuantidade,
            quantidade_reservada: novaQuantidadeReservada
          })
          .eq('id', item.item_id);
      }
    }
  }

  private static async cancelarOrdem(ordemId: string): Promise<void> {
    // Get order items
    const { data: itens, error: itensError } = await supabase
      .from('ordens_saida_itens')
      .select('*')
      .eq('ordem_id', ordemId);

    if (itensError) {
      console.error('Error fetching order items:', itensError);
      throw itensError;
    }

    // Get user for movement log
    const { data: { user } } = await supabase.auth.getUser();
    const { data: profile } = await supabase
      .from('profiles')
      .select('full_name')
      .eq('id', user?.id || '')
      .single();

    // Return items to available inventory
    for (const item of itens || []) {
      // Get current inventory item
      const { data: inventoryItem, error: fetchError } = await supabase
        .from('inventory_items')
        .select('*')
        .eq('id', item.item_id)
        .single();

      if (fetchError || !inventoryItem) {
        console.error('Error fetching inventory item:', fetchError);
        continue;
      }

      // Return from reserved to available
      await supabase
        .from('inventory_items')
        .update({
          quantidade_disponivel: inventoryItem.quantidade_disponivel + item.quantidade,
          quantidade_reservada: inventoryItem.quantidade_reservada - item.quantidade
        })
        .eq('id', item.item_id);

      // Log movement as cancellation
      await supabase
        .from('stock_movements')
        .insert({
          item_id: item.item_id,
          tipo: 'entrada',
          quantidade: item.quantidade,
          position_column: item.position_column,
          position_floor: item.position_floor,
          observacoes: `Ordem de Saída cancelada - Item devolvido ao estoque`,
          user_id: user?.id,
          user_name: profile?.full_name || user?.email?.split('@')[0] || 'Usuário',
          user_email: user?.email
        });
    }
  }
}
