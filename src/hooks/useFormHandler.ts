import { useState } from 'react';

interface UseFormHandlerOptions<T> {
  initialData: T;
  onSubmit: (data: T, isEditing: boolean) => Promise<void>;
  onReset?: () => void;
}

export function useFormHandler<T extends Record<string, any>>({
  initialData,
  onSubmit,
  onReset
}: UseFormHandlerOptions<T>) {
  const [formData, setFormData] = useState<T>(initialData);
  const [editingItem, setEditingItem] = useState<T | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const resetForm = () => {
    setFormData(initialData);
    setEditingItem(null);
    setIsDialogOpen(false);
    onReset?.();
  };

  const handleEdit = (item: T) => {
    setFormData(item);
    setEditingItem(item);
    setIsDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await onSubmit(formData, !!editingItem);
      resetForm();
    } catch (error) {
      // Error handling is done in the onSubmit function
    }
  };

  const updateFormData = (updates: Partial<T>) => {
    setFormData(prev => ({ ...prev, ...updates }));
  };

  return {
    formData,
    editingItem,
    isDialogOpen,
    setIsDialogOpen,
    resetForm,
    handleEdit,
    handleSubmit,
    updateFormData
  };
}