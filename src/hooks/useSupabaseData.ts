import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

type TableName = 'expenses' | 'incomes' | 'transactions';

interface UseSupabaseDataOptions {
  tableName: TableName;
  orderBy?: { column: string; ascending?: boolean };
  onDataChange?: (data: any[]) => void;
}

export function useSupabaseData({
  tableName,
  orderBy = { column: 'created_at', ascending: false },
  onDataChange
}: UseSupabaseDataOptions) {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const loadData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }

      const { data: fetchedData, error } = await supabase
        .from(tableName)
        .select('*')
        .eq('user_id', user.id)
        .order(orderBy.column, { ascending: orderBy.ascending });

      if (error) throw error;

      setData(fetchedData || []);
      onDataChange?.(fetchedData || []);
    } catch (error) {
      console.error(`Error loading ${tableName}:`, error);
      toast({
        title: "Error",
        description: `Failed to load ${tableName}`,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const insertData = async (newData: Record<string, any>) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No authenticated user');

      const insertPayload = {
        ...newData,
        user_id: user.id
      };

      console.log(`Attempting to insert ${tableName}:`, insertPayload);
      const { data: insertedData, error } = await supabase
        .from(tableName)
        .insert(insertPayload as any)
        .select();

      console.log(`Insert result for ${tableName}:`, { data: insertedData, error });
      if (error) throw error;

      await loadData();
      toast({
        title: "Success",
        description: `${tableName.slice(0, -1)} added successfully`
      });

      return insertedData?.[0];
    } catch (error) {
      console.error(`Error inserting ${tableName}:`, error);
      toast({
        title: "Error",
        description: `Failed to add ${tableName.slice(0, -1)}`,
        variant: "destructive"
      });
      throw error;
    }
  };

  const updateData = async (id: string, updates: Record<string, any>) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No authenticated user');

      const { error } = await supabase
        .from(tableName)
        .update(updates)
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;

      await loadData();
      toast({
        title: "Success",
        description: `${tableName.slice(0, -1)} updated successfully`
      });
    } catch (error) {
      console.error(`Error updating ${tableName}:`, error);
      toast({
        title: "Error",
        description: `Failed to update ${tableName.slice(0, -1)}`,
        variant: "destructive"
      });
      throw error;
    }
  };

  const deleteData = async (id: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No authenticated user');

      const { error } = await supabase
        .from(tableName)
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;

      await loadData();
      toast({
        title: "Success",
        description: `${tableName.slice(0, -1)} deleted successfully`
      });
    } catch (error) {
      console.error(`Error deleting ${tableName}:`, error);
      toast({
        title: "Error",
        description: `Failed to delete ${tableName.slice(0, -1)}`,
        variant: "destructive"
      });
      throw error;
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  return {
    data,
    loading,
    loadData,
    insertData,
    updateData,
    deleteData
  };
}