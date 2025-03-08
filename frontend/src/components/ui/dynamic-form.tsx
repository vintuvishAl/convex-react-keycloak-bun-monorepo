import React from 'react';
import { useForm } from '@tanstack/react-form';
import { z } from 'zod';
import { Input } from './input';
import { Label } from './label';
import { Checkbox } from './checkbox';
import { Button } from './button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './select';
import { Textarea } from './textarea';
import { DatePicker } from './date-picker';
import { cn } from '@/lib/utils';

// Field types supported by the dynamic form
export type FieldType = 
  | 'text'
  | 'number'
  | 'email'
  | 'password'
  | 'textarea'
  | 'checkbox'
  | 'select'
  | 'date';

// Options for select fields
export interface SelectOption {
  value: string;
  label: string;
}

// Field definition for the dynamic form
export interface FormField {
  name: string;
  label: string;
  type: FieldType;
  placeholder?: string;
  required?: boolean;
  options?: SelectOption[]; // For select fields
  min?: number; // For number fields
  max?: number; // For number fields
  minLength?: number; // For text fields
  maxLength?: number; // For text fields
  pattern?: string; // For text fields
  defaultValue?: any;
  className?: string;
}

// Props for the dynamic form component
export interface DynamicFormProps {
  fields: FormField[];
  onSubmit: (values: Record<string, any>) => void | Promise<void>;
  submitText?: string;
  submitButtonText?: string;
  className?: string;
  resetAfterSubmit?: boolean;
  defaultValues?: Record<string, any>;
  cancelButton?: boolean;
  onCancel?: () => void;
}

// Helper function to create a Zod schema from field definitions
const createZodSchema = (fields: FormField[]) => {
  const schemaMap: Record<string, z.ZodTypeAny> = {};

  fields.forEach((field) => {
    let schema: z.ZodTypeAny;

    switch (field.type) {
      case 'text':
      case 'textarea':
      case 'password': {
        let fieldSchema = z.string();
        if (field.required) fieldSchema = fieldSchema.min(1, 'Required');
        if (field.minLength) fieldSchema = fieldSchema.min(field.minLength);
        if (field.maxLength) fieldSchema = fieldSchema.max(field.maxLength);
        if (field.pattern) fieldSchema = fieldSchema.regex(new RegExp(field.pattern));
        schema = fieldSchema;
        break;
      }
      case 'email': {
        let fieldSchema = z.string().email();
        if (field.required) fieldSchema = fieldSchema.min(1, 'Required');
        schema = fieldSchema;
        break;
      }
      case 'number': {
        // Create the base number schema with all constraints
        let numberSchema = z.number({ invalid_type_error: "Must be a number" });
        
        // Add min/max constraints
        if (field.min !== undefined) numberSchema = numberSchema.min(field.min);
        if (field.max !== undefined) numberSchema = numberSchema.max(field.max);
        
        // Apply optional at the end instead of modifying numberSchema
        const finalNumberSchema = field.required ? numberSchema : numberSchema.optional();
        
        if (field.required) {
          // For required fields
          schema = z.string()
            .min(1, 'Required')
            .transform((val) => {
              const num = Number(val);
              return isNaN(num) ? undefined : num;
            })
            .pipe(finalNumberSchema);
        } else {
          // For optional fields
          schema = z.string()
            .transform((val) => {
              if (val === '') return undefined;
              const num = Number(val);
              return isNaN(num) ? undefined : num;
            })
            .pipe(finalNumberSchema);
        }
        break;
      }
      case 'checkbox':
        schema = z.boolean();
        break;
      case 'select': {
        let fieldSchema = z.string();
        if (field.required) fieldSchema = fieldSchema.min(1, 'Required');
        schema = fieldSchema;
        break;
      }
      case 'date': {
        let fieldSchema = z.string();
        if (field.required) fieldSchema = fieldSchema.min(1, 'Required');
        schema = fieldSchema;
        break;
      }
      default:
        schema = z.any();
    }

    schemaMap[field.name] = schema;
  });

  return z.object(schemaMap);
};

// Create default values from field definitions
const createDefaultValues = (fields: FormField[], providedDefaults?: Record<string, any>) => {
  const defaultValues: Record<string, any> = {};

  fields.forEach((field) => {
    // Use provided defaults if available, otherwise use field defaults or generate defaults
    if (providedDefaults && providedDefaults[field.name] !== undefined) {
      // For date fields, ensure the value is in YYYY-MM-DD format
      if (field.type === 'date' && providedDefaults[field.name]) {
        defaultValues[field.name] = providedDefaults[field.name];
      } else {
        defaultValues[field.name] = providedDefaults[field.name];
      }
    } else if (field.defaultValue !== undefined) {
      defaultValues[field.name] = field.defaultValue;
    } else {
      switch (field.type) {
        case 'checkbox':
          defaultValues[field.name] = false;
          break;
        case 'number':
          // For number fields, use empty string for the input but it will be parsed by the schema
          defaultValues[field.name] = '';
          break;
        case 'select':
          defaultValues[field.name] = field.options && field.options.length > 0 
            ? field.options[0].value 
            : '';
          break;
        case 'date':
          defaultValues[field.name] = '';
          break;
        default:
          defaultValues[field.name] = '';
      }
    }
  });

  return defaultValues;
};

export const DynamicForm: React.FC<DynamicFormProps> = ({
  fields,
  onSubmit,
  submitText = 'Submit',
  submitButtonText,
  className,
  resetAfterSubmit = false,
  defaultValues: providedDefaults,
  cancelButton = false,
  onCancel,
}) => {
  // Create Zod schema from field definitions
  const zodSchema = createZodSchema(fields);
  // Create default values from field definitions and provided defaults
  const defaultValues = createDefaultValues(fields, providedDefaults);

  // Initialize TanStack Form
  const form = useForm({
    defaultValues,
    onSubmit: async ({ value }) => {
      // Process number fields before submitting
      const processedValues: Record<string, any> = {};
      
      fields.forEach((field) => {
        const fieldValue = value[field.name];
        
        if (field.type === 'number' && fieldValue !== undefined && fieldValue !== '') {
          // Convert to number
          processedValues[field.name] = Number(fieldValue);
        } else {
          processedValues[field.name] = fieldValue;
        }
      });
      
      // Pass the processed values to the onSubmit handler
      await onSubmit(processedValues);
      
      if (resetAfterSubmit) {
        form.reset();
      }
    },
  });

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        form.handleSubmit();
      }}
      className={cn('space-y-6', className)}
    >
      {fields.map((field) => (
        <form.Field
          key={field.name}
          name={field.name}
          validators={{
            onChange: zodSchema.shape[field.name],
            onBlur: zodSchema.shape[field.name],
          }}
        >
          {(fieldProps) => (
            <div className={cn('space-y-2', field.className)}>
              <Label
                htmlFor={field.name}
                className={cn(
                  fieldProps.state.meta.errors?.length ? 'text-destructive' : ''
                )}
              >
                {field.label}
                {field.required && <span className="text-destructive ml-1">*</span>}
              </Label>

              {/* Render different input types based on field type */}
              {field.type === 'text' || field.type === 'email' || field.type === 'password' || field.type === 'number' ? (
                <Input
                  id={field.name}
                  type={field.type}
                  placeholder={field.placeholder}
                  defaultValue={fieldProps.state.value}
                  onChange={(e) => {
                    // For number fields, allow empty string or valid numbers only
                    if (field.type === 'number') {
                      const value = e.target.value;
                      if (value === '' || !isNaN(Number(value))) {
                        fieldProps.handleChange(value);
                      }
                    } else {
                      fieldProps.handleChange(e.target.value);
                    }
                  }}
                  onBlur={fieldProps.handleBlur}
                  className={cn(
                    fieldProps.state.meta.errors?.length ? 'border-destructive' : ''
                  )}
                  aria-invalid={fieldProps.state.meta.errors?.length > 0}
                />
              ) : field.type === 'date' ? (
                <DatePicker
                  value={fieldProps.state.value ? new Date(fieldProps.state.value) : undefined}
                  onChange={(date) => {
                    const formattedDate = date ? date.toISOString().split('T')[0] : '';
                    fieldProps.handleChange(formattedDate);
                  }}
                  placeholder={field.placeholder || "Pick a date"}
                  className={cn(
                    fieldProps.state.meta.errors?.length ? 'border-destructive' : ''
                  )}
                />
              ) : field.type === 'textarea' ? (
                <Textarea
                  id={field.name}
                  placeholder={field.placeholder}
                  defaultValue={fieldProps.state.value}
                  onChange={(e) => fieldProps.handleChange(e.target.value)}
                  onBlur={fieldProps.handleBlur}
                  className={cn(
                    fieldProps.state.meta.errors?.length ? 'border-destructive' : ''
                  )}
                  aria-invalid={fieldProps.state.meta.errors?.length > 0}
                />
              ) : field.type === 'checkbox' ? (
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id={field.name}
                    defaultChecked={fieldProps.state.value}
                    onCheckedChange={fieldProps.handleChange}
                    onBlur={fieldProps.handleBlur}
                  />
                  <label
                    htmlFor={field.name}
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    {field.placeholder || field.label}
                  </label>
                </div>
              ) : field.type === 'select' && field.options ? (
                <Select
                  defaultValue={fieldProps.state.value}
                  onValueChange={fieldProps.handleChange}
                >
                  <SelectTrigger
                    className={cn(
                      fieldProps.state.meta.errors?.length ? 'border-destructive' : ''
                    )}
                  >
                    <SelectValue placeholder={field.placeholder || `Select ${field.label}`} />
                  </SelectTrigger>
                  <SelectContent>
                    {field.options.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : null}

              {/* Display validation errors - Fixed to properly handle error objects */}
              {fieldProps.state.meta.errors?.length > 0 && (
                <p className="text-sm text-destructive">
                  {typeof fieldProps.state.meta.errors[0] === 'object' 
                   ? fieldProps.state.meta.errors[0].message || JSON.stringify(fieldProps.state.meta.errors[0])
                   : fieldProps.state.meta.errors[0]}
                </p>
              )}
            </div>
          )}
        </form.Field>
      ))}

      {/* Display form-level errors - Fixed to properly handle error objects */}
      {form.state.errors?.length > 0 && (
        <div className="p-3 bg-destructive/10 border border-destructive rounded-md">
          <p className="text-sm font-medium text-destructive">
            Please fix the following errors:
          </p>
            <ul className="text-sm text-destructive mt-2 list-disc pl-4">
            {form.state.errors.map((error: any, index) => (
              <li key={index}>
              {typeof error === 'object' 
               ? error.message || JSON.stringify(error)
               : error}
              </li>
            ))}
            </ul>
        </div>
      )}

      <div className="flex gap-2">
        <Button
          type="submit"
          disabled={form.state.isSubmitting}
          className={`${cancelButton ? 'flex-1' : 'w-full'}`}
        >
          {form.state.isSubmitting ? 'Submitting...' : submitButtonText || submitText}
        </Button>
        
        {cancelButton && onCancel && (
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            className="flex-1"
          >
            Cancel
          </Button>
        )}
      </div>
    </form>
  );
};

export default DynamicForm;