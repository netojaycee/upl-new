"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useCreateRole, useUpdateRole, useRole } from "@/lib/firebaseQueries";
import { NewRole, RoleUpdate } from "@/lib/types";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

interface RoleFormProps {
  roleId?: string;
  onSuccess: () => void;
}

export function RoleForm({ roleId, onSuccess }: RoleFormProps) {
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    permissions: [] as string[],
    isSystem: false,
  });
  const [newPermission, setNewPermission] = useState("");

  const { data: role, isLoading: isRoleLoading } = useRole(roleId || "");
  const createRoleMutation = useCreateRole();
  const updateRoleMutation = useUpdateRole();

  const isEditing = !!roleId;
  const isLoading =
    isRoleLoading ||
    createRoleMutation.isPending ||
    updateRoleMutation.isPending;

  useEffect(() => {
    if (isEditing && role) {
      setFormData({
        name: role.name,
        description: role.description || "",
        permissions: role.permissions || [],
        isSystem: role.isSystem,
      });
    }
  }, [isEditing, role]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (isEditing) {
        const updateData: RoleUpdate = {
          name: formData.name,
          description: formData.description || undefined,
          permissions: formData.permissions,
        };

        await updateRoleMutation.mutateAsync({
          id: roleId!,
          roleData: updateData,
        });
        toast.success("Role updated successfully");
      } else {
        if (!formData.name) {
          toast.error("Role name is required");
          return;
        }

        const newRole: NewRole = {
          name: formData.name,
          description: formData.description || undefined,
          permissions: formData.permissions,
          isSystem: false,
        };

        await createRoleMutation.mutateAsync(newRole);
        toast.success("Role created successfully");
      }

      onSuccess();
    } catch (error: any) {
      toast.error(
        error.message || `Failed to ${isEditing ? "update" : "create"} role`
      );
    }
  };

  const addPermission = () => {
    if (newPermission && !formData.permissions.includes(newPermission)) {
      setFormData((prev) => ({
        ...prev,
        permissions: [...prev.permissions, newPermission],
      }));
      setNewPermission("");
    }
  };

  const removePermission = (permission: string) => {
    setFormData((prev) => ({
      ...prev,
      permissions: prev.permissions.filter((p) => p !== permission),
    }));
  };

  if (isEditing && isRoleLoading) {
    return (
      <div className='flex justify-center py-8'>
        <Loader2 className='h-6 w-6 animate-spin' />
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className='space-y-6'>
      {/* Role Preview */}
      {formData.name && (
        <Card className='bg-muted/50'>
          <CardHeader className='pb-3'>
            <CardTitle className='text-lg flex items-center justify-between'>
              {formData.name}
              <Badge variant={formData.isSystem ? "default" : "secondary"}>
                {formData.isSystem ? "System" : "Custom"}
              </Badge>
            </CardTitle>
            {formData.description && (
              <p className='text-sm text-muted-foreground'>
                {formData.description}
              </p>
            )}
          </CardHeader>
        </Card>
      )}

      <div className='grid grid-cols-1 gap-4'>
        {/* Role Name */}
        <div className='space-y-2'>
          <Label htmlFor='name'>Role Name *</Label>
          <Input
            id='name'
            type='text'
            value={formData.name}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, name: e.target.value }))
            }
            disabled={formData.isSystem}
            required
            placeholder="e.g., Content Manager"
          />
        </div>

        {/* Role Description */}
        <div className='space-y-2'>
          <Label htmlFor='description'>Description</Label>
          <Textarea
            id='description'
            value={formData.description}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, description: e.target.value }))
            }
            disabled={formData.isSystem}
            placeholder="Describe what this role can do..."
            rows={3}
          />
        </div>

        {/* Permissions */}
        <div className='space-y-4'>
          <Label className='text-base font-medium'>Permissions</Label>
          
          {!formData.isSystem && (
            <div className='flex gap-2'>
              <Input
                value={newPermission}
                onChange={(e) => setNewPermission(e.target.value)}
                placeholder="Add a permission..."
                onKeyPress={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addPermission();
                  }
                }}
              />
              <Button type="button" onClick={addPermission} variant="outline">
                Add
              </Button>
            </div>
          )}

          <div className='flex flex-wrap gap-2'>
            {formData.permissions.map((permission) => (
              <Badge
                key={permission}
                variant='outline'
                className='flex items-center gap-1'
              >
                {permission}
                {!formData.isSystem && (
                  <button
                    type="button"
                    onClick={() => removePermission(permission)}
                    className='ml-1 hover:text-destructive'
                  >
                    ×
                  </button>
                )}
              </Badge>
            ))}
          </div>
          
          {formData.permissions.length === 0 && (
            <p className='text-sm text-muted-foreground'>
              No permissions added yet.
            </p>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className='flex justify-end space-x-3 pt-6'>
        <Button type='button' variant='outline' onClick={onSuccess}>
          Cancel
        </Button>
        <Button type='submit' disabled={isLoading || formData.isSystem}>
          {isLoading && <Loader2 className='h-4 w-4 mr-2 animate-spin' />}
          {isEditing ? "Update Role" : "Create Role"}
        </Button>
      </div>
    </form>
  );
}
