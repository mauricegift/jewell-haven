import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Search, Mail, Phone, Calendar, Eye, Trash2, MessageSquare, User, Clock, Filter, Archive, RefreshCw, X, BarChart3, MailOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AdminLayout } from "./AdminLayout";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { motion, AnimatePresence } from "framer-motion";

interface ContactMessage {
  id: number;
  name: string;
  email: string;
  phone: string;
  subject: string;
  message: string;
  status: "new" | "read" | "replied" | "archived";
  createdAt: string;
  updatedAt: string;
  userId?: number;
  replies: ContactReply[];
}

interface ContactReply {
  id: number;
  contactId: number;
  adminId: number;
  adminName: string;
  message: string;
  createdAt: string;
}

export default function AdminContacts() {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedMessage, setSelectedMessage] = useState<ContactMessage | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [replyOpen, setReplyOpen] = useState(false);
  const [replyMessage, setReplyMessage] = useState("");
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [messageToDelete, setMessageToDelete] = useState<number | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [activeTab, setActiveTab] = useState<string>("all");
  const [stats, setStats] = useState({
    total: 0,
    new: 0,
    read: 0,
    replied: 0,
    archived: 0
  });

  const { data: messages, isLoading, refetch } = useQuery<ContactMessage[]>({
    queryKey: ["/api/admin/contacts"],
  });

  useEffect(() => {
    if (messages) {
      const total = messages.length;
      const newCount = messages.filter(m => m.status === "new").length;
      const readCount = messages.filter(m => m.status === "read").length;
      const repliedCount = messages.filter(m => m.status === "replied").length;
      const archivedCount = messages.filter(m => m.status === "archived").length;
      
      setStats({
        total,
        new: newCount,
        read: readCount,
        replied: repliedCount,
        archived: archivedCount
      });
    }
  }, [messages]);

  const replyMutation = useMutation({
    mutationFn: async ({ contactId, message }: { contactId: number; message: string }) => {
      return apiRequest("POST", `/api/admin/contacts/${contactId}/reply`, { message });
    },
    onSuccess: () => {
      toast({
        title: "Reply sent",
        description: "Your reply has been sent to the user.",
      });
      setReplyMessage("");
      setReplyOpen(false);
      refetch();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to send reply",
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (contactId: number) => {
      return apiRequest("DELETE", `/api/admin/contacts/${contactId}`);
    },
    onSuccess: () => {
      toast({
        title: "Message deleted",
        description: "The contact message has been deleted.",
      });
      setDeleteConfirmOpen(false);
      refetch();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete message",
        variant: "destructive",
      });
    },
  });

  const statusColors: Record<string, { light: string; dark: string }> = {
    new: {
      light: "bg-blue-100 text-blue-800 border-blue-200 hover:bg-blue-200",
      dark: "dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800 dark:hover:bg-blue-900/50"
    },
    read: {
      light: "bg-yellow-100 text-yellow-800 border-yellow-200 hover:bg-yellow-200",
      dark: "dark:bg-yellow-900/30 dark:text-yellow-300 dark:border-yellow-800 dark:hover:bg-yellow-900/50"
    },
    replied: {
      light: "bg-green-100 text-green-800 border-green-200 hover:bg-green-200",
      dark: "dark:bg-green-900/30 dark:text-green-300 dark:border-green-800 dark:hover:bg-green-900/50"
    },
    archived: {
      light: "bg-gray-100 text-gray-800 border-gray-200 hover:bg-gray-200",
      dark: "dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700 dark:hover:bg-gray-700"
    },
  };

  const getStatusColor = (status: string) => {
    const colors = statusColors[status] || statusColors.archived;
    return `${colors.light} ${colors.dark}`;
  };

  const filteredMessages = messages?.filter((msg) => {
    const matchesSearch =
      msg.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      msg.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      msg.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
      msg.message.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || msg.status === statusFilter;
    const matchesTab = activeTab === "all" || msg.status === activeTab;
    
    return matchesSearch && matchesStatus && matchesTab;
  });

  const markAsRead = async (messageId: number) => {
    try {
      await apiRequest("PATCH", `/api/admin/contacts/${messageId}`, { status: "read" });
      toast({
        title: "Message marked as read",
        description: "The message status has been updated.",
      });
      refetch();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update message status",
        variant: "destructive",
      });
    }
  };

  const markAsReplied = async (messageId: number) => {
    try {
      await apiRequest("PATCH", `/api/admin/contacts/${messageId}`, { status: "replied" });
      toast({
        title: "Message marked as replied",
        description: "The message status has been updated.",
      });
      refetch();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update message status",
        variant: "destructive",
      });
    }
  };

  const archiveMessage = async (messageId: number) => {
    try {
      await apiRequest("PATCH", `/api/admin/contacts/${messageId}`, { status: "archived" });
      toast({
        title: "Message archived",
        description: "The message has been moved to archive.",
      });
      refetch();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to archive message",
        variant: "destructive",
      });
    }
  };

  const viewMessageDetails = (message: ContactMessage) => {
    setSelectedMessage(message);
    setDetailsOpen(true);
    // Mark as read when viewing
    if (message.status === "new") {
      markAsRead(message.id);
    }
  };

  const handleReply = () => {
    if (!selectedMessage || !replyMessage.trim()) return;
    
    replyMutation.mutate({
      contactId: selectedMessage.id,
      message: replyMessage,
    });
  };

  const handleDelete = (messageId: number) => {
    setMessageToDelete(messageId);
    setDeleteConfirmOpen(true);
  };

  const confirmDelete = () => {
    if (messageToDelete) {
      deleteMutation.mutate(messageToDelete);
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-4 md:space-y-6 p-4 md:p-6">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
            <div>
              <h1 className="font-serif text-2xl md:text-3xl font-bold text-foreground">Contact Messages</h1>
              <p className="text-sm md:text-base text-muted-foreground">Manage customer inquiries and messages</p>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => refetch()}
                className="gap-2"
              >
                <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                <span className="hidden sm:inline">Refresh</span>
              </Button>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 mb-6">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3, delay: 0.1 }}
            >
              <Card className="hover:shadow-md transition-shadow duration-200 cursor-pointer dark:bg-card dark:hover:bg-accent/30" onClick={() => setActiveTab("all")}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Total</p>
                      <p className="text-2xl font-bold">{stats.total}</p>
                    </div>
                    <div className="p-2 bg-blue-500/10 rounded-lg dark:bg-blue-900/30">
                      <BarChart3 className="h-5 w-5 text-blue-500 dark:text-blue-400" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3, delay: 0.2 }}
            >
              <Card className="hover:shadow-md transition-shadow duration-200 cursor-pointer dark:bg-card dark:hover:bg-accent/30" onClick={() => setActiveTab("new")}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">New</p>
                      <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{stats.new}</p>
                    </div>
                    <div className="p-2 bg-blue-500/10 rounded-lg dark:bg-blue-900/30">
                      <Mail className="h-5 w-5 text-blue-500 dark:text-blue-400" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3, delay: 0.3 }}
            >
              <Card className="hover:shadow-md transition-shadow duration-200 cursor-pointer dark:bg-card dark:hover:bg-accent/30" onClick={() => setActiveTab("read")}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Read</p>
                      <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">{stats.read}</p>
                    </div>
                    <div className="p-2 bg-yellow-500/10 rounded-lg dark:bg-yellow-900/30">
                      <MailOpen className="h-5 w-5 text-yellow-500 dark:text-yellow-400" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3, delay: 0.4 }}
            >
              <Card className="hover:shadow-md transition-shadow duration-200 cursor-pointer dark:bg-card dark:hover:bg-accent/30" onClick={() => setActiveTab("replied")}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Replied</p>
                      <p className="text-2xl font-bold text-green-600 dark:text-green-400">{stats.replied}</p>
                    </div>
                    <div className="p-2 bg-green-500/10 rounded-lg dark:bg-green-900/30">
                      <MessageSquare className="h-5 w-5 text-green-500 dark:text-green-400" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3, delay: 0.5 }}
            >
              <Card className="hover:shadow-md transition-shadow duration-200 cursor-pointer dark:bg-card dark:hover:bg-accent/30" onClick={() => setActiveTab("archived")}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Archived</p>
                      <p className="text-2xl font-bold text-gray-600 dark:text-gray-400">{stats.archived}</p>
                    </div>
                    <div className="p-2 bg-gray-500/10 rounded-lg dark:bg-gray-800">
                      <Archive className="h-5 w-5 text-gray-500 dark:text-gray-400" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
        >
          <Card className="overflow-hidden border shadow-sm dark:bg-card">
            <CardHeader className="p-4 md:p-6 bg-gradient-to-r from-muted/50 to-background dark:from-muted/30 dark:to-background">
              <div className="flex flex-col gap-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search messages by name, email, subject, or content..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 text-sm md:text-base border-input focus:border-primary transition-colors dark:bg-background"
                  />
                </div>

                <div className="flex flex-col sm:flex-row gap-3">
                  <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                    <TabsList className="grid grid-cols-5 h-auto p-1 bg-muted dark:bg-muted/50">
                      <TabsTrigger value="all" className="text-xs py-2 data-[state=active]:bg-background dark:data-[state=active]:bg-accent">
                        All
                      </TabsTrigger>
                      <TabsTrigger value="new" className="text-xs py-2 data-[state=active]:bg-background dark:data-[state=active]:bg-accent">
                        New ({stats.new})
                      </TabsTrigger>
                      <TabsTrigger value="read" className="text-xs py-2 data-[state=active]:bg-background dark:data-[state=active]:bg-accent">
                        Read ({stats.read})
                      </TabsTrigger>
                      <TabsTrigger value="replied" className="text-xs py-2 data-[state=active]:bg-background dark:data-[state=active]:bg-accent">
                        Replied ({stats.replied})
                      </TabsTrigger>
                      <TabsTrigger value="archived" className="text-xs py-2 data-[state=active]:bg-background dark:data-[state=active]:bg-accent">
                        Archived ({stats.archived})
                      </TabsTrigger>
                    </TabsList>
                  </Tabs>

                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-full sm:w-[180px] text-sm bg-background dark:bg-accent">
                      <Filter className="h-4 w-4 mr-2" />
                      <SelectValue placeholder="Status filter" />
                    </SelectTrigger>
                    <SelectContent className="dark:bg-card">
                      <SelectItem value="all" className="text-sm">All Status</SelectItem>
                      <SelectItem value="new" className="text-sm">New</SelectItem>
                      <SelectItem value="read" className="text-sm">Read</SelectItem>
                      <SelectItem value="replied" className="text-sm">Replied</SelectItem>
                      <SelectItem value="archived" className="text-sm">Archived</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-4">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.3, delay: i * 0.1 }}
                    >
                      <Skeleton className="h-16 w-full dark:bg-muted" />
                    </motion.div>
                  ))}
                </div>
              ) : filteredMessages && filteredMessages.length > 0 ? (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="hover:bg-transparent dark:hover:bg-transparent">
                        <TableHead className="hidden sm:table-cell text-sm font-semibold">From</TableHead>
                        <TableHead className="text-sm font-semibold">Subject</TableHead>
                        <TableHead className="hidden md:table-cell text-sm font-semibold">Date</TableHead>
                        <TableHead className="text-sm font-semibold">Status</TableHead>
                        <TableHead className="text-right text-sm font-semibold">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      <AnimatePresence>
                        {filteredMessages.map((message, index) => (
                          <motion.tr
                            key={message.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            transition={{ duration: 0.2, delay: index * 0.05 }}
                            className="hover:bg-accent/50 transition-colors dark:hover:bg-accent/30"
                          >
                            <TableCell className="hidden sm:table-cell">
                              <div>
                                <p className="font-medium text-sm">{message.name}</p>
                                <p className="text-xs text-muted-foreground truncate max-w-[180px]">
                                  {message.email}
                                </p>
                              </div>
                            </TableCell>
                            <TableCell className="max-w-[150px] md:max-w-xs truncate">
                              <div>
                                <p className="truncate text-sm font-medium">{message.subject}</p>
                                <p className="text-xs text-muted-foreground sm:hidden mt-1">
                                  {message.name} • {new Date(message.createdAt).toLocaleDateString()}
                                </p>
                              </div>
                            </TableCell>
                            <TableCell className="hidden md:table-cell text-sm">
                              {new Date(message.createdAt).toLocaleDateString()}
                            </TableCell>
                            <TableCell>
                              <Badge 
                                className={`${getStatusColor(message.status)} text-xs transition-colors hover:scale-105 cursor-pointer`}
                                onClick={() => {
                                  if (message.status === "new") markAsRead(message.id);
                                  else if (message.status === "read") markAsReplied(message.id);
                                  else if (message.status === "replied") archiveMessage(message.id);
                                }}
                              >
                                {message.status.charAt(0).toUpperCase() + message.status.slice(1)}
                                {message.replies?.length > 0 && ` (${message.replies.length})`}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end space-x-1">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => viewMessageDetails(message)}
                                  className="h-8 w-8 hover:bg-blue-50 hover:text-blue-600 dark:hover:bg-blue-900/30 dark:hover:text-blue-400 transition-colors"
                                  title="View details"
                                >
                                  <Eye className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => {
                                    setSelectedMessage(message);
                                    setReplyOpen(true);
                                  }}
                                  className="h-8 w-8 hover:bg-green-50 hover:text-green-600 dark:hover:bg-green-900/30 dark:hover:text-green-400 transition-colors"
                                  title="Reply"
                                >
                                  <MessageSquare className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleDelete(message.id)}
                                  className="h-8 w-8 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/30 dark:hover:text-red-400 transition-colors"
                                  title="Delete"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </motion.tr>
                        ))}
                      </AnimatePresence>
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.3 }}
                  className="text-center py-8 md:py-12 px-4"
                >
                  <Mail className="h-10 w-10 md:h-12 md:w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-base md:text-lg font-medium mb-2">No messages found</h3>
                  <p className="text-sm md:text-base text-muted-foreground mb-4">
                    {searchQuery || statusFilter !== "all" 
                      ? "Try adjusting your search or filter criteria"
                      : "There are no contact messages yet"}
                  </p>
                  {(searchQuery || statusFilter !== "all" || activeTab !== "all") && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSearchQuery("");
                        setStatusFilter("all");
                        setActiveTab("all");
                      }}
                      className="text-sm hover:bg-accent dark:hover:bg-accent/50"
                    >
                      <X className="h-4 w-4 mr-2" />
                      Clear filters
                    </Button>
                  )}
                </motion.div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Message Details Dialog */}
        <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto animate-in fade-in-80 slide-in-from-bottom-4 dark:bg-card">
            <DialogHeader>
              <DialogTitle className="text-lg md:text-xl">Message Details</DialogTitle>
              <DialogDescription className="text-sm md:text-base">
                From: {selectedMessage?.name} &lt;{selectedMessage?.email}&gt;
              </DialogDescription>
            </DialogHeader>
            
            {selectedMessage && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.1 }}
                className="space-y-6"
              >
                {/* Message Info */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-lg bg-gradient-to-r from-muted/50 to-background dark:from-muted/30 dark:to-card">
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-sm">
                      <Calendar className="h-4 w-4 flex-shrink-0 text-blue-500 dark:text-blue-400" />
                      <span className="truncate">
                        Received: {new Date(selectedMessage.createdAt).toLocaleString()}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Phone className="h-4 w-4 flex-shrink-0 text-green-500 dark:text-green-400" />
                      <span className="truncate">Phone: {selectedMessage.phone}</span>
                    </div>
                    {selectedMessage.userId && (
                      <div className="flex items-center gap-2 text-sm">
                        <User className="h-4 w-4 flex-shrink-0 text-purple-500 dark:text-purple-400" />
                        <span className="truncate">User ID: {selectedMessage.userId}</span>
                      </div>
                    )}
                  </div>
                  <div className="flex items-center justify-start sm:justify-end">
                    <Badge className={`${getStatusColor(selectedMessage.status)} text-sm`}>
                      {selectedMessage.status.charAt(0).toUpperCase() + selectedMessage.status.slice(1)}
                    </Badge>
                  </div>
                </div>

                {/* Subject */}
                <div>
                  <h4 className="font-medium mb-2 text-sm md:text-base">Subject</h4>
                  <p className="text-lg break-words font-medium">{selectedMessage.subject}</p>
                </div>

                {/* Message */}
                <div>
                  <h4 className="font-medium mb-2 text-sm md:text-base">Message</h4>
                  <div className="p-4 rounded-lg bg-muted/50 border transition-colors hover:bg-muted/70 dark:bg-muted/30 dark:hover:bg-muted/50">
                    <p className="whitespace-pre-wrap break-words">{selectedMessage.message}</p>
                  </div>
                </div>

                {/* Replies Section */}
                {selectedMessage.replies && selectedMessage.replies.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.2 }}
                  >
                    <h4 className="font-medium mb-2 text-sm md:text-base">Admin Replies ({selectedMessage.replies.length})</h4>
                    <div className="space-y-3">
                      {selectedMessage.replies.map((reply) => (
                        <motion.div 
                          key={reply.id} 
                          className="p-4 rounded-lg bg-gradient-to-r from-blue-50 to-white border border-blue-100 hover:border-blue-200 dark:from-blue-950/30 dark:to-card dark:border-blue-900/50 dark:hover:border-blue-800 transition-colors"
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                        >
                          <div className="flex justify-between items-start mb-2">
                            <div className="flex items-center gap-2">
                              <User className="h-4 w-4 text-blue-500 dark:text-blue-400" />
                              <span className="font-medium text-sm">{reply.adminName}</span>
                            </div>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              <Clock className="h-3 w-3" />
                              {new Date(reply.createdAt).toLocaleString()}
                            </div>
                          </div>
                          <p className="whitespace-pre-wrap break-words text-sm">{reply.message}</p>
                        </motion.div>
                      ))}
                    </div>
                  </motion.div>
                )}

                {/* Actions */}
                <DialogFooter className="flex-col sm:flex-row gap-2 pt-4 border-t dark:border-t-border">
                  <div className="flex flex-col sm:flex-row gap-2 w-full">
                    <Button
                      variant="outline"
                      onClick={() => window.location.href = `mailto:${selectedMessage.email}?subject=Re: ${selectedMessage.subject}`}
                      className="flex-1 sm:flex-none hover:bg-blue-50 hover:text-blue-700 dark:hover:bg-blue-900/30 dark:hover:text-blue-400 transition-colors"
                    >
                      <Mail className="h-4 w-4 mr-2" />
                      Reply via Email
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setSelectedMessage(selectedMessage);
                        setReplyOpen(true);
                      }}
                      className="flex-1 sm:flex-none hover:bg-green-50 hover:text-green-700 dark:hover:bg-green-900/30 dark:hover:text-green-400 transition-colors"
                    >
                      <MessageSquare className="h-4 w-4 mr-2" />
                      Reply Here
                    </Button>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-2 w-full">
                    {selectedMessage.status !== "replied" && (
                      <Button
                        onClick={() => {
                          markAsReplied(selectedMessage.id);
                          setDetailsOpen(false);
                        }}
                        className="flex-1 hover:bg-gradient-to-r hover:from-green-600 hover:to-green-700 transition-all"
                        variant="default"
                      >
                        Mark as Replied
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      onClick={() => {
                        archiveMessage(selectedMessage.id);
                        setDetailsOpen(false);
                      }}
                      className="flex-1 hover:bg-accent dark:hover:bg-accent/50 transition-colors"
                    >
                      <Archive className="h-4 w-4 mr-2" />
                      Archive
                    </Button>
                  </div>
                </DialogFooter>
              </motion.div>
            )}
          </DialogContent>
        </Dialog>

        {/* Reply Dialog */}
        <Dialog open={replyOpen} onOpenChange={setReplyOpen}>
          <DialogContent className="max-w-lg animate-in fade-in-80 slide-in-from-bottom-4 dark:bg-card">
            <DialogHeader>
              <DialogTitle className="text-lg md:text-xl">Reply to {selectedMessage?.name}</DialogTitle>
              <DialogDescription className="text-sm md:text-base">
                Your reply will be saved and visible to the user.
              </DialogDescription>
            </DialogHeader>
            
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.1 }}
              className="space-y-4"
            >
              <div className="space-y-2">
                <label className="text-sm font-medium">Your Reply</label>
                <Textarea
                  placeholder="Type your reply here..."
                  value={replyMessage}
                  onChange={(e) => setReplyMessage(e.target.value)}
                  rows={5}
                  className="min-h-[120px] text-sm focus:ring-2 focus:ring-primary/20 transition-all dark:bg-muted/30"
                />
              </div>
              
              {selectedMessage && (
                <div className="text-sm text-muted-foreground p-3 bg-gradient-to-r from-muted/50 to-background rounded-lg border hover:bg-muted/70 dark:from-muted/30 dark:to-card dark:hover:bg-muted/50 transition-colors">
                  <p className="font-medium mb-1">Original message:</p>
                  <p className="line-clamp-2">{selectedMessage.message}</p>
                </div>
              )}
            </motion.div>
            
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setReplyOpen(false)}
                disabled={replyMutation.isPending}
                className="hover:bg-accent dark:hover:bg-accent/50 transition-colors"
              >
                Cancel
              </Button>
              <Button
                onClick={handleReply}
                disabled={!replyMessage.trim() || replyMutation.isPending}
                className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 transition-all"
              >
                {replyMutation.isPending ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Sending...
                  </>
                ) : "Send Reply"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
          <AlertDialogContent className="animate-in fade-in-80 slide-in-from-bottom-4 dark:bg-card">
            <AlertDialogHeader>
              <AlertDialogTitle className="text-lg">Are you sure?</AlertDialogTitle>
              <AlertDialogDescription className="text-sm">
                This action cannot be undone. This will permanently delete the contact message
                and all associated replies.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel className="hover:bg-accent dark:hover:bg-accent/50 transition-colors">
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={confirmDelete}
                className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white transition-all"
              >
                {deleteMutation.isPending ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Deleting...
                  </>
                ) : "Delete"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </AdminLayout>
  );
}