


import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Shield, Users, Image as ImageIcon, Palette, BarChart3, CheckCircle, XCircle, Clock, Trash2, Ban, UserCheck } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface Statistics {
  totalImages: number;
  totalUsers: number;
  totalArtStyles: number;
  pendingModeration: number;
}

interface Image {
  id: string;
  prompt: string;
  model: string;
  width: number;
  height: number;
  imageData: string;
  artStyle: string;
  userDisplayName: string | null;
  createdAt: string;
  moderationStatus: string;
  likeCount: number;
}

interface UserProfile {
  id: string;
  userId: string;
  displayName: string | null;
  bio: string | null;
  location: string | null;
  website: string | null;
  isBanned: boolean;
  isOnline: boolean;
  lastActiveAt: string | null;
  totalImagesGenerated: number;
  totalImagesSaved: number;
  totalArtStylesCreated: number;
  totalCustomModels: number;
  createdAt: string;
}

interface ArtStyle {
  id: string;
  userId: string;
  name: string;
  description: string | null;
  keywords: string | null;
  createdAt: string;
}

export default function Admin() {
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const [selectedTab, setSelectedTab] = useState("dashboard");

  const { data: isAdminData, isLoading: adminCheckLoading } = useQuery<{ isAdmin: boolean }>({
    queryKey: ["/api/admin/check", user?.email],
    enabled: !!user?.email,
  });

  const { data: statistics, isLoading: statsLoading } = useQuery<Statistics>({
    queryKey: ["/api/admin/statistics"],
    enabled: isAdminData?.isAdmin === true,
  });

  const { data: images, isLoading: imagesLoading } = useQuery<Image[]>({
    queryKey: ["/api/admin/images"],
    enabled: selectedTab === "images" && isAdminData?.isAdmin === true,
  });

  const { data: profiles, isLoading: profilesLoading } = useQuery<UserProfile[]>({
    queryKey: ["/api/admin/user-profiles"],
    enabled: selectedTab === "users" && isAdminData?.isAdmin === true,
  });

  const { data: artStyles, isLoading: artStylesLoading } = useQuery<ArtStyle[]>({
    queryKey: ["/api/admin/art-styles"],
    enabled: selectedTab === "art-styles" && isAdminData?.isAdmin === true,
  });

  const moderationMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      console.log('Updating moderation status:', { id, status });
      const response = await apiRequest("PATCH", `/api/admin/images/${id}/moderation`, { status });
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/images"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/statistics"] });
      toast({
        title: "Success",
        description: "Image moderation status updated",
      });
    },
    onError: (error: Error) => {
      console.error('Moderation error:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to update moderation status",
        variant: "destructive",
      });
    },
  });

  const deleteImageMutation = useMutation({
    mutationFn: async (id: string) => {
      console.log('Deleting image:', id);
      const response = await apiRequest("DELETE", `/api/admin/images/${id}`);
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/images"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/statistics"] });
      toast({
        title: "Success",
        description: "Image deleted successfully",
      });
    },
    onError: (error: Error) => {
      console.error('Delete image error:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to delete image",
        variant: "destructive",
      });
    },
  });

  const deleteUserMutation = useMutation({
    mutationFn: async (userId: string) => {
      console.log('Deleting user:', userId);
      const response = await apiRequest("DELETE", `/api/admin/users/${userId}`);
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/user-profiles"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/statistics"] });
      toast({
        title: "Success",
        description: "User deleted successfully",
      });
    },
    onError: (error: Error) => {
      console.error('Delete user error:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to delete user",
        variant: "destructive",
      });
    },
  });

  const banUserMutation = useMutation({
    mutationFn: async (userId: string) => {
      console.log('Banning user:', userId);
      const response = await apiRequest("PATCH", `/api/admin/users/${userId}/ban`, {});
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/user-profiles"] });
      toast({
        title: "Success",
        description: "User banned successfully",
      });
    },
    onError: (error: Error) => {
      console.error('Ban user error:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to ban user",
        variant: "destructive",
      });
    },
  });

  const unbanUserMutation = useMutation({
    mutationFn: async (userId: string) => {
      console.log('Unbanning user:', userId);
      const response = await apiRequest("PATCH", `/api/admin/users/${userId}/unban`, {});
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/user-profiles"] });
      toast({
        title: "Success",
        description: "User unbanned successfully",
      });
    },
    onError: (error: Error) => {
      console.error('Unban user error:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to unban user",
        variant: "destructive",
      });
    },
  });

  if (authLoading || adminCheckLoading) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <Skeleton className="h-12 w-64" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="container mx-auto p-6">
        <Alert>
          <Shield className="h-4 w-4" />
          <AlertDescription>
            Please log in to access the admin panel.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  if (!isAdminData?.isAdmin) {
    return (
      <div className="container mx-auto p-6">
        <Alert variant="destructive">
          <Shield className="h-4 w-4" />
          <AlertDescription>
            Access denied. You do not have admin privileges.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const getModerationStatusBadge = (status: string) => {
    switch (status) {
      case "approved":
        return <Badge className="bg-green-600" data-testid={`badge-status-approved`}><CheckCircle className="w-3 h-3 mr-1" /> Approved</Badge>;
      case "rejected":
        return <Badge variant="destructive" data-testid={`badge-status-rejected`}><XCircle className="w-3 h-3 mr-1" /> Rejected</Badge>;
      case "pending":
        return <Badge variant="secondary" data-testid={`badge-status-pending`}><Clock className="w-3 h-3 mr-1" /> Pending</Badge>;
      default:
        return <Badge variant="outline" data-testid={`badge-status-${status}`}>{status}</Badge>;
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center gap-3">
        <Shield className="h-8 w-8 text-primary" data-testid="icon-admin-shield" />
        <div>
          <h1 className="text-3xl font-bold" data-testid="text-admin-title">Admin Panel</h1>
          <p className="text-muted-foreground" data-testid="text-admin-subtitle">Manage platform content and users</p>
        </div>
      </div>

      <Tabs value={selectedTab} onValueChange={setSelectedTab}>
        <TabsList className="grid w-full grid-cols-4" data-testid="tabs-admin-navigation">
          <TabsTrigger value="dashboard" data-testid="tab-dashboard">
            <BarChart3 className="w-4 h-4 mr-2" />
            Dashboard
          </TabsTrigger>
          <TabsTrigger value="images" data-testid="tab-images">
            <ImageIcon className="w-4 h-4 mr-2" />
            Images
          </TabsTrigger>
          <TabsTrigger value="users" data-testid="tab-users">
            <Users className="w-4 h-4 mr-2" />
            Users
          </TabsTrigger>
          <TabsTrigger value="art-styles" data-testid="tab-art-styles">
            <Palette className="w-4 h-4 mr-2" />
            Art Styles
          </TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard" className="space-y-6">
          {statsLoading ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <Skeleton className="h-32" />
              <Skeleton className="h-32" />
              <Skeleton className="h-32" />
              <Skeleton className="h-32" />
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <Card data-testid="card-stat-images">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Images</CardTitle>
                  <ImageIcon className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold" data-testid="text-total-images">{statistics?.totalImages || 0}</div>
                  <p className="text-xs text-muted-foreground">Generated by users</p>
                </CardContent>
              </Card>

              <Card data-testid="card-stat-users">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold" data-testid="text-total-users">{statistics?.totalUsers || 0}</div>
                  <p className="text-xs text-muted-foreground">Registered profiles</p>
                </CardContent>
              </Card>

              <Card data-testid="card-stat-art-styles">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Art Styles</CardTitle>
                  <Palette className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold" data-testid="text-total-art-styles">{statistics?.totalArtStyles || 0}</div>
                  <p className="text-xs text-muted-foreground">Custom art styles</p>
                </CardContent>
              </Card>

              <Card data-testid="card-stat-pending">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Pending Review</CardTitle>
                  <Clock className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold" data-testid="text-pending-moderation">{statistics?.pendingModeration || 0}</div>
                  <p className="text-xs text-muted-foreground">Awaiting moderation</p>
                </CardContent>
              </Card>
            </div>
          )}

          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>Common administrative tasks</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button 
                className="w-full justify-start" 
                variant="outline"
                onClick={() => setSelectedTab("images")}
                data-testid="button-view-images"
              >
                <ImageIcon className="w-4 h-4 mr-2" />
                View All Images
              </Button>
              <Button 
                className="w-full justify-start" 
                variant="outline"
                onClick={() => setSelectedTab("users")}
                data-testid="button-view-users"
              >
                <Users className="w-4 h-4 mr-2" />
                Manage Users
              </Button>
              <Button 
                className="w-full justify-start" 
                variant="outline"
                onClick={() => setSelectedTab("art-styles")}
                data-testid="button-view-art-styles"
              >
                <Palette className="w-4 h-4 mr-2" />
                Browse Art Styles
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="images">
          <Card>
            <CardHeader>
              <CardTitle data-testid="text-images-title">Image Management</CardTitle>
              <CardDescription>Review and moderate user-generated images</CardDescription>
            </CardHeader>
            <CardContent>
              {imagesLoading ? (
                <Skeleton className="h-96" />
              ) : images && images.length > 0 ? (
                <ScrollArea className="h-[600px]">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Preview</TableHead>
                        <TableHead>Prompt</TableHead>
                        <TableHead>Model</TableHead>
                        <TableHead>User</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {images.map((image) => (
                        <TableRow key={image.id} data-testid={`row-image-${image.id}`}>
                          <TableCell>
                            <img 
                              src={image.imageData} 
                              alt={image.prompt} 
                              className="w-16 h-16 object-cover rounded"
                              data-testid={`img-preview-${image.id}`}
                            />
                          </TableCell>
                          <TableCell className="max-w-xs truncate" data-testid={`text-prompt-${image.id}`}>
                            {image.prompt}
                          </TableCell>
                          <TableCell data-testid={`text-model-${image.id}`}>{image.model}</TableCell>
                          <TableCell data-testid={`text-user-${image.id}`}>
                            {image.userDisplayName || "Anonymous"}
                          </TableCell>
                          <TableCell>
                            {getModerationStatusBadge(image.moderationStatus)}
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              {image.moderationStatus !== "approved" && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => moderationMutation.mutate({ id: image.id, status: "approved" })}
                                  disabled={moderationMutation.isPending}
                                  data-testid={`button-approve-${image.id}`}
                                >
                                  <CheckCircle className="w-4 h-4" />
                                </Button>
                              )}
                              {image.moderationStatus !== "rejected" && (
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  onClick={() => moderationMutation.mutate({ id: image.id, status: "rejected" })}
                                  disabled={moderationMutation.isPending}
                                  data-testid={`button-reject-${image.id}`}
                                >
                                  <XCircle className="w-4 h-4" />
                                </Button>
                              )}
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => deleteImageMutation.mutate(image.id)}
                                disabled={deleteImageMutation.isPending}
                                data-testid={`button-delete-image-${image.id}`}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </ScrollArea>
              ) : (
                <div className="text-center py-12 text-muted-foreground" data-testid="text-no-images">
                  No images found
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="users">
          <Card>
            <CardHeader>
              <CardTitle data-testid="text-users-title">User Management</CardTitle>
              <CardDescription>View and manage user profiles</CardDescription>
            </CardHeader>
            <CardContent>
              {profilesLoading ? (
                <Skeleton className="h-96" />
              ) : profiles && profiles.length > 0 ? (
                <div className="w-full overflow-x-auto">
                  <Table className="min-w-full">
                    <TableHeader>
                      <TableRow>
                        <TableHead className="min-w-[150px]">Display Name</TableHead>
                        <TableHead className="min-w-[120px]">User ID</TableHead>
                        <TableHead className="min-w-[120px]">Location</TableHead>
                        <TableHead className="min-w-[100px]">Account Status</TableHead>
                        <TableHead className="min-w-[100px]">Online Status</TableHead>
                        <TableHead className="min-w-[100px]">Images</TableHead>
                        <TableHead className="min-w-[100px]">Art Styles</TableHead>
                        <TableHead className="min-w-[100px]">Last Active</TableHead>
                        <TableHead className="min-w-[100px]">Joined</TableHead>
                        <TableHead className="min-w-[200px]">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {profiles.map((profile) => (
                        <TableRow key={profile.id} data-testid={`row-user-${profile.id}`}>
                          <TableCell data-testid={`text-display-name-${profile.id}`}>
                            {profile.displayName || "Not set"}
                          </TableCell>
                          <TableCell className="font-mono text-xs" data-testid={`text-user-id-${profile.id}`}>
                            {profile.userId.substring(0, 8)}...
                          </TableCell>
                          <TableCell data-testid={`text-location-${profile.id}`}>
                            {profile.location || "-"}
                          </TableCell>
                          <TableCell data-testid={`text-account-status-${profile.id}`}>
                            {profile.isBanned ? (
                              <Badge variant="destructive"><Ban className="w-3 h-3 mr-1" /> Banned</Badge>
                            ) : (
                              <Badge className="bg-green-600"><UserCheck className="w-3 h-3 mr-1" /> Active</Badge>
                            )}
                          </TableCell>
                          <TableCell data-testid={`text-online-status-${profile.id}`}>
                            {profile.isOnline ? (
                              <Badge className="bg-green-500"><span className="w-2 h-2 bg-green-200 rounded-full inline-block mr-1"></span> Online</Badge>
                            ) : (
                              <Badge variant="secondary"><span className="w-2 h-2 bg-gray-400 rounded-full inline-block mr-1"></span> Offline</Badge>
                            )}
                          </TableCell>
                          <TableCell data-testid={`text-images-count-${profile.id}`}>
                            {profile.totalImagesGenerated || 0}
                          </TableCell>
                          <TableCell data-testid={`text-art-styles-count-${profile.id}`}>
                            {profile.totalArtStylesCreated || 0}
                          </TableCell>
                          <TableCell data-testid={`text-last-active-${profile.id}`}>
                            {profile.lastActiveAt ? new Date(profile.lastActiveAt).toLocaleDateString() : "-"}
                          </TableCell>
                          <TableCell data-testid={`text-joined-${profile.id}`}>
                            {new Date(profile.createdAt).toLocaleDateString()}
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-2 min-w-max">
                              {profile.isBanned ? (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => unbanUserMutation.mutate(profile.userId)}
                                  disabled={unbanUserMutation.isPending}
                                  data-testid={`button-unban-${profile.id}`}
                                >
                                  <UserCheck className="w-4 h-4" />
                                </Button>
                              ) : (
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  onClick={() => banUserMutation.mutate(profile.userId)}
                                  disabled={banUserMutation.isPending}
                                  data-testid={`button-ban-${profile.id}`}
                                >
                                  <Ban className="w-4 h-4" />
                                </Button>
                              )}
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => deleteUserMutation.mutate(profile.userId)}
                                disabled={deleteUserMutation.isPending}
                                data-testid={`button-delete-user-${profile.id}`}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="text-center py-12 text-muted-foreground" data-testid="text-no-users">
                  No user profiles found
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="art-styles">
          <Card>
            <CardHeader>
              <CardTitle data-testid="text-art-styles-title">Art Styles Management</CardTitle>
              <CardDescription>Browse and manage user-created art styles</CardDescription>
            </CardHeader>
            <CardContent>
              {artStylesLoading ? (
                <Skeleton className="h-96" />
              ) : artStyles && artStyles.length > 0 ? (
                <ScrollArea className="h-[600px]">
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {artStyles.map((style) => (
                      <Card key={style.id} data-testid={`card-art-style-${style.id}`}>
                        <CardHeader>
                          <CardTitle className="text-lg" data-testid={`text-style-name-${style.id}`}>
                            {style.name}
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2">
                          {style.description && (
                            <p className="text-sm text-muted-foreground" data-testid={`text-style-description-${style.id}`}>
                              {style.description}
                            </p>
                          )}
                          {style.keywords && (
                            <div className="flex flex-wrap gap-1">
                              {style.keywords.split(',').map((keyword, idx) => (
                                <Badge key={idx} variant="secondary" className="text-xs">
                                  {keyword.trim()}
                                </Badge>
                              ))}
                            </div>
                          )}
                          <p className="text-xs text-muted-foreground" data-testid={`text-style-created-${style.id}`}>
                            Created: {new Date(style.createdAt).toLocaleDateString()}
                          </p>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </ScrollArea>
              ) : (
                <div className="text-center py-12 text-muted-foreground" data-testid="text-no-art-styles">
                  No art styles found
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
