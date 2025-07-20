import { useState, useCallback } from 'react';
import { z } from 'zod';

interface UseFormValidationProps<T> {
  schema: z.ZodSchema<T>;
  initialData?: Partial<T>;
  onSubmit: (data: T) => void | Promise<void>;
}

interface FormErrors {
  [key: string]: string;
}

export function useFormValidation<T>({
  schema,
  initialData = {},
  onSubmit
}: UseFormValidationProps<T>) {
  const [data, setData] = useState<Partial<T>>(initialData);
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [touched, setTouched] = useState<Set<string>>(new Set());

  const updateField = useCallback((field: keyof T, value: any) => {
    setData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Clear error when user starts typing
    if (errors[field as string]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field as string];
        return newErrors;
      });
    }
  }, [errors]);

  const touchField = useCallback((field: keyof T) => {
    setTouched(prev => new Set(prev).add(field as string));
  }, []);

  const validateField = useCallback((field: keyof T, value: any) => {
    try {
      // Create a partial validation by creating a simple object with just the field
      const partialData = { [field]: value } as Partial<T>;
      
      // Try to parse the full data but only check for this field's errors
      schema.parse({ ...data, ...partialData });
      
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field as string];
        return newErrors;
      });
      
      return true;
    } catch (error) {
      if (error instanceof z.ZodError) {
        const fieldError = error.errors.find(err => err.path[0] === field);
        if (fieldError) {
          setErrors(prev => ({
            ...prev,
            [field as string]: fieldError.message
          }));
        }
      }
      return false;
    }
  }, [schema, data]);

  const validateAll = useCallback(() => {
    try {
      schema.parse(data);
      setErrors({});
      return true;
    } catch (error) {
      if (error instanceof z.ZodError) {
        const newErrors: FormErrors = {};
        error.errors.forEach(err => {
          if (err.path.length > 0) {
            newErrors[err.path[0] as string] = err.message;
          }
        });
        setErrors(newErrors);
        
        // Mark all fields as touched to show errors
        const allFields = new Set<string>();
        error.errors.forEach(err => {
          if (err.path.length > 0) {
            allFields.add(err.path[0] as string);
          }
        });
        setTouched(allFields);
      }
      return false;
    }
  }, [data, schema]);

  const handleSubmit = useCallback(async (e?: React.FormEvent) => {
    if (e) {
      e.preventDefault();
    }

    setIsSubmitting(true);
    
    try {
      if (validateAll()) {
        await onSubmit(data as T);
        // Reset form after successful submission
        setData(initialData);
        setErrors({});
        setTouched(new Set());
      }
    } catch (error) {
      console.error('Form submission error:', error);
    } finally {
      setIsSubmitting(false);
    }
  }, [data, validateAll, onSubmit, initialData]);

  const reset = useCallback(() => {
    setData(initialData);
    setErrors({});
    setTouched(new Set());
    setIsSubmitting(false);
  }, [initialData]);

  const getFieldProps = useCallback((field: keyof T) => ({
    value: data[field] || '',
    onChange: (value: any) => updateField(field, value),
    onBlur: () => {
      touchField(field);
      validateField(field, data[field]);
    },
    error: touched.has(field as string) ? errors[field as string] : undefined,
    required: true
  }), [data, errors, touched, updateField, touchField, validateField]);

  return {
    data,
    errors,
    isSubmitting,
    touched,
    updateField,
    touchField,
    validateField,
    validateAll,
    handleSubmit,
    reset,
    getFieldProps,
    isValid: Object.keys(errors).length === 0 && Object.keys(data).length > 0
  };
}