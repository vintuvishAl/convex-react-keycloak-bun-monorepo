import { useCallback, useMemo, useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
  getSortedRowModel,
  SortingState,
} from "@tanstack/react-table";
import { useQuery, useMutation } from "convex/react";
import { api } from "@backend/convex/_generated/api";
import type { Doc } from "@backend/convex/_generated/dataModel";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import DynamicForm, { FormField } from "@/components/ui/dynamic-form";
import { useKeycloak } from "@/KeycloakProvider";
import { ArrowDown, ArrowUp, ArrowUpDown } from "lucide-react";

// Type for products from the database
type Product = Doc<"products">;

export default function ProductsPage() {
  const { keycloak } = useKeycloak();
  const userId = keycloak?.tokenParsed?.sub || "";
  const [sorting, setSorting] = useState<SortingState>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  // Get products for the current user
  const products = useQuery(api.products.getByUser, { userId });
  
  // Mutations for CRUD operations
  const addProduct = useMutation(api.products.add);
  const updateProduct = useMutation(api.products.update);
  const deleteProduct = useMutation(api.products.remove);
  const toggleActive = useMutation(api.products.toggleActive);

  // Form fields for the product form
  const productFormFields: FormField[] = [
    {
      name: "name",
      label: "Product Name",
      type: "text",
      required: true,
    },
    {
      name: "description",
      label: "Description",
      type: "textarea",
      required: true,
    },
    {
      name: "price",
      label: "Price",
      type: "number",
      required: true,
      min: 0,
    },
    {
      name: "category",
      label: "Category",
      type: "select",
      required: true,
      options: [
        { label: "Electronics", value: "electronics" },
        { label: "Clothing", value: "clothing" },
        { label: "Books", value: "books" },
        { label: "Home & Garden", value: "home" },
        { label: "Toys", value: "toys" },
        { label: "Other", value: "other" },
      ],
    },
    {
      name: "stockQuantity",
      label: "Stock Quantity",
      type: "number",
      required: true,
      min: 0,
    },
    {
      name: "imageUrl",
      label: "Image URL",
      type: "text",
    },
    {
      name: "isActive",
      label: "Active",
      type: "checkbox",
    },
  ];

  // Handler for form submission (add or update)
  const handleSubmit = useCallback(
    async (data: any) => {
      try {
        if (editingProduct) {
          // Update existing product
          await updateProduct({
            id: editingProduct._id,
            name: data.name,
            description: data.description,
            price: Number(data.price),
            category: data.category,
            stockQuantity: Number(data.stockQuantity),
            imageUrl: data.imageUrl,
            isActive: Boolean(data.isActive),
          });
        } else {
          // Add new product
          await addProduct({
            name: data.name,
            description: data.description,
            price: Number(data.price),
            category: data.category,
            stockQuantity: Number(data.stockQuantity),
            imageUrl: data.imageUrl || undefined,
            userId,
            isActive: Boolean(data.isActive),
          });
        }
        // Close dialog and reset editing state
        setIsDialogOpen(false);
        setEditingProduct(null);
      } catch (error) {
        console.error("Error submitting product:", error);
      }
    },
    [addProduct, editingProduct, updateProduct, userId]
  );

  // Handler for toggling product active status
  const handleToggleActive = useCallback(
    async (product: Product) => {
      await toggleActive({
        id: product._id,
        isActive: !product.isActive,
      });
    },
    [toggleActive]
  );

  // Handler for deleting a product
  const handleDeleteProduct = useCallback(
    async (product: Product) => {
      if (window.confirm("Are you sure you want to delete this product?")) {
        await deleteProduct({ id: product._id });
      }
    },
    [deleteProduct]
  );

  // Function to format price as currency
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(value);
  };

  // Table columns definition
  const columns = useMemo<ColumnDef<Product>[]>(
    () => [
      {
        id: "name",
        header: ({ column }) => {
          return (
            <button
              className="flex items-center gap-1 hover:text-primary"
              onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            >
              Name
              {column.getIsSorted() === "asc" ? (
                <ArrowUp className="h-4 w-4" />
              ) : column.getIsSorted() === "desc" ? (
                <ArrowDown className="h-4 w-4" />
              ) : (
                <ArrowUpDown className="h-4 w-4" />
              )}
            </button>
          );
        },
        accessorKey: "name",
        cell: ({ row }) => <div className="font-medium">{row.original.name}</div>,
      },
      {
        id: "price",
        header: ({ column }) => {
          return (
            <button
              className="flex items-center gap-1 hover:text-primary"
              onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            >
              Price
              {column.getIsSorted() === "asc" ? (
                <ArrowUp className="h-4 w-4" />
              ) : column.getIsSorted() === "desc" ? (
                <ArrowDown className="h-4 w-4" />
              ) : (
                <ArrowUpDown className="h-4 w-4" />
              )}
            </button>
          );
        },
        accessorKey: "price",
        cell: ({ row }) => <div>{formatCurrency(row.original.price)}</div>,
      },
      {
        id: "category",
        header: "Category",
        accessorKey: "category",
        cell: ({ row }) => (
          <Badge variant="outline" className="capitalize">
            {row.original.category}
          </Badge>
        ),
      },
      {
        id: "stockQuantity",
        header: "Stock",
        accessorKey: "stockQuantity",
      },
      {
        id: "status",
        header: "Status",
        cell: ({ row }) => (
          <div className="flex items-center">
            <Checkbox
              checked={row.original.isActive}
              onCheckedChange={() => handleToggleActive(row.original)}
            />
            <span className="ml-2">{row.original.isActive ? "Active" : "Inactive"}</span>
          </div>
        ),
      },
      {
        id: "actions",
        header: "Actions",
        cell: ({ row }) => (
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setEditingProduct(row.original);
                setIsDialogOpen(true);
              }}
            >
              Edit
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => handleDeleteProduct(row.original)}
            >
              Delete
            </Button>
          </div>
        ),
      },
    ],
    [handleToggleActive, handleDeleteProduct]
  );

  // Set up table with TanStack Table
  const table = useReactTable({
    data: products || [],
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    onSortingChange: setSorting,
    state: {
      sorting,
    },
  });

  return (
    <div className="px-4 py-6 md:p-8 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Products</h1>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button 
              onClick={() => {
                setEditingProduct(null);
              }}
            >
              Add New Product
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>
                {editingProduct ? "Edit Product" : "Add New Product"}
              </DialogTitle>
            </DialogHeader>
            <DynamicForm
              fields={productFormFields}
              onSubmit={handleSubmit}
              submitButtonText={editingProduct ? "Update Product" : "Add Product"}
              defaultValues={editingProduct ? {
                name: editingProduct.name,
                description: editingProduct.description,
                price: editingProduct.price,
                category: editingProduct.category,
                stockQuantity: editingProduct.stockQuantity,
                imageUrl: editingProduct.imageUrl || "",
                isActive: editingProduct.isActive,
              } : {
                isActive: true
              }}
            />
          </DialogContent>
        </Dialog>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  {products === undefined ? (
                    <div className="flex justify-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                    </div>
                  ) : (
                    "No products found. Add a new product to get started."
                  )}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}