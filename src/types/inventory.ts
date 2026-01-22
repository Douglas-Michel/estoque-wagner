export type ItemType = 
  | 'tarugo'
  | 'lingote';

export type Tempera = 'H14' | 'H16' | 'H18' | 'H24' | 'H26' | 'O' | 'T6';

export interface ItemAttributes {
  largura?: number; // mm
  altura?: number; // mm  
  espessura?: number; // mm
  tempera?: Tempera;
  polegada?: number; // polegadas
}

export interface StoragePosition {
  column: 'A' | 'B' | 'C' | 'D' | 'E' | 'F' | 'G' | 'H';
  floor: 1 | 2 | 3 | 4;
  toString(): string;
}

export type ItemStatus = 'disponivel' | 'reservado' | 'avaria';

export interface InventoryItem {
  id: string;
  codigo: string;
  nome?: string;
  tipo: ItemType;
  attributes: ItemAttributes;
  acabamento?: string;
  peso_bruto?: number;
  peso_liquido?: number;
  quantidade: number;
  quantidade_disponivel: number;
  quantidade_reservada: number;
  quantidade_avaria: number;
  position: StoragePosition;
  status: ItemStatus;
  observacoes?: string;
  observacao_disponivel?: string;
  observacao_reservado?: string;
  observacao_avaria?: string;
  lote_id?: string;
  usina?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface StockMovement {
  id: string;
  itemId: string;
  tipo: 'entrada' | 'saida';
  quantidade: number;
  position: StoragePosition;
  observacoes?: string;
  timestamp: Date;
  userName?: string;
  userEmail?: string;
}

export interface TowerPosition {
  position: StoragePosition;
  occupied: boolean;
  item?: InventoryItem;
  items?: InventoryItem[]; // Multiple items in same position
}

export const ITEM_TYPE_LABELS: Record<ItemType, string> = {
  tarugo: 'Tarugo',
  lingote: 'Lingote'
};

export const TEMPERA_OPTIONS: Tempera[] = ['H14', 'H16', 'H18', 'H24', 'H26', 'O', 'T6'];

export const COLUMNS: StoragePosition['column'][] = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];
export const FLOORS: StoragePosition['floor'][] = [1, 2, 3, 4];