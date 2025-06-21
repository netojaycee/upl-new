"use client";

import { useState, ChangeEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { UserForm } from "@/components/local/forms/UserForm-new";
import { RoleForm } from "@/components/local/forms/RoleForm";
import { Modal } from "@/components/local/Modal";
import { ConfirmModal } from "@/components/local/ConfirmModal";
import {
  Loader2,
  Circle,
  UserPlus,
  // Shield,
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
  // useRoles,
  useDeleteUser,
  useDeleteRole,
} from "@/lib/firebaseQueries";
import { User } from "@/lib/types";
import {
  // AVAILABLE_ROLES,
  ROLE_DEFINITIONS,
  UserRole,
} from "@/lib/constants/roles";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
// import {
//   Table,
//   TableBody,
//   TableCell,
//   TableHead,
//   TableHeader,
//   TableRow,
// } from "@/components/ui/table";

export default function UsersPage() {
  const [isAddUserModalOpen, setIsAddUserModalOpen] = useState(false);
  const [isAddRoleModalOpen, setIsAddRoleModalOpen] = useState(false);
  const [editUserId, setEditUserId] = useState<string | null>(null);
  const [editRoleId, setEditRoleId] = useState<string | null>(null);
  const [deleteUserId, setDeleteUserId] = useState<string | null>(null);
  const [deleteRoleId, setDeleteRoleId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  // const [isInitializingRoles, setIsInitializingRoles] = useState(false);

  const { data: users = [], isLoading: isUsersLoading } = useUsers();
  // const { data: roles = [], isLoading: isRolesLoading } = useRoles();
  const deleteUserMutation = useDeleteUser();
  const deleteRoleMutation = useDeleteRole();

  const handleSearchChange = (event: ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(event.target.value);
  };

  const filteredUsers = users.filter(
    (user: User) =>
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

  // const handleInitializeRoles = async () => {
  //   setIsInitializingRoles(true);
  //   try {
  //     const response = await fetch("/api/roles/init", {
  //       method: "POST",
  //     });

  //     if (response.ok) {
  //       const result = await response.json();
  //       toast.success(
  //         `Initialized ${result.rolesCreated} default roles successfully`
  //       );
  //       // Refresh the page to reload roles
  //       window.location.reload();
  //     } else {
  //       const error = await response.json();
  //       toast.error(error.error || "Failed to initialize roles");
  //     }
  //   } catch {
  //     toast.error("Failed to initialize roles");
  //   } finally {
  //     setIsInitializingRoles(false);
  //   }
  // };

  const getRoleBadgeColor = (role: string) => {
    const roleKey = role as UserRole;
    return (
      ROLE_DEFINITIONS[roleKey]?.color ||
      "bg-gray-100 text-gray-800 border-gray-300"
    );
  };

  const getRoleDisplayName = (role: string) => {
    const roleKey = role as UserRole;
    return ROLE_DEFINITIONS[roleKey]?.name || role;
  };

  if (isUsersLoading) {
    return (
      <div className='flex justify-center py-8'>
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

  console.log(users);

  return (
    <div className='container mx-auto p-6'>
      <div className='flex justify-between items-center mb-6'>
        <div>
          <h1 className='text-3xl font-bold'>User Management</h1>
          <p className='text-muted-foreground mt-1'>
            Manage users and their roles based on your Firebase security rules
          </p>
        </div>
      </div>

      <Tabs defaultValue='users' className='w-full'>
        <TabsList className='grid w-full grid-cols-1'>
          <TabsTrigger value='users'>
            Users ({filteredUsers.length})
          </TabsTrigger>
          {/* <TabsTrigger value='roles'>
            Available Roles ({AVAILABLE_ROLES.length})
          </TabsTrigger> */}
        </TabsList>

        <TabsContent value='users' className='space-y-4'>
          <div className='flex w-full justify-between items-center gap-4'>
            <Input
              type='text'
              placeholder='Search users by email or name...'
              value={searchQuery}
              onChange={handleSearchChange}
              className='max-w-sm'
            />
            <Button onClick={() => setIsAddUserModalOpen(true)}>
              <UserPlus className='h-4 w-4 mr-2' />
              Add User
            </Button>
          </div>

          {filteredUsers.length === 0 ? (
            <Card>
              <CardContent className='flex flex-col items-center justify-center py-8'>
                <UserPlus className='h-12 w-12 text-muted-foreground mb-4' />
                <h3 className='text-lg font-semibold mb-2'>No users found</h3>
                <p className='text-muted-foreground text-center mb-4'>
                  {searchQuery
                    ? "No users match your search criteria."
                    : "Get started by adding your first user."}
                </p>
                {!searchQuery && (
                  <Button onClick={() => setIsAddUserModalOpen(true)}>
                    <UserPlus className='h-4 w-4 mr-2' />
                    Add Your First User
                  </Button>
                )}
              </CardContent>
            </Card>
          ) : (
            <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-3'>
              {filteredUsers.map((user: User) => (
                <Card
                  key={user.uid}
                  className='relative hover:shadow-lg transition-shadow'
                >
                  <CardHeader className='pb-3'>
                    <div className='flex items-center space-x-3'>
                      <Avatar>
                        <AvatarImage src={user.photoURL} />
                        <AvatarFallback>
                          {user.displayName
                            ? user.displayName
                                .split(" ")
                                .map((n: string) => n[0])
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

                    {user.lastSignIn && (
                      <div className='flex items-center text-xs text-muted-foreground'>
                        <Calendar className='h-3 w-3 mr-1' />
                        Last Sign In:{" "}
                        {new Date(user.lastSignIn).toLocaleDateString()}
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
                              className={`text-xs ${getRoleBadgeColor(role)}`}
                            >
                              {getRoleDisplayName(role)}
                            </Badge>
                          ))
                        ) : (
                          <Badge variant='outline' className='text-xs'>
                            No Roles Assigned
                          </Badge>
                        )}
                      </div>
                    </div>

                    <div className='flex justify-end space-x-2 pt-2 border-t'>
                      <Button
                        size='sm'
                        variant='outline'
                        onClick={() => setEditUserId(user.uid)}
                        title='Edit user'
                      >
                        <Edit className='h-3 w-3' />
                      </Button>
                      <Button
                        size='sm'
                        variant='destructive'
                        onClick={() => setDeleteUserId(user.uid)}
                        title='Delete user'
                      >
                        <Trash2 className='h-3 w-3' />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
{/* 
        <TabsContent value='roles' className='space-y-4'>
          <div className='flex w-full justify-between items-center gap-4'>
            <div>
              <h2 className='text-xl font-semibold'>Role Management</h2>
              <p className='text-sm text-muted-foreground'>
                These roles are defined in your Firebase Security Rules and
                managed in this app.
              </p>
            </div>
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
                Add Custom Role
              </Button>
            </div>
          </div>

          Available Roles from Firebase Rules
          <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-3 mb-6'>
            <h3 className='col-span-full text-lg font-semibold mb-2'>
              Available Roles (Based on Firebase Rules)
            </h3>
            {AVAILABLE_ROLES.map((roleKey) => {
              const role = ROLE_DEFINITIONS[roleKey];
              return (
                <Card key={roleKey} className='border-2'>
                  <CardHeader className='pb-3'>
                    <div className='flex items-center justify-between'>
                      <Badge className={role.color}>{role.name}</Badge>
                      <Shield className='h-5 w-5 text-muted-foreground' />
                    </div>
                  </CardHeader>
                  <CardContent className='space-y-3'>
                    <p className='text-sm text-muted-foreground'>
                      {role.description}
                    </p>
                    <div className='space-y-2'>
                      <div className='text-xs font-medium'>Permissions:</div>
                      <ul className='text-xs text-muted-foreground space-y-1'>
                        {role.permissions.map((permission, index) => (
                          <li key={index} className='flex items-center'>
                            <CheckCircle className='h-3 w-3 mr-1 text-green-500' />
                            {permission}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          Custom Roles from Database
          {roles.length > 0 && (
            <>
              <h3 className='text-lg font-semibold mb-4'>Custom Roles</h3>
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
                        <div className='flex flex-wrap gap-1 max-w-xs'>
                          {role.permissions
                            .slice(0, 3)
                            .map((permission: string) => (
                              <Badge
                                key={permission}
                                variant='outline'
                                className='text-xs'
                              >
                                {permission}
                              </Badge>
                            ))}
                          {role.permissions.length > 3 && (
                            <Badge variant='outline' className='text-xs'>
                              +{role.permissions.length - 3} more
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={role.isSystem ? "default" : "secondary"}
                        >
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
                            title={
                              role.isSystem
                                ? "System roles cannot be edited"
                                : "Edit role"
                            }
                          >
                            <Edit className='h-3 w-3' />
                          </Button>
                          <Button
                            size='sm'
                            variant='destructive'
                            onClick={() => setDeleteRoleId(role.id)}
                            disabled={role.isSystem}
                            title={
                              role.isSystem
                                ? "System roles cannot be deleted"
                                : "Delete role"
                            }
                          >
                            <Trash2 className='h-3 w-3' />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </>
          )}
        </TabsContent> */}
      </Tabs>

      {/* Add User Modal */}
      <Modal
        isOpen={isAddUserModalOpen}
        onClose={() => setIsAddUserModalOpen(false)}
        title='Add New User'
      >
        <UserForm onSuccess={() => setIsAddUserModalOpen(false)} />
      </Modal>

      {/* Edit User Modal */}
      <Modal
        isOpen={!!editUserId}
        onClose={() => setEditUserId(null)}
        title='Edit User'
      >
        {editUserId && (
          <UserForm userId={editUserId} onSuccess={() => setEditUserId(null)} />
        )}
      </Modal>

      {/* Add Role Modal */}
      <Modal
        isOpen={isAddRoleModalOpen}
        onClose={() => setIsAddRoleModalOpen(false)}
        title='Add Custom Role'
      >
        <RoleForm onSuccess={() => setIsAddRoleModalOpen(false)} />
      </Modal>

      {/* Edit Role Modal */}
      <Modal
        isOpen={!!editRoleId}
        onClose={() => setEditRoleId(null)}
        title='Edit Custom Role'
      >
        {editRoleId && (
          <RoleForm roleId={editRoleId} onSuccess={() => setEditRoleId(null)} />
        )}
      </Modal>

      {/* Delete User Confirmation Modal */}
      <ConfirmModal
        isOpen={!!deleteUserId}
        onClose={() => setDeleteUserId(null)}
        onConfirm={handleDeleteUser}
        title='Delete User Account'
        description="Are you sure you want to permanently delete this user? This action cannot be undone and will:

• Remove the user's Firebase Authentication account
• Delete all user data from Firestore
• Prevent the user from signing in again
• Remove their access to all system features

Please confirm this action."
        isLoading={deleteUserMutation.isPending}
        confirmText='Yes, Delete User'
        cancelText='Cancel'
      />

      {/* Delete Role Confirmation Modal */}
      <ConfirmModal
        isOpen={!!deleteRoleId}
        onClose={() => setDeleteRoleId(null)}
        onConfirm={handleDeleteRole}
        title='Delete Custom Role'
        description='Are you sure you want to delete this custom role? This action will:

• Remove the role from the system
• Users with this role will lose associated permissions
• This action cannot be undone

Note: System roles defined in Firebase Rules cannot be deleted.'
        isLoading={deleteRoleMutation.isPending}
        confirmText='Yes, Delete Role'
        cancelText='Cancel'
      />
    </div>
  );
}
