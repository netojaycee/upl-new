"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useCreateUser, useUpdateUser, useUserById } from "@/lib/firebaseQueries";
import { NewUser, UserUpdate } from "@/lib/types";
import { ROLE_DEFINITIONS, AVAILABLE_ROLES } from "@/lib/constants/roles";
import { toast } from "sonner";
import { Loader2, Eye, EyeOff } from "lucide-react";

interface UserFormProps {
  userId?: string;
  onSuccess: () => void;
}

export function UserForm({ userId, onSuccess }: UserFormProps) {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    displayName: "",
    photoURL: "",
    phoneNumber: "",
    disabled: false,
    emailVerified: false,
    roles: [] as string[],
  });
  const [showPassword, setShowPassword] = useState(false);

  const { data: user, isLoading: isUserLoading } = useUserById(userId || "");
  const createUserMutation = useCreateUser();
  const updateUserMutation = useUpdateUser();

  const isEditing = !!userId;
  const isLoading =
    isUserLoading ||
    createUserMutation.isPending ||
    updateUserMutation.isPending;

  useEffect(() => {
    if (isEditing && user) {
      setFormData({
        email: user.email,
        password: "", // Never pre-fill password
        displayName: user.displayName || "",
        photoURL: user.photoURL || "",
        phoneNumber: user.phoneNumber || "",
        disabled: user.disabled,
        emailVerified: user.emailVerified,
        roles: user.roles,
      });
    }
  }, [isEditing, user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (isEditing) {
        const updateData: UserUpdate = {
          displayName: formData.displayName || undefined,
          photoURL: formData.photoURL || undefined,
          phoneNumber: formData.phoneNumber || undefined,
          disabled: formData.disabled,
          emailVerified: formData.emailVerified,
          roles: formData.roles,
        };

        await updateUserMutation.mutateAsync({
          uid: userId!,
          userData: updateData,
        });
        toast.success("User updated successfully");
      } else {
        if (!formData.email || !formData.password) {
          toast.error("Email and password are required");
          return;
        }

        const newUser: NewUser = {
          email: formData.email,
          password: formData.password,
          displayName: formData.displayName || undefined,
          photoURL: formData.photoURL || undefined,
          phoneNumber: formData.phoneNumber || undefined,
          disabled: formData.disabled,
          emailVerified: formData.emailVerified,
          roles: formData.roles,
        };

        await createUserMutation.mutateAsync(newUser);
        toast.success("User created successfully");
      }

      onSuccess();
    } catch (error: any) {
      toast.error(
        error.message || `Failed to ${isEditing ? "update" : "create"} user`
      );
    }
  };

  const handleRoleToggle = (roleName: string) => {
    setFormData((prev) => ({
      ...prev,
      roles: prev.roles.includes(roleName)
        ? prev.roles.filter((r) => r !== roleName)
        : [...prev.roles, roleName],
    }));
  };

  if (isEditing && isUserLoading) {
    return (
      <div className='flex justify-center py-8'>
        <Loader2 className='h-6 w-6 animate-spin' />
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className='space-y-6'>
      {/* User Preview */}
      {formData.email && (
        <Card className='bg-muted/50'>
          <CardContent className='pt-6'>
            <div className='flex items-center space-x-3'>
              <Avatar>
                <AvatarImage src={formData.photoURL} />
                <AvatarFallback>
                  {formData.displayName
                    ? formData.displayName
                        .split(" ")
                        .map((n) => n[0])
                        .join("")
                        .toUpperCase()
                    : formData.email.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div>
                <div className='font-medium'>
                  {formData.displayName || "No Name"}
                </div>
                <div className='text-sm text-muted-foreground'>
                  {formData.email}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
        {/* Email */}
        <div className='space-y-2'>
          <Label htmlFor='email'>Email *</Label>
          <Input
            id='email'
            type='email'
            value={formData.email}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, email: e.target.value }))
            }
            disabled={isEditing} // Email cannot be changed after creation
            required={!isEditing}
          />
        </div>

        {/* Password */}
        {!isEditing && (
          <div className='space-y-2'>
            <Label htmlFor='password'>Password *</Label>
            <div className='relative'>
              <Input
                id='password'
                type={showPassword ? "text" : "password"}
                value={formData.password}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, password: e.target.value }))
                }
                required
              />
              <Button
                type='button'
                variant='ghost'
                size='icon'
                className='absolute right-0 top-0 h-full px-3'
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? (
                  <EyeOff className='h-4 w-4' />
                ) : (
                  <Eye className='h-4 w-4' />
                )}
              </Button>
            </div>
          </div>
        )}

        {/* Display Name */}
        <div className='space-y-2'>
          <Label htmlFor='displayName'>Display Name</Label>
          <Input
            id='displayName'
            value={formData.displayName}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, displayName: e.target.value }))
            }
          />
        </div>

        {/* Photo URL */}
        <div className='space-y-2'>
          <Label htmlFor='photoURL'>Photo URL</Label>
          <Input
            id='photoURL'
            type='url'
            value={formData.photoURL}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, photoURL: e.target.value }))
            }
          />
        </div>

        {/* Phone Number */}
        <div className='space-y-2'>
          <Label htmlFor='phoneNumber'>Phone Number</Label>
          <Input
            id='phoneNumber'
            type='tel'
            value={formData.phoneNumber}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, phoneNumber: e.target.value }))
            }
          />
        </div>
      </div>

      {/* Account Status */}
      <div className='space-y-4'>
        <Label className='text-base font-medium'>Account Status</Label>
        <div className='space-y-3'>
          <div className='flex items-center space-x-2'>
            <Checkbox
              id='emailVerified'
              checked={formData.emailVerified}
              onCheckedChange={(checked) =>
                setFormData((prev) => ({ ...prev, emailVerified: !!checked }))
              }
            />
            <Label htmlFor='emailVerified' className='text-sm'>
              Email Verified
            </Label>
          </div>
          <div className='flex items-center space-x-2'>
            <Checkbox
              id='disabled'
              checked={formData.disabled}
              onCheckedChange={(checked) =>
                setFormData((prev) => ({ ...prev, disabled: !!checked }))
              }
            />
            <Label htmlFor='disabled' className='text-sm text-destructive'>
              Account Disabled
            </Label>
          </div>
        </div>
      </div>

      {/* Roles */}
      <div className='space-y-4'>
        <Label className='text-base font-medium'>Roles</Label>
        <div className='grid grid-cols-1 md:grid-cols-2 gap-3'>
          {AVAILABLE_ROLES.map((roleName) => {
            const roleDefinition = ROLE_DEFINITIONS[roleName];
            return (
              <div
                key={roleName}
                className='flex items-center space-x-3 p-3 border rounded-lg'
              >
                <Checkbox
                  id={`role-${roleName}`}
                  checked={formData.roles.includes(roleName)}
                  onCheckedChange={() => handleRoleToggle(roleName)}
                />
                <div className='flex-1'>
                  <div className='flex items-center space-x-2'>
                    <Label
                      htmlFor={`role-${roleName}`}
                      className='text-sm font-medium'
                    >
                      {roleDefinition.name}
                    </Label>
                    <Badge variant='outline' className='text-xs'>
                      System
                    </Badge>
                  </div>
                  <p className='text-xs text-muted-foreground mt-1'>
                    {roleDefinition.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
        {formData.roles.length > 0 && (
          <div className='flex flex-wrap gap-2 mt-3'>
            {formData.roles.map((roleName) => {
              const roleDefinition =
                ROLE_DEFINITIONS[roleName as keyof typeof ROLE_DEFINITIONS];
              return roleDefinition ? (
                <Badge
                  key={roleName}
                  variant='secondary'
                  className={roleDefinition.color}
                >
                  {roleDefinition.name}
                </Badge>
              ) : null;
            })}
          </div>
        )}
      </div>

      {/* Actions */}
      <div className='flex justify-end space-x-3 pt-6'>
        <Button type='button' variant='outline' onClick={onSuccess}>
          Cancel
        </Button>
        <Button type='submit' disabled={isLoading}>
          {isLoading && <Loader2 className='h-4 w-4 mr-2 animate-spin' />}
          {isEditing ? "Update User" : "Create User"}
        </Button>
      </div>
    </form>
  );
}
