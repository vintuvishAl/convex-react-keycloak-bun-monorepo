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

// Type for tasks from the database
type Task = Doc<"tasks">;

// Priority type
type Priority = "low" | "medium" | "high";

export default function TasksPage() {
  const { keycloak } = useKeycloak();
  const userId = keycloak.tokenParsed?.sub as string;
  const tasks = useQuery(api.tasks.getByUser, { userId }) || [];
  const addTask = useMutation(api.tasks.add);
  const updateTask = useMutation(api.tasks.update);
  const toggleTask = useMutation(api.tasks.toggleCompleted);
  const deleteTask = useMutation(api.tasks.remove);

  const [sorting, setSorting] = useState<SortingState>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  // Form fields for task creation/editing
  const taskFormFields: FormField[] = [
    {
      name: "title",
      label: "Title",
      type: "text",
      placeholder: "Enter task title",
      required: true,
      minLength: 1,
    },
    {
      name: "description",
      label: "Description",
      type: "textarea",
      placeholder: "Enter task description",
    },
    {
      name: "priority",
      label: "Priority",
      type: "select",
      options: [
        { value: "low", label: "Low" },
        { value: "medium", label: "Medium" },
        { value: "high", label: "High" },
      ],
      defaultValue: "medium",
    },
    {
      name: "dueDate",
      label: "Due Date",
      type: "date",
    },
  ];

  // Form submission handler
  const onSubmit = async (data: Record<string, any>) => {
    try {
      const formData = {
        title: data.title,
        description: data.description || undefined,
        priority: data.priority as Priority,
        dueDate: data.dueDate || undefined,
      };

      if (editingTask) {
        await updateTask({
          id: editingTask._id,
          ...formData,
        });
        setEditingTask(null);
      } else {
        await addTask({
          ...formData,
          completed: false,
          userId,
        });
      }
      setIsDialogOpen(false);
    } catch (error) {
      console.error('Failed to save task:', error);
    }
  };

  // Reset form when editing a task
  const handleEditTask = useCallback((task: Task) => {
    setEditingTask(task);
    setIsDialogOpen(true);
  }, []);

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleString();
  };

  // Sort indicator component
  const SortIndicator = ({ isSorted }: { isSorted: false | 'asc' | 'desc' }) => {
    if (!isSorted) return <ArrowUpDown className="ml-2 h-4 w-4" />;
    return isSorted === 'asc' ? 
      <ArrowUp className="ml-2 h-4 w-4" /> : 
      <ArrowDown className="ml-2 h-4 w-4" />;
  };

  const columns = useMemo<ColumnDef<Task>[]>(
    () => [
      {
        id: "completed",
        header: "Status",
        cell: ({ row }) => (
          <Checkbox
            checked={row.original.completed}
            onCheckedChange={(checked: boolean) =>
              toggleTask({
                id: row.original._id,
                completed: checked,
              })
            }
          />
        ),
      },
      {
        accessorKey: "title",
        header: ({ column }) => (
          <div className="flex items-center cursor-pointer"
               onClick={() => column.toggleSorting()}>
            Title
            <SortIndicator isSorted={column.getIsSorted()} />
          </div>
        ),
      },
      {
        accessorKey: "description",
        header: "Description",
      },
      {
        accessorKey: "priority",
        header: ({ column }) => (
          <div className="flex items-center cursor-pointer"
               onClick={() => column.toggleSorting()}>
            Priority
            <SortIndicator isSorted={column.getIsSorted()} />
          </div>
        ),
        cell: ({ row }) => (
          <Badge
            variant={
              row.original.priority === "high"
                ? "destructive"
                : row.original.priority === "medium"
                ? "default"
                : "secondary"
            }
          >
            {row.original.priority || "low"}
          </Badge>
        ),
      },
      {
        accessorKey: "dueDate",
        header: ({ column }) => (
          <div className="flex items-center cursor-pointer"
               onClick={() => column.toggleSorting()}>
            Due Date
            <SortIndicator isSorted={column.getIsSorted()} />
          </div>
        ),
        cell: ({ row }) =>
          row.original.dueDate
            ? new Date(row.original.dueDate).toLocaleDateString()
            : "-",
        sortingFn: "datetime"
      },
      {
        accessorKey: "createdAt",
        header: ({ column }) => (
          <div className="flex items-center cursor-pointer"
               onClick={() => column.toggleSorting()}>
            Created
            <SortIndicator isSorted={column.getIsSorted()} />
          </div>
        ),
        cell: ({ row }) => formatDate(row.original.createdAt),
        sortingFn: "datetime"
      },
      {
        accessorKey: "updatedAt",
        header: ({ column }) => (
          <div className="flex items-center cursor-pointer"
               onClick={() => column.toggleSorting()}>
            Last Updated
            <SortIndicator isSorted={column.getIsSorted()} />
          </div>
        ),
        cell: ({ row }) =>
          row.original.updatedAt ? formatDate(row.original.updatedAt) : "-",
        sortingFn: "datetime"
      },
      {
        id: "actions",
        cell: ({ row }) => (
          <div className="flex gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => handleEditTask(row.original)}
            >
              Edit
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => deleteTask({ id: row.original._id })}
            >
              Delete
            </Button>
          </div>
        ),
      },
    ],
    [toggleTask, deleteTask, handleEditTask]
  );

  const table = useReactTable({
    data: tasks,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    onSortingChange: setSorting,
    state: {
      sorting,
    },
  });

  return (
    <div className="container mx-auto py-10">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Tasks</h1>
        <Dialog
          open={isDialogOpen}
          onOpenChange={(open: boolean) => {
            setIsDialogOpen(open);
            if (!open) {
              setEditingTask(null);
            }
          }}
        >
          <DialogTrigger asChild>
            <Button>Add New Task</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingTask ? "Edit Task" : "Create New Task"}
              </DialogTitle>
            </DialogHeader>
            {/* Using DynamicForm instead of manual form */}
            <DynamicForm
              fields={taskFormFields}
              onSubmit={onSubmit}
              submitText={editingTask ? "Update Task" : "Create Task"}
              resetAfterSubmit={true}
              // If editing a task, initialize form with current values
              defaultValues={editingTask ? {
                title: editingTask.title,
                description: editingTask.description || "",
                priority: editingTask.priority || "medium",
                dueDate: editingTask.dueDate || "",
              } : undefined}
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
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
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
                  No tasks found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}