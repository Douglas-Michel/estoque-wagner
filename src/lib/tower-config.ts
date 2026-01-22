import { supabase } from '@/integrations/supabase/client';

export interface TowerConfig {
  [column: string]: number[];
}

export async function loadTowerConfig(): Promise<TowerConfig> {
  const { data, error } = await supabase
    .from('tower_config')
    .select('column_name, floors')
    .order('column_name');

  if (error) {
    console.error('Error loading tower config:', error);
    // Return default config if there's an error
    return {
      A: [1, 2, 3, 4],
      B: [1, 2, 3, 4],
      C: [1, 2, 3, 4],
      D: [1, 2, 3, 4],
      E: [1, 2, 3, 4],
      F: [1, 2, 3, 4],
      G: [1, 2, 3, 4],
      H: [1, 2, 3, 4],
    };
  }

  const config: TowerConfig = {};
  data.forEach(row => {
    config[row.column_name] = row.floors;
  });

  return config;
}

export async function saveTowerConfig(config: TowerConfig): Promise<boolean> {
  try {
    // Get existing columns from the database
    const { data: existingData } = await supabase
      .from('tower_config')
      .select('column_name');

    const existingColumns = new Set(existingData?.map(row => row.column_name) || []);
    const newColumns = Object.keys(config);

    // Delete columns that are no longer in the config
    const columnsToDelete = Array.from(existingColumns).filter(col => !newColumns.includes(col));
    if (columnsToDelete.length > 0) {
      await supabase
        .from('tower_config')
        .delete()
        .in('column_name', columnsToDelete);
    }

    // Upsert all columns in the config
    const upsertData = Object.entries(config).map(([column_name, floors]) => ({
      column_name,
      floors,
    }));

    const { error } = await supabase
      .from('tower_config')
      .upsert(upsertData, { onConflict: 'column_name' });

    if (error) {
      console.error('Error saving tower config:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error saving tower config:', error);
    return false;
  }
}

export function getAvailablePositions(config: TowerConfig): { column: string; floor: number }[] {
  const positions: { column: string; floor: number }[] = [];
  
  Object.entries(config).forEach(([column, floors]) => {
    floors.forEach(floor => {
      positions.push({ column, floor });
    });
  });

  return positions.sort((a, b) => {
    if (a.column === b.column) {
      return a.floor - b.floor;
    }
    return a.column.localeCompare(b.column);
  });
}
