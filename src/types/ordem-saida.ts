export type OrdemStatus = 'em_separacao' | 'aguardando_envio' | 'concluida' | 'cancelada';

export interface OrdemSaidaItem {
  id?: string;
  ordem_id?: string;
  item_id: string;
  codigo: string;
  tipo: string;
  quantidade: number;
  position_column: string;
  position_floor: number;
  observacoes?: string;
  empresa?: string;
  created_at?: Date;
}

export interface OrdemSaida {
  id: string;
  numero_ordem: string;
  data_emissao: Date;
  usuario_id?: string;
  usuario_nome?: string;
  usuario_email?: string;
  status: OrdemStatus;
  observacoes?: string;
  created_at: Date;
  updated_at: Date;
  itens?: OrdemSaidaItem[];
}

export const ORDEM_STATUS_LABELS: Record<OrdemStatus, string> = {
  em_separacao: 'Em Separação',
  aguardando_envio: 'Aguardando Envio',
  concluida: 'Concluída',
  cancelada: 'Cancelada'
};
