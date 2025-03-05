// Add the "use node" directive to enable Node.js runtime
// @ts-ignore
"use node";

import { mutation, action } from "./_generated/server";
import { v } from "convex/values";
import { promises as fs } from "fs";
import { exec } from "child_process";
import { promisify } from "util";
import path from "path";

const execAsync = promisify(exec);

// This action generates new schema files based on user requests
export const generateSchema = action({
  args: {
    entityName: v.string(),
    fields: v.array(v.object({
      name: v.string(),
      type: v.string(),
      required: v.optional(v.boolean())
    })),
    includeQueries: v.optional(v.boolean()),
    includeMutations: v.optional(v.boolean()),
    description: v.optional(v.string()),
    createFrontend: v.optional(v.boolean())
  },
  handler: async (ctx, args) => {
    try {
      // Create file paths
      const entityName = args.entityName.toLowerCase();
      const filePath = `../app/backend/convex/${entityName}.ts`;
      
      // Create frontend files if requested (default to true)
      const createFrontend = args.createFrontend !== false;
      
      // Generate schema file content
      let content = `import { mutation, query } from "./_generated/server";\nimport { v } from "convex/values";\n\n`;
      
      // Add description as comment if provided
      if (args.description) {
        content += `// ${args.description}\n\n`;
      }
      
      // Generate queries if requested
      if (args.includeQueries !== false) {
        content += `// Get all ${entityName} records\nexport const get = query({\n  args: {},\n  handler: async (ctx) => {\n    return await ctx.db.query("${entityName}").collect();\n  },\n});\n\n`;
        
        content += `// Get a specific ${entityName} by ID\nexport const getById = query({\n  args: { id: v.id("${entityName}") },\n  handler: async (ctx, args) => {\n    return await ctx.db.get(args.id);\n  },\n});\n\n`;
      }
      
      // Generate mutations if requested
      if (args.includeMutations !== false) {
        // Create mutation
        content += `// Create a new ${entityName}\nexport const create = mutation({\n  args: { \n`;
        
        // Add fields to create mutation
        args.fields.forEach(field => {
          const vType = getConvexType(field.type);
          const isRequired = field.required !== false;
          content += `    ${field.name}: ${isRequired ? vType : `v.optional(${vType})`},\n`;
        });
        
        content += `  },\n  handler: async (ctx, args) => {\n    const id = await ctx.db.insert("${entityName}", {\n`;
        
        // Add fields to insert
        args.fields.forEach(field => {
          content += `      ${field.name}: args.${field.name},\n`;
        });
        
        content += `      createdAt: new Date().toISOString(),\n    });\n    return id;\n  },\n});\n\n`;
        
        // Update mutation
        content += `// Update an existing ${entityName}\nexport const update = mutation({\n  args: { \n    id: v.id("${entityName}"),\n`;
        
        // Add fields to update mutation as optional
        args.fields.forEach(field => {
          const vType = getConvexType(field.type);
          content += `    ${field.name}: v.optional(${vType}),\n`;
        });
        
        content += `  },\n  handler: async (ctx, args) => {\n    const { id, ...fields } = args;\n    
    // Only update fields that are provided
    const updates = {};\n    
    for (const [key, value] of Object.entries(fields)) {
      if (value !== undefined) {
        updates[key] = value;
      }
    }\n    
    updates.updatedAt = new Date().toISOString();\n    
    await ctx.db.patch(id, updates);\n    
    return id;\n  },\n});\n\n`;
        
        // Delete mutation
        content += `// Delete an ${entityName}\nexport const remove = mutation({\n  args: { id: v.id("${entityName}") },\n  handler: async (ctx, args) => {\n    await ctx.db.delete(args.id);\n    return args.id;\n  },\n});\n`;
      }
      
      // Write the schema file
      await fs.writeFile(filePath, content);
      
      // Update the main schema.ts file
      const schemaFilePath = '../app/backend/convex/schema.ts';
      let schemaContent = await fs.readFile(schemaFilePath, 'utf8');
      
      // Parse the existing schema content
      const defineSchemaMatch = schemaContent.match(/defineSchema\({([\s\S]*?)}\);/);
      if (!defineSchemaMatch) {
        throw new Error('Could not parse existing schema file');
      }
      
      // Prepare the new table definition
      const newTableDefinition = `
  // ${args.description || `${entityName} table`}
  ${entityName}: defineTable({
${args.fields.map(field => {
  const vType = getConvexType(field.type);
  return `    ${field.name}: ${field.required !== false ? vType : `v.optional(${vType})`},`;
}).join('\n')}
    createdAt: v.string(),
    updatedAt: v.optional(v.string()),
  }),`;
      
      // Insert the new table definition
      const updatedSchemaContent = schemaContent.replace(
        defineSchemaMatch[1], 
        `${defineSchemaMatch[1]}${newTableDefinition}\n`
      );
      
      // Write the updated schema file
      await fs.writeFile(schemaFilePath, updatedSchemaContent);
      
      // Create frontend files if requested
      let frontendResults = { created: false };
      if (createFrontend) {
        frontendResults = await generateFrontendFiles(entityName, args.fields, args.description);
      }
      
      // Trigger Convex deployment
      try {
        const bun = process.env.BUN_RUNTIME ? true : false;
        const deployCmd = bun ? 
          "cd /app/backend && bun convex deploy --yes" : 
          "cd /app/backend && npx convex deploy --yes";
          
        await execAsync(deployCmd);
        return { 
          success: true, 
          message: `Successfully created and deployed schema for ${entityName}`,
          filePath,
          schemaUpdated: true,
          frontendCreated: frontendResults.created
        };
      } catch (deployError) {
        console.error("Failed to deploy schema:", deployError);
        return { 
          success: true, 
          message: `Created schema file for ${entityName}, but automatic deployment failed. Please deploy manually.`,
          error: String(deployError),
          filePath,
          schemaUpdated: false,
          frontendCreated: frontendResults.created
        };
      }
    } catch (error) {
      console.error("Error generating schema:", error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : "Unknown error" 
      };
    }
  },
});

// Define types for schema generation
interface SchemaField {
  name: string;
  type: string;
  required?: boolean;
}

// Function to generate frontend files
async function generateFrontendFiles(entityName: string, fields: SchemaField[], description?: string): Promise<{ created: boolean; error?: string }> {
  try {
    const singularName = entityName.endsWith('s') ? 
      entityName.slice(0, -1) : 
      entityName;
    
    const capitalizedSingular = singularName.charAt(0).toUpperCase() + singularName.slice(1);
    const capitalizedPlural = entityName.charAt(0).toUpperCase() + entityName.slice(1);
    
    // Create the directory structure
    const componentsDir = '../app/frontend/src/components';
    const pagesDir = '../app/frontend/src/pages';
    const entityComponentsDir = `${componentsDir}/${entityName}`;
    
    await fs.mkdir(entityComponentsDir, { recursive: true });
    
    // Create the components
    await generateListComponent(entityName, fields, entityComponentsDir, capitalizedPlural);
    await generateFormComponent(entityName, fields, entityComponentsDir, capitalizedSingular);
    await generateDetailComponent(entityName, fields, entityComponentsDir, capitalizedSingular);
    
    // Create the page component
    await generatePageComponent(entityName, capitalizedPlural, pagesDir);
    
    // Update the App.tsx routes
    await updateAppRoutes(entityName, capitalizedPlural);
    
    // Update the Header navigation
    await updateHeaderNav(entityName, capitalizedPlural);
    
    return { created: true };
  } catch (error) {
    console.error("Error generating frontend files:", error);
    return { created: false, error: String(error) };
  }
}

// Generate list component
async function generateListComponent(entityName: string, fields: SchemaField[], dir: string, capitalizedPlural: string): Promise<void> {
  const content = `import React, { useState } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../convex';
import { Link } from 'react-router-dom';
import { useKeycloak } from '../../KeycloakProvider';

const ${capitalizedPlural}List = () => {
  const { keycloak } = useKeycloak();
  const ${entityName} = useQuery(api.${entityName}.get) || [];
  const remove${entityName.charAt(0).toUpperCase() + entityName.slice(1, -1)} = useMutation(api.${entityName}.remove);

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this item?')) {
      try {
        await remove${entityName.charAt(0).toUpperCase() + entityName.slice(1, -1)}({ id });
      } catch (error) {
        console.error('Failed to delete item:', error);
      }
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-indigo-600">${capitalizedPlural}</h2>
        <Link
          to="/${entityName}/new"
          className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors"
        >
          Add New
        </Link>
      </div>

      {${entityName}.length === 0 ? (
        <p className="text-gray-500 text-center py-8">No ${entityName} found. Add one to get started.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                ${fields.map(field => `<th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">${field.name}</th>`).join('\n                ')}
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {${entityName}.map((item) => (
                <tr key={item._id}>
                  ${fields.map(field => {
                    if (field.type === 'boolean') {
                      return `<td className="px-6 py-4 whitespace-nowrap">{item.${field.name} ? 'Yes' : 'No'}</td>`;
                    } else if (field.type === 'number') {
                      return `<td className="px-6 py-4 whitespace-nowrap">{item.${field.name}?.toLocaleString()}</td>`;
                    } else {
                      return `<td className="px-6 py-4 whitespace-nowrap">{item.${field.name}}</td>`;
                    }
                  }).join('\n                  ')}
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <Link to={\`/${entityName}/\${item._id}\`} className="text-indigo-600 hover:text-indigo-900 mr-4">
                      View
                    </Link>
                    <Link to={\`/${entityName}/edit/\${item._id}\`} className="text-blue-600 hover:text-blue-900 mr-4">
                      Edit
                    </Link>
                    <button
                      onClick={() => handleDelete(item._id)}
                      className="text-red-600 hover:text-red-900"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default ${capitalizedPlural}List;
`;

  await fs.writeFile(`${dir}/${capitalizedPlural}List.tsx`, content);
}

// Generate form component
async function generateFormComponent(entityName: string, fields: SchemaField[], dir: string, capitalizedSingular: string): Promise<void> {
  const content = `import React, { useState, useEffect } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../convex';
import { useNavigate, useParams } from 'react-router-dom';
import { Id } from '../../convex/_generated/dataModel';
import { useKeycloak } from '../../KeycloakProvider';

const ${capitalizedSingular}Form = () => {
  const { keycloak } = useKeycloak();
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditing = !!id;
  
  // Mutations
  const create = useMutation(api.${entityName}.create);
  const update = useMutation(api.${entityName}.update);
  
  // For editing: fetch the existing data
  const existingData = useQuery(
    id ? api.${entityName}.getById : null,
    id ? { id: id as Id<"${entityName}"> } : undefined
  );
  
  // Form state
  const [formData, setFormData] = useState({
    ${fields.map(field => {
      if (field.type === 'boolean') {
        return `${field.name}: false`;
      } else if (field.type === 'number') {
        return `${field.name}: 0`;
      } else {
        return `${field.name}: ''`;
      }
    }).join(',\n    ')}
  });
  
  // Loading state
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Populate form when editing and data is available
  useEffect(() => {
    if (isEditing && existingData) {
      setFormData({
        ${fields.map(field => `${field.name}: existingData.${field.name} ?? ${field.type === 'boolean' ? 'false' : field.type === 'number' ? '0' : "''"}`).join(',\n        ')}
      });
    }
  }, [isEditing, existingData]);
  
  // Handle input changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : type === 'number' ? parseFloat(value) : value
    }));
  };
  
  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      if (isEditing) {
        await update({
          id: id as Id<"${entityName}">,
          ...formData
        });
      } else {
        await create(formData);
      }
      
      // Navigate back to list view
      navigate('/${entityName}');
    } catch (error) {
      console.error('Error saving ${entityName}:', error);
      alert('Failed to save. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <div className="bg-white p-6 rounded-lg shadow-md max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold text-indigo-600 mb-6">
        {isEditing ? 'Edit' : 'Create'} ${capitalizedSingular}
      </h2>
      
      <form onSubmit={handleSubmit}>
        ${fields.map(field => {
          if (field.type === 'boolean') {
            return `<div className="mb-4">
          <label className="flex items-center cursor-pointer">
            <input
              type="checkbox"
              name="${field.name}"
              checked={formData.${field.name}}
              onChange={handleChange}
              className="rounded border-gray-300 text-indigo-600 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50 mr-2"
            />
            <span className="text-gray-700">${field.name.charAt(0).toUpperCase() + field.name.slice(1)}</span>
          </label>
        </div>`;
          } else if (field.type === 'number') {
            return `<div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="${field.name}">
            ${field.name.charAt(0).toUpperCase() + field.name.slice(1)}
          </label>
          <input
            type="number"
            id="${field.name}"
            name="${field.name}"
            value={formData.${field.name}}
            onChange={handleChange}
            className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
            required={${field.required !== false}}
          />
        </div>`;
          } else {
            return `<div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="${field.name}">
            ${field.name.charAt(0).toUpperCase() + field.name.slice(1)}
          </label>
          <input
            type="text"
            id="${field.name}"
            name="${field.name}"
            value={formData.${field.name}}
            onChange={handleChange}
            className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
            required={${field.required !== false}}
          />
        </div>`;
          }
        }).join('\n        ')}
        
        <div className="flex justify-end space-x-4 mt-6">
          <button
            type="button"
            onClick={() => navigate('/${entityName}')}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50"
          >
            {isSubmitting ? 'Saving...' : isEditing ? 'Update' : 'Create'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ${capitalizedSingular}Form;
`;

  await fs.writeFile(`${dir}/${capitalizedSingular}Form.tsx`, content);
}

// Generate detail component
async function generateDetailComponent(entityName: string, fields: SchemaField[], dir: string, capitalizedSingular: string): Promise<void> {
  const content = `import React from 'react';
import { useQuery } from 'convex/react';
import { api } from '../../convex';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Id } from '../../convex/_generated/dataModel';

const ${capitalizedSingular}Detail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const item = useQuery(api.${entityName}.getById, { 
    id: id as Id<"${entityName}"> 
  });
  
  if (!item) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">Loading...</p>
      </div>
    );
  }
  
  return (
    <div className="bg-white p-6 rounded-lg shadow-md max-w-2xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-indigo-600">${capitalizedSingular} Details</h2>
        <div className="space-x-2">
          <Link
            to={\`/${entityName}/edit/\${id}\`}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors"
          >
            Edit
          </Link>
          <button
            onClick={() => navigate('/${entityName}')}
            className="bg-gray-200 text-gray-700 px-4 py-2 rounded hover:bg-gray-300 transition-colors"
          >
            Back to List
          </button>
        </div>
      </div>
      
      <div className="border rounded-lg overflow-hidden">
        <dl>
          ${fields.map((field, index) => `<div className="${index % 2 === 0 ? 'bg-gray-50' : 'bg-white'} px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
            <dt className="text-sm font-medium text-gray-500">${field.name.charAt(0).toUpperCase() + field.name.slice(1)}</dt>
            <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
              ${field.type === 'boolean' 
                ? '{item.' + field.name + ' ? "Yes" : "No"}' 
                : field.type === 'number' 
                  ? '{item.' + field.name + '?.toLocaleString()}' 
                  : '{item.' + field.name + '}'}
            </dd>
          </div>`).join('\n          ')}
          <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
            <dt className="text-sm font-medium text-gray-500">Created At</dt>
            <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
              {new Date(item.createdAt).toLocaleString()}
            </dd>
          </div>
          {item.updatedAt && (
            <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">Last Updated</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                {new Date(item.updatedAt).toLocaleString()}
              </dd>
            </div>
          )}
        </dl>
      </div>
    </div>
  );
};

export default ${capitalizedSingular}Detail;
`;

  await fs.writeFile(`${dir}/${capitalizedSingular}Detail.tsx`, content);
}

// Generate page component
async function generatePageComponent(entityName: string, capitalizedPlural: string, dir: string): Promise<void> {
  const capitalizedSingular = capitalizedPlural.endsWith('s') ? 
    capitalizedPlural.slice(0, -1) : 
    capitalizedPlural;
  
  const content = `import React from 'react';
import { Routes, Route } from 'react-router-dom';
import ${capitalizedPlural}List from '../components/${entityName}/${capitalizedPlural}List';
import ${capitalizedSingular}Form from '../components/${entityName}/${capitalizedSingular}Form';
import ${capitalizedSingular}Detail from '../components/${entityName}/${capitalizedSingular}Detail';

const ${capitalizedPlural}Page = () => {
  return (
    <div className="container mx-auto py-6 px-4">
      <Routes>
        <Route path="/" element={<${capitalizedPlural}List />} />
        <Route path="/new" element={<${capitalizedSingular}Form />} />
        <Route path="/:id" element={<${capitalizedSingular}Detail />} />
        <Route path="/edit/:id" element={<${capitalizedSingular}Form />} />
      </Routes>
    </div>
  );
};

export default ${capitalizedPlural}Page;
`;

  await fs.writeFile(`${dir}/${capitalizedPlural}Page.tsx`, content);
}

// Update App.tsx to include new routes
async function updateAppRoutes(entityName: string, capitalizedPlural: string): Promise<void> {
  try {
    const appFilePath = '../app/frontend/src/App.tsx';
    let appContent = await fs.readFile(appFilePath, 'utf8');
    
    // Check if the route already exists
    if (appContent.includes(`/${entityName}`)) {
      return;
    }
    
    // Find the Routes component
    const routesMatch = appContent.match(/(<Routes>[\s\S]*?<\/Routes>)/);
    if (!routesMatch) {
      throw new Error('Could not find Routes component in App.tsx');
    }
    
    // Create the new route
    const newRoute = `
      <Route 
        path="/${entityName}/*" 
        element={
          <PrivateRoute>
            <${capitalizedPlural}Page />
          </PrivateRoute>
        } 
      />`;
    
    // Insert before the closing </Routes> tag
    const updatedRoutes = routesMatch[0].replace(
      '</Routes>',
      `${newRoute}\n    </Routes>`
    );
    
    // Replace the old Routes section with the updated one
    const updatedAppContent = appContent.replace(routesMatch[0], updatedRoutes);
    
    // Add the import for the new page
    const importsMatch = updatedAppContent.match(/(import[\s\S]*?from ['"'].*?['"'];[\s\S]*?)(function|const|class)/);
    if (!importsMatch) {
      throw new Error('Could not find imports section in App.tsx');
    }
    
    const updatedImports = `${importsMatch[1]}import ${capitalizedPlural}Page from './pages/${capitalizedPlural}Page';\n\n${importsMatch[2]}`;
    
    const finalAppContent = updatedAppContent.replace(
      importsMatch[0],
      updatedImports
    );
    
    await fs.writeFile(appFilePath, finalAppContent);
  } catch (error) {
    console.error('Failed to update App.tsx:', error);
    // Continue anyway, don't fail the whole process
  }
}

// Update Header.tsx to include new navigation
async function updateHeaderNav(entityName: string, capitalizedPlural: string): Promise<void> {
  try {
    const headerFilePath = '../app/frontend/src/components/Header.tsx';
    let headerContent = await fs.readFile(headerFilePath, 'utf8');
    
    // Check if the nav link already exists
    if (headerContent.includes(`/${entityName}`)) {
      return;
    }
    
    // Find the nav section
    const navMatch = headerContent.match(/<nav className="flex space-x-4">([\s\S]*?)<\/nav>/);
    if (!navMatch) {
      throw new Error('Could not find nav component in Header.tsx');
    }
    
    // Create the new link
    const newLink = `
              <Link 
                to="/${entityName}" 
                className={\`hover:text-indigo-200 \${isActive('/${entityName}') ? 'font-semibold' : ''}\`}
              >
                ${capitalizedPlural}
              </Link>`;
    
    // Insert before the closing </nav> tag
    const updatedNav = navMatch[0].replace(
      '</nav>',
      `${newLink}\n            </nav>`
    );
    
    // Replace the old nav section with the updated one
    const updatedHeaderContent = headerContent.replace(navMatch[0], updatedNav);
    
    await fs.writeFile(headerFilePath, updatedHeaderContent);
  } catch (error) {
    console.error('Failed to update Header.tsx:', error);
    // Continue anyway, don't fail the whole process
  }
}

// Helper function to get the Convex type
function getConvexType(type: string) {
  switch (type.toLowerCase()) {
    case "string":
      return "v.string()";
    case "number":
      return "v.number()";
    case "boolean":
      return "v.boolean()";
    case "object":
      return "v.object({})";
    case "array":
      return "v.array(v.any())";
    case "date":
      return "v.string()"; // Store dates as ISO strings
    default:
      return "v.any()";
  }
}

// Create action to list all schema files
export const listSchemaFiles = action({
  handler: async (ctx) => {
    try {
      const files = await fs.readdir("./convex");
      const schemaFiles = files
        .filter(file => file.endsWith('.ts') && !file.startsWith('_'))
        .map(file => file.replace('.ts', ''));
      
      return { success: true, files: schemaFiles };
    } catch (error) {
      console.error("Error listing schema files:", error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : "Unknown error" 
      };
    }
  },
});