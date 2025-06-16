"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { useCreateRole, useUpdateRole, useRole } from "@/lib/firebaseQueries";
import { NewRole } from "@/lib/types";
import { toast } from "sonner";
import { Loader2, Plus, X } from "lucide-react";

interface RoleFormProps {
  roleId?: string;
  onSuccess: () => void;
}

// Common permissions that can be selected
const availablePermissions = [
  "read:users",
  "write:users",
  "delete:users",
  "read:roles",
  "write:roles",
  "delete:roles",
  "read:teams",
  "write:teams",
  "delete:teams",
  "read:players",
  "write:players",
  "delete:players",
  "read:leagues",
  "write:leagues",
  "delete:leagues",
  "read:matches",
  "write:matches",
  "delete:matches",
  "read:venues",
  "write:venues",
  "delete:venues",
  "read:referees",
  "write:referees",
  "delete:referees",
  "read:news",
  "write:news",
  "delete:news",
  "read:settings",
  "write:settings",
  "admin:all",
];

export function RoleForm({ roleId, onSuccess }: RoleFormProps) {
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    permissions: [] as string[],
    isSystem: false,
  });
  const [customPermission, setCustomPermission] = useState("");

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
        permissions: role.permissions,
        isSystem: role.isSystem,
      });
    }
  }, [isEditing, role]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      toast.error("Role name is required");
      return;
    }

    try {
      if (isEditing) {
        await updateRoleMutation.mutateAsync({
          id: roleId!,
          roleData: {
            name: formData.name,
            description: formData.description,
            permissions: formData.permissions,
          },
        });
        toast.success("Role updated successfully");
      } else {
        const newRole: NewRole = {
          name: formData.name,
          description: formData.description,
          permissions: formData.permissions,
          isSystem: formData.isSystem,
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

  const handlePermissionToggle = (permission: string) => {
    setFormData((prev) => ({
      ...prev,
      permissions: prev.permissions.includes(permission)
        ? prev.permissions.filter((p) => p !== permission)
        : [...prev.permissions, permission],
    }));
  };

  const addCustomPermission = () => {
    if (
      customPermission.trim() &&
      !formData.permissions.includes(customPermission.trim())
    ) {
      setFormData((prev) => ({
        ...prev,
        permissions: [...prev.permissions, customPermission.trim()],
      }));
      setCustomPermission("");
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
      {/* Basic Information */}
      <div className='space-y-4'>
        <div className='space-y-2'>
          <Label htmlFor='name'>Role Name *</Label>
          <Input
            id='name'
            value={formData.name}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, name: e.target.value }))
            }
            placeholder='e.g., Admin, Editor, Viewer'
            disabled={isEditing && formData.isSystem}
            required
          />
        </div>

        <div className='space-y-2'>
          <Label htmlFor='description'>Description</Label>
          <Textarea
            id='description'
            value={formData.description}
            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
              setFormData((prev) => ({ ...prev, description: e.target.value }))
            }
            placeholder='Describe what this role can do...'
            rows={3}
            disabled={isEditing && formData.isSystem}
          />
        </div>

        {!isEditing && (
          <div className='flex items-center space-x-2'>
            <Checkbox
              id='isSystem'
              checked={formData.isSystem}
              onCheckedChange={(checked) =>
                setFormData((prev) => ({ ...prev, isSystem: !!checked }))
              }
            />
            <Label htmlFor='isSystem' className='text-sm'>
              System Role (cannot be deleted)
            </Label>
          </div>
        )}
      </div>

      {/* Permissions */}
      <div className='space-y-4'>
        <Label className='text-base font-medium'>Permissions</Label>

        {/* Selected Permissions */}
        {formData.permissions.length > 0 && (
          <div className='space-y-2'>
            <Label className='text-sm text-muted-foreground'>
              Selected Permissions:
            </Label>
            <div className='flex flex-wrap gap-2'>
              {formData.permissions.map((permission) => (
                <Badge
                  key={permission}
                  variant='secondary'
                  className='flex items-center gap-1'
                >
                  {permission}
                  {!(isEditing && formData.isSystem) && (
                    <button
                      type='button'
                      onClick={() => removePermission(permission)}
                      className='ml-1 hover:text-destructive'
                    >
                      <X className='h-3 w-3' />
                    </button>
                  )}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Available Permissions */}
        <div className='space-y-3'>
          <Label className='text-sm text-muted-foreground'>
            Available Permissions:
          </Label>
          <div className='grid grid-cols-1 md:grid-cols-2 gap-2 max-h-60 overflow-y-auto border rounded-lg p-3'>
            {availablePermissions.map((permission) => (
              <div key={permission} className='flex items-center space-x-2'>
                <Checkbox
                  id={`perm-${permission}`}
                  checked={formData.permissions.includes(permission)}
                  onCheckedChange={() => handlePermissionToggle(permission)}
                  disabled={isEditing && formData.isSystem}
                />
                <Label
                  htmlFor={`perm-${permission}`}
                  className='text-sm font-mono cursor-pointer'
                >
                  {permission}
                </Label>
              </div>
            ))}
          </div>
        </div>

        {/* Custom Permission */}
        {!(isEditing && formData.isSystem) && (
          <div className='space-y-2'>
            <Label className='text-sm text-muted-foreground'>
              Add Custom Permission:
            </Label>
            <div className='flex space-x-2'>
              <Input
                value={customPermission}
                onChange={(e) => setCustomPermission(e.target.value)}
                placeholder='custom:permission'
                onKeyPress={(e) =>
                  e.key === "Enter" &&
                  (e.preventDefault(), addCustomPermission())
                }
              />
              <Button
                type='button'
                variant='outline'
                onClick={addCustomPermission}
                disabled={!customPermission.trim()}
              >
                <Plus className='h-4 w-4' />
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className='flex justify-end space-x-3 pt-6'>
        <Button type='button' variant='outline' onClick={onSuccess}>
          Cancel
        </Button>
        <Button
          type='submit'
          disabled={isLoading || (isEditing && formData.isSystem)}
        >
          {isLoading && <Loader2 className='h-4 w-4 mr-2 animate-spin' />}
          {isEditing ? "Update Role" : "Create Role"}
        </Button>
      </div>
    </form>
  );
}
