import { useState } from 'react';
import DynamicForm, { FormField } from '@/components/ui/dynamic-form';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { CheckCircle } from 'lucide-react';
import TaskFormExample from '@/components/examples/TaskFormExample';

export default function DynamicFormExample() {
  const [formResult, setFormResult] = useState<Record<string, any> | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);

  // Example fields for a user registration form
  const userFormFields: FormField[] = [
    {
      name: 'firstName',
      label: 'First Name',
      type: 'text',
      placeholder: 'Enter your first name',
      required: true,
      minLength: 2,
      maxLength: 50,
    },
    {
      name: 'lastName',
      label: 'Last Name',
      type: 'text',
      placeholder: 'Enter your last name',
      required: true,
      minLength: 2,
      maxLength: 50,
    },
    {
      name: 'email',
      label: 'Email',
      type: 'email',
      placeholder: 'Enter your email',
      required: true,
    },
    {
      name: 'password',
      label: 'Password',
      type: 'password',
      placeholder: 'Create a password',
      required: true,
      minLength: 8,
      pattern: '^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&])[A-Za-z\\d@$!%*?&]{8,}$',
    },
    {
      name: 'bio',
      label: 'Bio',
      type: 'textarea',
      placeholder: 'Tell us about yourself',
      maxLength: 500,
    },
    {
      name: 'role',
      label: 'Role',
      type: 'select',
      required: true,
      options: [
        { value: 'user', label: 'User' },
        { value: 'admin', label: 'Administrator' },
        { value: 'editor', label: 'Editor' },
      ],
    },
    {
      name: 'birthDate',
      label: 'Birth Date',
      type: 'date',
    },
    {
      name: 'acceptTerms',
      label: 'Accept Terms',
      type: 'checkbox',
      required: true,
      placeholder: 'I accept the terms and conditions',
    },
  ];

  // Example fields for a product form
  const productFormFields: FormField[] = [
    {
      name: 'productName',
      label: 'Product Name',
      type: 'text',
      placeholder: 'Enter product name',
      required: true,
    },
    {
      name: 'price',
      label: 'Price',
      type: 'number',
      placeholder: 'Enter price',
      required: true,
      min: 0,
    },
    {
      name: 'description',
      label: 'Description',
      type: 'textarea',
      placeholder: 'Enter product description',
    },
    {
      name: 'category',
      label: 'Category',
      type: 'select',
      required: true,
      options: [
        { value: 'electronics', label: 'Electronics' },
        { value: 'clothing', label: 'Clothing' },
        { value: 'books', label: 'Books' },
        { value: 'home', label: 'Home & Kitchen' },
      ],
    },
    {
      name: 'inStock',
      label: 'In Stock',
      type: 'checkbox',
      defaultValue: true,
    },
    {
      name: 'releaseDate',
      label: 'Release Date',
      type: 'date',
    },
  ];

  const handleSubmit = async (values: Record<string, any>) => {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    console.log('Form submitted:', values);
    setFormResult(values);
    setShowSuccess(true);
    
    // Hide success message after 3 seconds
    setTimeout(() => {
      setShowSuccess(false);
    }, 3000);
  };

  return (
    <div className="container mx-auto py-10">
      <h1 className="text-3xl font-bold mb-8">Dynamic Form Examples</h1>

      {showSuccess && (
        <Alert className="mb-6 bg-green-50 border-green-200">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertTitle className="text-green-800">Success!</AlertTitle>
          <AlertDescription className="text-green-700">
            Form submitted successfully.
          </AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-10">
        {/* User Registration Form */}
        <Card>
          <CardHeader>
            <CardTitle>User Registration</CardTitle>
            <CardDescription>
              Example of a user registration form with various field types and validations.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <DynamicForm
              fields={userFormFields}
              onSubmit={handleSubmit}
              submitText="Register"
              resetAfterSubmit={true}
            />
          </CardContent>
        </Card>

        {/* Product Form */}
        <Card>
          <CardHeader>
            <CardTitle>Product Information</CardTitle>
            <CardDescription>
              Example of a product information form with different field types.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <DynamicForm
              fields={productFormFields}
              onSubmit={handleSubmit}
              submitText="Save Product"
              resetAfterSubmit={true}
            />
          </CardContent>
        </Card>
      </div>

      {/* Real-world example with Convex integration */}
      <h2 className="text-2xl font-bold mb-6">Real-world Example with Convex Integration</h2>
      <div className="mb-10">
        <TaskFormExample />
      </div>

      {/* Display form result */}
      {formResult && (
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Form Submission Result</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="bg-muted p-4 rounded-md overflow-auto">
              {JSON.stringify(formResult, null, 2)}
            </pre>
          </CardContent>
        </Card>
      )}
    </div>
  );
}