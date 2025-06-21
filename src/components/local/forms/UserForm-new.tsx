"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  useCreateUser,
  useUpdateUser,
  useUserById,
} from "@/lib/firebaseQueries";
import { NewUser, UserUpdate } from "@/lib/types";
import { AVAILABLE_ROLES, ROLE_DEFINITIONS } from "@/lib/constants/roles";
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
  const [photoFile, setPhotoFile] = useState<File | null>(null);
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

  console.log(user);

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
          photoFile: photoFile || undefined,
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
          photoFile: photoFile || undefined,
        };

        console.log("Creating new user:", newUser);
        // await createUserMutation.mutateAsync(newUser);
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

  const handlePhotoFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPhotoFile(file);
      // Create a preview URL
      const previewUrl = URL.createObjectURL(file);
      setFormData((prev) => ({ ...prev, photoURL: previewUrl }));
    }
  };

  const getRoleDescription = (role: string) => {
    const roleKey = role as keyof typeof ROLE_DEFINITIONS;
    return ROLE_DEFINITIONS[roleKey]?.description || "Custom role";
  };

  const getRoleColor = (role: string) => {
    const roleKey = role as keyof typeof ROLE_DEFINITIONS;
    return ROLE_DEFINITIONS[roleKey]?.color || "bg-gray-100 text-gray-800";
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
            placeholder='user@example.com'
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
                placeholder='Minimum 6 characters'
                minLength={6}
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
            placeholder='John Doe'
          />
        </div>

        {/* Photo Upload */}
        <div className='space-y-2'>
          <Label htmlFor='photoFile'>Profile Photo</Label>
          <div className='flex items-center space-x-4'>
            {formData.photoURL && (
              <Avatar className='h-16 w-16'>
                <AvatarImage src={formData.photoURL} alt='Profile preview' />
                <AvatarFallback>
                  {formData.displayName
                    ? formData.displayName
                        .split(" ")
                        .map((n: string) => n[0])
                        .join("")
                        .toUpperCase()
                    : formData.email.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
            )}
            <div className='flex-1 space-y-2'>
              <Input
                id='photoFile'
                type='file'
                accept='image/*'
                onChange={handlePhotoFileChange}
                className='cursor-pointer'
              />
              <p className='text-xs text-muted-foreground'>
                Choose an image file or enter a URL below
              </p>
              <Input
                type='url'
                value={formData.photoURL}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, photoURL: e.target.value }))
                }
                placeholder='Or enter photo URL: https://example.com/photo.jpg'
              />
            </div>
          </div>
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
            placeholder='+234 xxx xxx xxxx'
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
        <div className='flex items-center justify-between'>
          <Label className='text-base font-medium'>User Roles</Label>
          <div className='text-xs text-muted-foreground'>
            Based on Firebase Security Rules
          </div>
        </div>

        <div className='grid grid-cols-2 gap-3'>
          {AVAILABLE_ROLES.map((role) => (
            <div
              key={role}
              className='flex items-center space-x-3 p-4 border rounded-lg hover:bg-muted/50 transition-colors'
            >
              <Checkbox
                id={`role-${role}`}
                checked={formData.roles.includes(role)}
                onCheckedChange={() => handleRoleToggle(role)}
              />
              <div className='flex-1'>
                <div className='flex items-center space-x-2'>
                  <Label
                    htmlFor={`role-${role}`}
                    className='text-sm font-medium cursor-pointer'
                  >
                    {ROLE_DEFINITIONS[role as keyof typeof ROLE_DEFINITIONS]
                      ?.name || role}
                  </Label>
                  <Badge className={`text-xs ${getRoleColor(role)}`}>
                    {role}
                  </Badge>
                </div>
                <p className='text-xs text-muted-foreground mt-1'>
                  {getRoleDescription(role)}
                </p>
              </div>
            </div>
          ))}
        </div>

        {formData.roles.length > 0 && (
          <div className='space-y-2'>
            <Label className='text-sm text-muted-foreground'>
              Selected Roles:
            </Label>
            <div className='flex flex-wrap gap-2'>
              {formData.roles.map((roleName) => (
                <Badge key={roleName} className={getRoleColor(roleName)}>
                  {ROLE_DEFINITIONS[roleName as keyof typeof ROLE_DEFINITIONS]
                    ?.name || roleName}
                </Badge>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className='flex justify-end space-x-3 pt-6 border-t'>
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
