import React, { useState } from 'react';
import { useMutation } from 'convex/react';
import { api } from '@backend/convex/_generated/api';
import { useKeycloak } from '@/KeycloakProvider';
import DynamicForm, { FormField } from '@/components/ui/dynamic-form';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { CheckCircle, AlertCircle } from 'lucide-react';

export default function TaskFormExample() {
  const { keycloak } = useKeycloak();
  const userId = keycloak.tokenParsed?.sub as string;
  const addTask = useMutation(api.tasks.add);
  
  const [showSuccess, setShowSuccess] = useState(false);
  const [showError, setShowError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Define the task form fields
  const taskFormFields: FormField[] = [
    {
      name: 'title',
      label: 'Task Title',
      type: 'text',
      placeholder: 'Enter task title',
      required: true,
      minLength: 3,
      maxLength: 100,
    },
    {
      name: 'description',
      label: 'Description',
      type: 'textarea',
      placeholder: 'Enter task description',
      maxLength: 500,
    },
    {
      name: 'priority',
      label: 'Priority',
      type: 'select',
      required: true,
      options: [
        { value: 'low', label: 'Low' },
        { value: 'medium', label: 'Medium' },
        { value: 'high', label: 'High' },
      ],
      defaultValue: 'medium',
    },
    {
      name: 'dueDate',
      label: 'Due Date',
      type: 'date',
    },
  ];

  const handleSubmit = async (values: Record<string, any>) => {
    try {
      // Format the data for the Convex API
      const taskData = {
        title: values.title,
        description: values.description || undefined,
        priority: values.priority as 'low' | 'medium' | 'high',
        dueDate: values.dueDate || undefined,
        completed: false,
        userId,
      };

      // Add the task using the Convex mutation
      await addTask(taskData);
      
      // Show success message
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
    } catch (error) {
      // Show error message
      setErrorMessage(error instanceof Error ? error.message : 'Failed to create task');
      setShowError(true);
      setTimeout(() => setShowError(false), 5000);
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Create New Task</CardTitle>
        <CardDescription>
          Use this form to create a new task with dynamic validation.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {showSuccess && (
          <Alert className="mb-6 bg-green-50 border-green-200">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertTitle className="text-green-800">Success!</AlertTitle>
            <AlertDescription className="text-green-700">
              Task created successfully.
            </AlertDescription>
          </Alert>
        )}

        {showError && (
          <Alert className="mb-6 bg-red-50 border-red-200">
            <AlertCircle className="h-4 w-4 text-red-600" />
            <AlertTitle className="text-red-800">Error</AlertTitle>
            <AlertDescription className="text-red-700">
              {errorMessage}
            </AlertDescription>
          </Alert>
        )}

        <DynamicForm
          fields={taskFormFields}
          onSubmit={handleSubmit}
          submitText="Create Task"
          resetAfterSubmit={true}
        />
      </CardContent>
    </Card>
  );
} 