import type { InventoryItem, StockMovement, StoragePosition, TowerPosition, COLUMNS, FLOORS } from '@/types/inventory';
import { supabase } from '@/integrations/supabase/client';

export class InventoryStorage {
  static async getItems(): Promise<InventoryItem[]> {
    const { data, error } = await supabase
      .from('inventory_items')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    
    return (data || []).map(item => ({
      id: item.id,
      codigo: item.codigo,
      nome: item.nome,
      tipo: item.tipo as any,
      attributes: {
        largura: Number(item.largura),
        altura: Number(item.altura),
        espessura: Number(item.espessura),
        tempera: item.tempera as any,
        polegada: item.polegada ? Number(item.polegada) : undefined
      },
      acabamento: item.acabamento,
      peso_bruto: item.peso_bruto ? Number(item.peso_bruto) : undefined,
      peso_liquido: item.peso_liquido ? Number(item.peso_liquido) : undefined,
      quantidade: item.quantidade,
      quantidade_disponivel: item.quantidade_disponivel || 0,
      quantidade_reservada: item.quantidade_reservada || 0,
      quantidade_avaria: item.quantidade_avaria || 0,
      position: {
        column: item.position_column as any,
        floor: item.position_floor as any,
        toString: () => `${item.position_column}${item.position_floor}`
      },
      status: item.status as any,
      observacoes: item.observacoes,
      observacao_disponivel: item.observacao_disponivel,
      observacao_reservado: item.observacao_reservado,
      observacao_avaria: item.observacao_avaria,
      lote_id: item.lote_id,
      usina: item.usina,
      createdAt: new Date(item.created_at),
      updatedAt: new Date(item.updated_at)
    }));
  }

  static async addItem(item: Omit<InventoryItem, 'id' | 'createdAt' | 'updatedAt'>): Promise<InventoryItem> {
    const [{ data: { user } }, { data: profile }] = await Promise.all([
      supabase.auth.getUser(),
      supabase.auth.getUser().then(({ data }) => 
        supabase.from('profiles').select('full_name').eq('id', data.user?.id).maybeSingle()
      )
    ]);

    const { data, error } = await supabase
      .from('inventory_items')
      .insert({
        codigo: item.codigo,
        nome: item.nome,
        tipo: item.tipo,
        largura: item.attributes.largura,
        altura: item.attributes.altura,
        espessura: item.attributes.espessura,
        tempera: item.attributes.tempera,
        polegada: item.attributes.polegada,
        acabamento: item.acabamento,
        peso_bruto: item.peso_bruto,
        peso_liquido: item.peso_liquido,
        quantidade: item.quantidade,
        quantidade_disponivel: item.quantidade_disponivel,
        quantidade_reservada: item.quantidade_reservada,
        quantidade_avaria: item.quantidade_avaria,
        position_column: item.position.column,
        position_floor: item.position.floor,
        status: 'disponivel',
        observacoes: item.observacoes,
        lote_id: item.lote_id,
        usina: item.usina
      })
      .select()
      .single();

    if (error) throw error;

    // Register movement in parallel
    const movementPromise = supabase.from('stock_movements').insert({
      item_id: data.id,
      user_id: user?.id,
      user_email: user?.email,
      user_name: profile?.full_name || user?.email,
      tipo: 'entrada',
      quantidade: item.quantidade,
      position_column: item.position.column,
      position_floor: item.position.floor
    });

    const resultItem: InventoryItem = {
      id: data.id,
      codigo: data.codigo,
      nome: data.nome,
      tipo: data.tipo as any,
      attributes: {
        largura: Number(data.largura),
        altura: Number(data.altura),
        espessura: Number(data.espessura),
        tempera: data.tempera as any,
        polegada: data.polegada ? Number(data.polegada) : undefined
      },
      acabamento: data.acabamento,
      peso_bruto: data.peso_bruto ? Number(data.peso_bruto) : undefined,
      peso_liquido: data.peso_liquido ? Number(data.peso_liquido) : undefined,
      quantidade: data.quantidade,
      quantidade_disponivel: data.quantidade_disponivel || 0,
      quantidade_reservada: data.quantidade_reservada || 0,
      quantidade_avaria: data.quantidade_avaria || 0,
      position: item.position,
      status: data.status as any,
      observacoes: data.observacoes,
      observacao_disponivel: data.observacao_disponivel,
      observacao_reservado: data.observacao_reservado,
      observacao_avaria: data.observacao_avaria,
      lote_id: data.lote_id,
      usina: data.usina,
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at)
    };

    await movementPromise;
    return resultItem;
  }

  static async addMultipleItems(items: Omit<InventoryItem, 'id' | 'createdAt' | 'updatedAt'>[]): Promise<InventoryItem[]> {
    const [{ data: { user } }, { data: profile }] = await Promise.all([
      supabase.auth.getUser(),
      supabase.auth.getUser().then(({ data }) => 
        supabase.from('profiles').select('full_name').eq('id', data.user?.id).maybeSingle()
      )
    ]);

    const itemsToInsert = items.map(item => ({
      codigo: item.codigo,
      nome: item.nome,
      tipo: item.tipo,
      largura: item.attributes.largura,
      altura: item.attributes.altura,
      espessura: item.attributes.espessura,
      tempera: item.attributes.tempera,
      polegada: item.attributes.polegada,
      acabamento: item.acabamento,
      peso_bruto: item.peso_bruto,
      peso_liquido: item.peso_liquido,
      quantidade: item.quantidade,
      quantidade_disponivel: item.quantidade_disponivel,
      quantidade_reservada: item.quantidade_reservada,
      quantidade_avaria: item.quantidade_avaria,
      position_column: item.position.column,
      position_floor: item.position.floor,
      status: 'disponivel',
      observacoes: item.observacoes,
      lote_id: item.lote_id,
      usina: item.usina
    }));

    const { data, error } = await supabase
      .from('inventory_items')
      .insert(itemsToInsert)
      .select();

    if (error) throw error;

    // Batch insert movements
    const movements = data.map(item => ({
      item_id: item.id,
      user_id: user?.id,
      user_email: user?.email,
      user_name: profile?.full_name || user?.email,
      tipo: 'entrada' as const,
      quantidade: item.quantidade,
      position_column: item.position_column,
      position_floor: item.position_floor
    }));

    await supabase.from('stock_movements').insert(movements);

    return data.map((item, index) => ({
      id: item.id,
      codigo: item.codigo,
      nome: item.nome,
      tipo: item.tipo as any,
      attributes: {
        largura: Number(item.largura),
        altura: Number(item.altura),
        espessura: Number(item.espessura),
        tempera: item.tempera as any,
        polegada: item.polegada ? Number(item.polegada) : undefined
      },
      acabamento: item.acabamento,
      peso_bruto: item.peso_bruto ? Number(item.peso_bruto) : undefined,
      peso_liquido: item.peso_liquido ? Number(item.peso_liquido) : undefined,
      quantidade: item.quantidade,
      quantidade_disponivel: item.quantidade_disponivel || 0,
      quantidade_reservada: item.quantidade_reservada || 0,
      quantidade_avaria: item.quantidade_avaria || 0,
      position: items[index].position,
      status: item.status as any,
      observacoes: item.observacoes,
      observacao_disponivel: item.observacao_disponivel,
      observacao_reservado: item.observacao_reservado,
      observacao_avaria: item.observacao_avaria,
      lote_id: item.lote_id,
      usina: item.usina,
      createdAt: new Date(item.created_at),
      updatedAt: new Date(item.updated_at)
    }));
  }

  static async updateItem(id: string, updates: Partial<Omit<InventoryItem, 'id' | 'createdAt' | 'updatedAt'>>): Promise<boolean> {
    const updateData: any = {};
    
    if (updates.codigo !== undefined) updateData.codigo = updates.codigo;
    if (updates.nome !== undefined) updateData.nome = updates.nome;
    if (updates.tipo !== undefined) updateData.tipo = updates.tipo;
    if (updates.acabamento !== undefined) updateData.acabamento = updates.acabamento;
    if (updates.peso_bruto !== undefined) updateData.peso_bruto = updates.peso_bruto;
    if (updates.peso_liquido !== undefined) updateData.peso_liquido = updates.peso_liquido;
    if (updates.quantidade !== undefined) updateData.quantidade = updates.quantidade;
    if (updates.quantidade_disponivel !== undefined) updateData.quantidade_disponivel = updates.quantidade_disponivel;
    if (updates.quantidade_reservada !== undefined) updateData.quantidade_reservada = updates.quantidade_reservada;
    if (updates.quantidade_avaria !== undefined) updateData.quantidade_avaria = updates.quantidade_avaria;
    if (updates.observacoes !== undefined) updateData.observacoes = updates.observacoes;
    if (updates.lote_id !== undefined) updateData.lote_id = updates.lote_id;
    if (updates.usina !== undefined) updateData.usina = updates.usina;
    
    if (updates.attributes) {
      if (updates.attributes.largura !== undefined) updateData.largura = updates.attributes.largura;
      if (updates.attributes.altura !== undefined) updateData.altura = updates.attributes.altura;
      if (updates.attributes.espessura !== undefined) updateData.espessura = updates.attributes.espessura;
      if (updates.attributes.tempera !== undefined) updateData.tempera = updates.attributes.tempera;
      if (updates.attributes.polegada !== undefined) updateData.polegada = updates.attributes.polegada;
    }
    
    if (updates.position) {
      updateData.position_column = updates.position.column;
      updateData.position_floor = updates.position.floor;
    }

    const { error } = await supabase
      .from('inventory_items')
      .update(updateData)
      .eq('id', id);

    if (error) {
      console.error('Error updating item:', error);
      return false;
    }

    return true;
  }

  static async removeQuantity(id: string, quantidade: number, observacoes?: string): Promise<boolean> {
    const [{ data: { user } }, { data: profile }] = await Promise.all([
      supabase.auth.getUser(),
      supabase.auth.getUser().then(({ data }) => 
        supabase.from('profiles').select('full_name').eq('id', data.user?.id).maybeSingle()
      )
    ]);

    const { data: item, error: fetchError } = await supabase
      .from('inventory_items')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError || !item || item.quantidade < quantidade) {
      return false;
    }

    const newQuantity = item.quantidade - quantidade;

    if (newQuantity === 0) {
      await supabase.from('inventory_items').delete().eq('id', id);
    } else {
      await supabase
        .from('inventory_items')
        .update({ quantidade: newQuantity })
        .eq('id', id);
    }

    // Register movement with user info
    await supabase.from('stock_movements').insert({
      item_id: id,
      user_id: user?.id,
      user_email: user?.email,
      user_name: profile?.full_name || user?.email,
      tipo: 'saida',
      quantidade,
      position_column: item.position_column,
      position_floor: item.position_floor,
      observacoes
    });

    return true;
  }

  static async getAvailablePositions(): Promise<TowerPosition[]> {
    const { data: occupiedPositionsData } = await supabase
      .from('inventory_items')
      .select('*');
    
    // Carregar configuração da torre
    const { data: towerConfigData } = await supabase
      .from('tower_config')
      .select('*');
    
    const positions: TowerPosition[] = [];
    
    // Group items by position for efficient lookup
    const itemsByPosition = new Map<string, any[]>();
    occupiedPositionsData?.forEach(item => {
      const key = `${item.position_column}${item.position_floor}`;
      if (!itemsByPosition.has(key)) {
        itemsByPosition.set(key, []);
      }
      itemsByPosition.get(key)!.push(item);
    });

    // Usar configuração da torre se existir, senão usar padrão
    if (towerConfigData && towerConfigData.length > 0) {
      towerConfigData.forEach(config => {
        const column = config.column_name;
        const floors = config.floors as number[];
        
        floors.forEach(floor => {
          const position: StoragePosition = {
            column: column as any,
            floor: floor as any,
            toString: () => `${column}${floor}`
          };
          
          const key = `${column}${floor}`;
          const positionItems = itemsByPosition.get(key) || [];

          positions.push({
            position,
            occupied: positionItems.length > 0,
            item: positionItems[0] as any,
            items: positionItems as any
          });
        });
      });
    } else {
      // Fallback para configuração padrão se não houver configuração
      const columns: typeof COLUMNS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];
      const floors: typeof FLOORS = [1, 2, 3, 4];

      columns.forEach(column => {
        floors.forEach(floor => {
          const position: StoragePosition = {
            column,
            floor,
            toString: () => `${column}${floor}`
          };
          
          const key = `${column}${floor}`;
          const positionItems = itemsByPosition.get(key) || [];

          positions.push({
            position,
            occupied: positionItems.length > 0,
            item: positionItems[0] as any,
            items: positionItems as any
          });
        });
      });
    }

    return positions;
  }
}

export class MovementStorage {
  static async getMovements(): Promise<StockMovement[]> {
    const { data, error } = await supabase
      .from('stock_movements')
      .select('*')
      .order('timestamp', { ascending: false });

    if (error) throw error;
    
    return (data || []).map(movement => ({
      id: movement.id,
      itemId: movement.item_id || '',
      tipo: movement.tipo as 'entrada' | 'saida',
      quantidade: movement.quantidade,
      position: {
        column: movement.position_column as any,
        floor: movement.position_floor as any,
        toString: () => `${movement.position_column}${movement.position_floor}`
      },
      observacoes: movement.observacoes,
      timestamp: new Date(movement.timestamp),
      userName: movement.user_name,
      userEmail: movement.user_email
    }));
  }

  static async logReportGeneration(reportType: string): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    const { data: profile } = await supabase
      .from('profiles')
      .select('full_name')
      .eq('id', user?.id)
      .maybeSingle();

    await supabase.from('report_logs').insert({
      user_id: user?.id,
      user_email: user?.email,
      user_name: profile?.full_name || user?.email,
      report_type: reportType
    });
  }
}
