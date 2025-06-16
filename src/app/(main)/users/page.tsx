"use client";

import { useState, ChangeEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { UserForm } from "@/components/local/forms/UserForm";
import { RoleForm } from "@/components/local/forms/RoleForm";
import { Modal } from "@/components/local/Modal";
import { ConfirmModal } from "@/components/local/ConfirmModal";
import {
  Loader2,
  Circle,
  UserPlus,
  Shield,
  Edit,
  Trash2,
  Mail,
  Phone,
  Calendar,
  CheckCircle,
  XCircle,
} from "lucide-react";
import {
  useUsers,
  useRoles,
  useDeleteUser,
  useDeleteRole,
} from "@/lib/firebaseQueries";
import { User as AppUser, Role } from "@/lib/types";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default function UsersPage() {
  const [isAddUserModalOpen, setIsAddUserModalOpen] = useState(false);
  const [isAddRoleModalOpen, setIsAddRoleModalOpen] = useState(false);
  const [editUserId, setEditUserId] = useState<string | null>(null);
  const [editRoleId, setEditRoleId] = useState<string | null>(null);
  const [deleteUserId, setDeleteUserId] = useState<string | null>(null);
  const [deleteRoleId, setDeleteRoleId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const [isInitializingRoles, setIsInitializingRoles] = useState(false);

  const { data: users = [], isLoading: isUsersLoading } = useUsers();
  const { data: roles = [], isLoading: isRolesLoading } = useRoles();
  const deleteUserMutation = useDeleteUser();
  const deleteRoleMutation = useDeleteRole();

  const handleSearchChange = (event: ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(event.target.value);
  };

  const filteredUsers = users.filter(
    (user: AppUser) =>
      user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (user.displayName &&
        user.displayName.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const handleDeleteUser = async () => {
    if (!deleteUserId) return;

    try {
      await deleteUserMutation.mutateAsync(deleteUserId);
      toast.success("User deleted successfully");
      setDeleteUserId(null);
    } catch {
      toast.error("Failed to delete user");
    }
  };

  const handleDeleteRole = async () => {
    if (!deleteRoleId) return;

    try {
      await deleteRoleMutation.mutateAsync(deleteRoleId);
      toast.success("Role deleted successfully");
      setDeleteRoleId(null);
    } catch (error: any) {
      toast.error(error.message || "Failed to delete role");
    }
  };

  const handleInitializeRoles = async () => {
    setIsInitializingRoles(true);
    try {
      const response = await fetch("/api/roles/init", {
        method: "POST",
      });

      if (response.ok) {
        toast.success("Default roles initialized successfully");
        // Refresh roles data
        window.location.reload();
      } else {
        const error = await response.json();
        toast.error(error.error || "Failed to initialize roles");
      }
    } catch {
      toast.error("Failed to initialize roles");
    } finally {
      setIsInitializingRoles(false);
    }
  };

  if (isUsersLoading || isRolesLoading) {
    return (
      <div className='flex justify-center'>
        <div className='relative'>
          <Circle className='h-20 w-20 text-muted-foreground/20 opacity-70 animate-pulse' />
          <Loader2
            className='absolute inset-0 m-auto animate-spin h-10 w-10 text-primary'
            aria-label='Loading'
          />
        </div>
      </div>
    );
  }

  return (
    <div className='container mx-auto p-6'>
      <div className='flex justify-between items-center mb-6'>
        <h1 className='text-3xl font-bold'>User Management</h1>
      </div>

      <Tabs defaultValue='users' className='w-full'>
        <TabsList className='grid w-full grid-cols-2'>
          <TabsTrigger value='users'>Users</TabsTrigger>
          <TabsTrigger value='roles'>Roles</TabsTrigger>
        </TabsList>

        <TabsContent value='users' className='space-y-4'>
          <div className='flex w-full justify-between items-center gap-4'>
            <Input
              type='text'
              placeholder='Search users...'
              value={searchQuery}
              onChange={handleSearchChange}
              className='max-w-sm'
            />
            <Button onClick={() => setIsAddUserModalOpen(true)}>
              <UserPlus className='h-4 w-4 mr-2' />
              Add User
            </Button>
          </div>

          <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-3'>
            {filteredUsers.map((user: AppUser) => (
              <Card key={user.uid} className='relative'>
                <CardHeader className='pb-3'>
                  <div className='flex items-center space-x-3'>
                    <Avatar>
                      <AvatarImage src={user.photoURL} />
                      <AvatarFallback>
                        {user.displayName
                          ? user.displayName
                              .split(" ")
                              .map((n) => n[0])
                              .join("")
                              .toUpperCase()
                          : user.email.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className='flex-1 min-w-0'>
                      <CardTitle className='text-sm font-medium truncate'>
                        {user.displayName || "No Name"}
                      </CardTitle>
                      <div className='flex items-center text-xs text-muted-foreground'>
                        <Mail className='h-3 w-3 mr-1' />
                        <span className='truncate'>{user.email}</span>
                      </div>
                    </div>
                    <div className='flex items-center space-x-1'>
                      {user.emailVerified ? (
                        <div title='Email Verified'>
                          <CheckCircle className='h-4 w-4 text-green-500' />
                        </div>
                      ) : (
                        <div title='Email Not Verified'>
                          <XCircle className='h-4 w-4 text-red-500' />
                        </div>
                      )}
                      {user.disabled && (
                        <div title='Account Disabled'>
                          <XCircle className='h-4 w-4 text-orange-500' />
                        </div>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className='space-y-3'>
                  {user.phoneNumber && (
                    <div className='flex items-center text-xs text-muted-foreground'>
                      <Phone className='h-3 w-3 mr-1' />
                      {user.phoneNumber}
                    </div>
                  )}

                  <div className='flex items-center text-xs text-muted-foreground'>
                    <Calendar className='h-3 w-3 mr-1' />
                    Created: {new Date(user.createdAt).toLocaleDateString()}
                  </div>

                  {user.lastSignInTime && (
                    <div className='flex items-center text-xs text-muted-foreground'>
                      <Calendar className='h-3 w-3 mr-1' />
                      Last Sign In:{" "}
                      {new Date(user.lastSignInTime).toLocaleDateString()}
                    </div>
                  )}

                  <div className='space-y-2'>
                    <div className='text-xs font-medium text-muted-foreground'>
                      Roles:
                    </div>
                    <div className='flex flex-wrap gap-1'>
                      {user.roles.length > 0 ? (
                        user.roles.map((role: string) => (
                          <Badge
                            key={role}
                            variant='secondary'
                            className='text-xs'
                          >
                            {role}
                          </Badge>
                        ))
                      ) : (
                        <Badge variant='outline' className='text-xs'>
                          No Roles
                        </Badge>
                      )}
                    </div>
                  </div>

                  <div className='flex justify-end space-x-2 pt-2'>
                    <Button
                      size='sm'
                      variant='outline'
                      onClick={() => setEditUserId(user.uid)}
                    >
                      <Edit className='h-3 w-3' />
                    </Button>
                    <Button
                      size='sm'
                      variant='destructive'
                      onClick={() => setDeleteUserId(user.uid)}
                    >
                      <Trash2 className='h-3 w-3' />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value='roles' className='space-y-4'>
          <div className='flex w-full justify-between items-center gap-4'>
            <h2 className='text-xl font-semibold'>Role Management</h2>
            <div className='flex space-x-2'>
              {roles.length === 0 && (
                <Button
                  variant='outline'
                  onClick={handleInitializeRoles}
                  disabled={isInitializingRoles}
                >
                  {isInitializingRoles && (
                    <Loader2 className='h-4 w-4 mr-2 animate-spin' />
                  )}
                  Initialize Default Roles
                </Button>
              )}
              <Button onClick={() => setIsAddRoleModalOpen(true)}>
                <Shield className='h-4 w-4 mr-2' />
                Add Role
              </Button>
            </div>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Permissions</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className='text-right'>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {roles.map((role: Role) => (
                <TableRow key={role.id}>
                  <TableCell className='font-medium'>{role.name}</TableCell>
                  <TableCell>{role.description || "-"}</TableCell>
                  <TableCell>
                    <div className='flex flex-wrap gap-1'>
                      {role.permissions.map((permission: string) => (
                        <Badge
                          key={permission}
                          variant='outline'
                          className='text-xs'
                        >
                          {permission}
                        </Badge>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={role.isSystem ? "default" : "secondary"}>
                      {role.isSystem ? "System" : "Custom"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {new Date(role.createdAt).toLocaleDateString()}
                  </TableCell>
                  <TableCell className='text-right'>
                    <div className='flex justify-end space-x-2'>
                      <Button
                        size='sm'
                        variant='outline'
                        onClick={() => setEditRoleId(role.id)}
                        disabled={role.isSystem}
                      >
                        <Edit className='h-3 w-3' />
                      </Button>
                      <Button
                        size='sm'
                        variant='destructive'
                        onClick={() => setDeleteRoleId(role.id)}
                        disabled={role.isSystem}
                      >
                        <Trash2 className='h-3 w-3' />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TabsContent>
      </Tabs>

      {/* Add User Modal */}
      <Modal
        isOpen={isAddUserModalOpen}
        onClose={() => setIsAddUserModalOpen(false)}
        title='Add New User'
      >
        <UserForm
          onSuccess={() => setIsAddUserModalOpen(false)}
          roles={roles}
        />
      </Modal>

      {/* Edit User Modal */}
      <Modal
        isOpen={!!editUserId}
        onClose={() => setEditUserId(null)}
        title='Edit User'
      >
        {editUserId && (
          <UserForm
            userId={editUserId}
            onSuccess={() => setEditUserId(null)}
            roles={roles}
          />
        )}
      </Modal>

      {/* Add Role Modal */}
      <Modal
        isOpen={isAddRoleModalOpen}
        onClose={() => setIsAddRoleModalOpen(false)}
        title='Add New Role'
      >
        <RoleForm onSuccess={() => setIsAddRoleModalOpen(false)} />
      </Modal>

      {/* Edit Role Modal */}
      <Modal
        isOpen={!!editRoleId}
        onClose={() => setEditRoleId(null)}
        title='Edit Role'
      >
        {editRoleId && (
          <RoleForm roleId={editRoleId} onSuccess={() => setEditRoleId(null)} />
        )}
      </Modal>

      {/* Delete User Modal */}
      <ConfirmModal
        isOpen={!!deleteUserId}
        onClose={() => setDeleteUserId(null)}
        onConfirm={handleDeleteUser}
        title='Delete User'
        description="Are you sure you want to delete this user? This action cannot be undone and will permanently remove the user's account and all associated data."
        isLoading={deleteUserMutation.isPending}
        confirmText='Delete User'
      />

      {/* Delete Role Modal */}
      <ConfirmModal
        isOpen={!!deleteRoleId}
        onClose={() => setDeleteRoleId(null)}
        onConfirm={handleDeleteRole}
        title='Delete Role'
        description='Are you sure you want to delete this role? Users with this role will lose their permissions.'
        isLoading={deleteRoleMutation.isPending}
        confirmText='Delete Role'
      />
    </div>
  );
}
