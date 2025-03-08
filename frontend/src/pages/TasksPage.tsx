import { useCallback, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { ColumnDef } from "@tanstack/react-table";
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
import { DynamicTable, SortIndicator } from "@/components/ui/dynamic-table";

// Type for tasks from the database
type Task = Doc<"tasks">;

// Priority type
type Priority = "low" | "medium" | "high";

export default function TasksPage() {
  const { keycloak, initialized } = useKeycloak();
  const userId = keycloak.tokenParsed?.sub;
  
  // Show loading state while Keycloak is initializing or there's no userId
  if (!initialized || !keycloak.authenticated || !userId) {
    return (
      <div className="flex flex-col items-center justify-center p-8 gap-2">
        <div className="animate-spin w-6 h-6 border-2 border-primary border-t-transparent rounded-full"></div>
        <p className="text-sm text-muted-foreground">Loading...</p>
      </div>
    );
  }

  const tasks = useQuery(api.tasks.getByUser, { userId }) || [];
  const addTask = useMutation(api.tasks.add);
  const updateTask = useMutation(api.tasks.update);
  const toggleTask = useMutation(api.tasks.toggleCompleted);
  const deleteTask = useMutation(api.tasks.remove);

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
            <DynamicForm
              fields={taskFormFields}
              onSubmit={onSubmit}
              submitText={editingTask ? "Update Task" : "Create Task"}
              resetAfterSubmit={true}
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

      <DynamicTable 
        data={tasks}
        columns={columns}
        emptyMessage="No tasks found."
        filterColumn="title"
        filterPlaceholder="Filter tasks by title..."
      />
    </div>
  );
}