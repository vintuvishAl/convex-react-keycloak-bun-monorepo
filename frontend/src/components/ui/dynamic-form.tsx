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
  className?: string;
  resetAfterSubmit?: boolean;
  defaultValues?: Record<string, any>;
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
        let fieldSchema = z.number();
        if (field.required) fieldSchema = fieldSchema.min(field.min || 0);
        if (field.max) fieldSchema = fieldSchema.max(field.max);
        schema = fieldSchema;
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
  className,
  resetAfterSubmit = false,
  defaultValues: providedDefaults,
}) => {
  // Create Zod schema from field definitions
  const zodSchema = createZodSchema(fields);
  // Create default values from field definitions and provided defaults
  const defaultValues = createDefaultValues(fields, providedDefaults);

  // Initialize TanStack Form
  const form = useForm({
    defaultValues,
    onSubmit: async ({ value }) => {
      await onSubmit(value);
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
                  onChange={(e) => fieldProps.handleChange(e.target.value)}
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

      <Button
        type="submit"
        disabled={form.state.isSubmitting}
        className="w-full"
      >
        {form.state.isSubmitting ? 'Submitting...' : submitText}
      </Button>
    </form>
  );
};

export default DynamicForm;