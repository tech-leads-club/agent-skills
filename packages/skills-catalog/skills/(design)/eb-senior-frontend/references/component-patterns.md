# Component Patterns Reference

Copy-paste patterns for Next.js + Tailwind CSS + shadcn/ui projects.

---

## 1. Compound Components

Use React Context to share state between a parent and its children without prop drilling.

### Accordion Example

```tsx
// components/accordion.tsx
"use client";
import { createContext, useContext, useState, ReactNode } from "react";
import { cn } from "@/lib/utils";
import { ChevronDown } from "lucide-react";

type AccordionCtx = {
  openItem: string | null;
  toggle: (id: string) => void;
};

const AccordionContext = createContext<AccordionCtx | null>(null);
const useAccordion = () => {
  const ctx = useContext(AccordionContext);
  if (!ctx) throw new Error("AccordionItem must be inside Accordion");
  return ctx;
};

export function Accordion({ children, className }: { children: ReactNode; className?: string }) {
  const [openItem, setOpenItem] = useState<string | null>(null);
  const toggle = (id: string) => setOpenItem((prev) => (prev === id ? null : id));

  return (
    <AccordionContext.Provider value={{ openItem, toggle }}>
      <div className={cn("divide-y divide-border rounded-lg border", className)}>
        {children}
      </div>
    </AccordionContext.Provider>
  );
}

export function AccordionItem({ id, trigger, children }: {
  id: string; trigger: string; children: ReactNode;
}) {
  const { openItem, toggle } = useAccordion();
  const isOpen = openItem === id;

  return (
    <div>
      <button
        onClick={() => toggle(id)}
        className="flex w-full items-center justify-between px-4 py-3 text-sm font-medium hover:bg-muted/50 transition-colors"
      >
        {trigger}
        <ChevronDown className={cn("h-4 w-4 transition-transform", isOpen && "rotate-180")} />
      </button>
      <div className={cn(
        "grid transition-all duration-200",
        isOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
      )}>
        <div className="overflow-hidden px-4 pb-3 text-sm text-muted-foreground">
          {children}
        </div>
      </div>
    </div>
  );
}
```

### Menu/MenuItem Example

```tsx
"use client";
import { createContext, useContext, useState, ReactNode } from "react";
import { cn } from "@/lib/utils";

type MenuCtx = { activeItem: string | null; setActive: (id: string) => void };
const MenuContext = createContext<MenuCtx | null>(null);

export function Menu({ children, className }: { children: ReactNode; className?: string }) {
  const [activeItem, setActive] = useState<string | null>(null);
  return (
    <MenuContext.Provider value={{ activeItem, setActive }}>
      <nav className={cn("flex flex-col gap-1", className)}>{children}</nav>
    </MenuContext.Provider>
  );
}

export function MenuItem({ id, children }: { id: string; children: ReactNode }) {
  const ctx = useContext(MenuContext)!;
  return (
    <button
      onClick={() => ctx.setActive(id)}
      className={cn(
        "rounded-md px-3 py-2 text-sm text-left transition-colors",
        ctx.activeItem === id
          ? "bg-primary text-primary-foreground"
          : "hover:bg-muted text-muted-foreground"
      )}
    >
      {children}
    </button>
  );
}
```

---

## 2. Polymorphic Components

Render as different HTML elements or components using the `as` prop.

```tsx
import { ElementType, ComponentPropsWithoutRef, ReactNode } from "react";
import { cn } from "@/lib/utils";

type BoxProps<T extends ElementType> = {
  as?: T;
  children: ReactNode;
  className?: string;
} & ComponentPropsWithoutRef<T>;

export function Box<T extends ElementType = "div">({
  as,
  children,
  className,
  ...props
}: BoxProps<T>) {
  const Component = as || "div";
  return (
    <Component className={cn(className)} {...props}>
      {children}
    </Component>
  );
}

// Usage:
// <Box as="section" className="p-4">Section content</Box>
// <Box as="a" href="/about" className="text-blue-600 underline">Link</Box>
// <Box as={Link} href="/about">Next.js Link</Box>
```

---

## 3. Composition Over Configuration

### Slot Pattern

```tsx
import { ReactNode } from "react";

type CardProps = {
  header?: ReactNode;
  footer?: ReactNode;
  children: ReactNode;
};

export function Card({ header, footer, children }: CardProps) {
  return (
    <div className="rounded-xl border bg-card shadow-sm">
      {header && <div className="border-b px-6 py-4">{header}</div>}
      <div className="px-6 py-4">{children}</div>
      {footer && <div className="border-t bg-muted/50 px-6 py-3">{footer}</div>}
    </div>
  );
}

// Usage:
// <Card
//   header={<h3 className="font-semibold">Title</h3>}
//   footer={<Button>Save</Button>}
// >
//   <p>Content goes here</p>
// </Card>
```

### Render Props

```tsx
type ListProps<T> = {
  items: T[];
  renderItem: (item: T, index: number) => ReactNode;
  emptyState?: ReactNode;
  className?: string;
};

export function List<T>({ items, renderItem, emptyState, className }: ListProps<T>) {
  if (items.length === 0) return <>{emptyState || <p className="text-muted-foreground text-sm">No items</p>}</>;
  return <ul className={cn("space-y-2", className)}>{items.map((item, i) => <li key={i}>{renderItem(item, i)}</li>)}</ul>;
}
```

---

## 4. Extending shadcn/ui with CVA Variants

```tsx
// components/ui/badge.tsx (extended)
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground",
        secondary: "bg-secondary text-secondary-foreground",
        destructive: "bg-destructive text-destructive-foreground",
        outline: "border border-input bg-background text-foreground",
        success: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400",
        warning: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400",
        info: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
      },
      size: {
        sm: "px-2 py-0.5 text-[10px]",
        md: "px-2.5 py-0.5 text-xs",
        lg: "px-3 py-1 text-sm",
      },
    },
    defaultVariants: { variant: "default", size: "md" },
  }
);

type BadgeProps = React.HTMLAttributes<HTMLDivElement> & VariantProps<typeof badgeVariants>;

export function Badge({ className, variant, size, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant, size }), className)} {...props} />;
}
```

---

## 5. Form Pattern: react-hook-form + Zod + shadcn

```tsx
"use client";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const schema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  role: z.enum(["admin", "editor", "viewer"], { required_error: "Select a role" }),
});

type FormValues = z.infer<typeof schema>;

export function UserForm({ onSubmit }: { onSubmit: (data: FormValues) => void }) {
  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { name: "", email: "", role: undefined },
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField control={form.control} name="name" render={({ field }) => (
          <FormItem>
            <FormLabel>Name</FormLabel>
            <FormControl><Input placeholder="Jane Doe" {...field} /></FormControl>
            <FormMessage />
          </FormItem>
        )} />
        <FormField control={form.control} name="email" render={({ field }) => (
          <FormItem>
            <FormLabel>Email</FormLabel>
            <FormControl><Input type="email" placeholder="jane@example.com" {...field} /></FormControl>
            <FormMessage />
          </FormItem>
        )} />
        <FormField control={form.control} name="role" render={({ field }) => (
          <FormItem>
            <FormLabel>Role</FormLabel>
            <Select onValueChange={field.onChange} defaultValue={field.value}>
              <FormControl><SelectTrigger><SelectValue placeholder="Select role" /></SelectTrigger></FormControl>
              <SelectContent>
                <SelectItem value="admin">Admin</SelectItem>
                <SelectItem value="editor">Editor</SelectItem>
                <SelectItem value="viewer">Viewer</SelectItem>
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )} />
        <Button type="submit" className="w-full">Create User</Button>
      </form>
    </Form>
  );
}
```

---

## 6. Data Table: TanStack Table + shadcn

```tsx
"use client";
import { useState } from "react";
import {
  ColumnDef, flexRender, getCoreRowModel, getSortedRowModel,
  getPaginationRowModel, getFilteredRowModel, useReactTable, SortingState,
} from "@tanstack/react-table";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowUpDown } from "lucide-react";

type User = { id: string; name: string; email: string; status: "active" | "inactive" };

const columns: ColumnDef<User>[] = [
  {
    accessorKey: "name",
    header: ({ column }) => (
      <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
        Name <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
  },
  { accessorKey: "email", header: "Email" },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => (
      <span className={row.getValue("status") === "active"
        ? "text-emerald-600 font-medium" : "text-muted-foreground"}>
        {row.getValue("status")}
      </span>
    ),
  },
];

export function UsersTable({ data }: { data: User[] }) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [globalFilter, setGlobalFilter] = useState("");

  const table = useReactTable({
    data, columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    state: { sorting, globalFilter },
  });

  return (
    <div className="space-y-4">
      <Input placeholder="Search..." value={globalFilter} onChange={(e) => setGlobalFilter(e.target.value)} className="max-w-sm" />
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((hg) => (
              <TableRow key={hg.id}>
                {hg.headers.map((h) => (
                  <TableHead key={h.id}>{h.isPlaceholder ? null : flexRender(h.column.columnDef.header, h.getContext())}</TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow><TableCell colSpan={columns.length} className="h-24 text-center">No results.</TableCell></TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <div className="flex items-center justify-end gap-2">
        <Button variant="outline" size="sm" onClick={() => table.previousPage()} disabled={!table.getCanPreviousPage()}>Previous</Button>
        <Button variant="outline" size="sm" onClick={() => table.nextPage()} disabled={!table.getCanNextPage()}>Next</Button>
      </div>
    </div>
  );
}
```

---

## 7. Command Palette: cmdk + shadcn Command

```tsx
"use client";
import { useEffect, useState } from "react";
import { CommandDialog, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList, CommandSeparator } from "@/components/ui/command";
import { useRouter } from "next/navigation";
import { Settings, User, FileText, Search, Home, LogOut } from "lucide-react";

const navItems = [
  { label: "Home", icon: Home, href: "/" },
  { label: "Documents", icon: FileText, href: "/docs" },
  { label: "Settings", icon: Settings, href: "/settings" },
  { label: "Profile", icon: User, href: "/profile" },
];

const actions = [
  { label: "Search docs...", icon: Search, action: "search" },
  { label: "Sign out", icon: LogOut, action: "signout" },
];

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) { e.preventDefault(); setOpen((o) => !o); }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  const runAction = (action: string) => {
    setOpen(false);
    if (action === "signout") { /* sign out logic */ }
  };

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput placeholder="Type a command or search..." />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>
        <CommandGroup heading="Navigation">
          {navItems.map((item) => (
            <CommandItem key={item.href} onSelect={() => { setOpen(false); router.push(item.href); }}>
              <item.icon className="mr-2 h-4 w-4" /> {item.label}
            </CommandItem>
          ))}
        </CommandGroup>
        <CommandSeparator />
        <CommandGroup heading="Actions">
          {actions.map((item) => (
            <CommandItem key={item.action} onSelect={() => runAction(item.action)}>
              <item.icon className="mr-2 h-4 w-4" /> {item.label}
            </CommandItem>
          ))}
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}

// Trigger button for non-keyboard users:
// <Button variant="outline" className="text-muted-foreground" onClick={() => setOpen(true)}>
//   <Search className="mr-2 h-4 w-4" /> Search... <kbd className="ml-auto text-xs bg-muted px-1.5 py-0.5 rounded">Cmd+K</kbd>
// </Button>
```
