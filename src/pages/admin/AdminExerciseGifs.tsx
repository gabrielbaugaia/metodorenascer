import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useAdminCheck } from "@/hooks/useAdminCheck";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { toast } from "sonner";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { 
  ArrowLeft, 
  Plus, 
  Pencil, 
  Trash2, 
  Search,
  Image,
  CheckCircle,
  XCircle,
  Clock,
  RefreshCw,
  ExternalLink
} from "lucide-react";

interface ExerciseGif {
  id: string;
  exercise_name_pt: string;
  exercise_name_en: string;
  gif_url: string | null;
  muscle_group: string;
  status: "active" | "pending" | "missing";
  api_source: string | null;
  last_checked_at: string | null;
  created_at: string;
}

const MUSCLE_GROUPS = [
  "Peito",
  "Costas",
  "Ombros",
  "Bíceps",
  "Tríceps",
  "Pernas",
  "Glúteos",
  "Abdômen",
  "Core",
  "Cardio",
  "Corpo Inteiro",
  "Mobilidade"
];

const STATUS_OPTIONS = [
  { value: "active", label: "Ativo", color: "bg-green-500" },
  { value: "pending", label: "Pendente", color: "bg-yellow-500" },
  { value: "missing", label: "Faltando", color: "bg-red-500" },
];

export default function AdminExerciseGifs() {
  const { user, loading: authLoading } = useAuth();
  const { isAdmin, loading: adminLoading } = useAdminCheck();
  const navigate = useNavigate();

  const [gifs, setGifs] = useState<ExerciseGif[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterMuscle, setFilterMuscle] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  
  // Form state
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingGif, setEditingGif] = useState<ExerciseGif | null>(null);
  const [formData, setFormData] = useState({
    exercise_name_pt: "",
    exercise_name_en: "",
    gif_url: "",
    muscle_group: "",
    status: "pending" as "active" | "pending" | "missing",
  });
  
  // Preview state
  const [previewGif, setPreviewGif] = useState<ExerciseGif | null>(null);
  const [saving, setSaving] = useState(false);
  
  // Delete confirmation
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Stats
  const [stats, setStats] = useState({ active: 0, pending: 0, missing: 0, total: 0 });

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (!adminLoading && !isAdmin && user) {
      navigate("/dashboard");
    }
  }, [isAdmin, adminLoading, user, navigate]);

  useEffect(() => {
    if (isAdmin) {
      fetchGifs();
    }
  }, [isAdmin]);

  const fetchGifs = async () => {
    try {
      const { data, error } = await supabase
        .from("exercise_gifs")
        .select("*")
        .order("muscle_group")
        .order("exercise_name_pt");

      if (error) throw error;
      
      const gifsData = (data || []) as ExerciseGif[];
      setGifs(gifsData);
      
      // Calculate stats
      const active = gifsData.filter(g => g.status === "active").length;
      const pending = gifsData.filter(g => g.status === "pending").length;
      const missing = gifsData.filter(g => g.status === "missing").length;
      setStats({ active, pending, missing, total: gifsData.length });
    } catch (error) {
      console.error("Erro ao buscar GIFs:", error);
      toast.error("Erro ao carregar GIFs");
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (gif?: ExerciseGif) => {
    if (gif) {
      setEditingGif(gif);
      setFormData({
        exercise_name_pt: gif.exercise_name_pt,
        exercise_name_en: gif.exercise_name_en,
        gif_url: gif.gif_url || "",
        muscle_group: gif.muscle_group,
        status: gif.status,
      });
    } else {
      setEditingGif(null);
      setFormData({
        exercise_name_pt: "",
        exercise_name_en: "",
        gif_url: "",
        muscle_group: "",
        status: "pending",
      });
    }
    setIsDialogOpen(true);
  };

  const handleSave = async () => {
    if (!formData.exercise_name_pt.trim() || !formData.exercise_name_en.trim() || !formData.muscle_group) {
      toast.error("Preencha todos os campos obrigatórios");
      return;
    }

    setSaving(true);
    try {
      const dataToSave = {
        exercise_name_pt: formData.exercise_name_pt.trim(),
        exercise_name_en: formData.exercise_name_en.trim(),
        gif_url: formData.gif_url.trim() || null,
        muscle_group: formData.muscle_group,
        status: formData.gif_url.trim() ? "active" : formData.status,
        last_checked_at: new Date().toISOString(),
      };

      if (editingGif) {
        const { error } = await supabase
          .from("exercise_gifs")
          .update(dataToSave)
          .eq("id", editingGif.id);

        if (error) throw error;
        toast.success("GIF atualizado com sucesso");
      } else {
        const { error } = await supabase
          .from("exercise_gifs")
          .insert(dataToSave);

        if (error) throw error;
        toast.success("Exercício adicionado com sucesso");
      }

      setIsDialogOpen(false);
      fetchGifs();
    } catch (error: any) {
      console.error("Erro ao salvar:", error);
      if (error.code === "23505") {
        toast.error("Já existe um exercício com esse nome");
      } else {
        toast.error("Erro ao salvar");
      }
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;

    setDeleting(true);
    try {
      const { error } = await supabase
        .from("exercise_gifs")
        .delete()
        .eq("id", deleteId);

      if (error) throw error;
      toast.success("Exercício removido com sucesso");
      setDeleteId(null);
      fetchGifs();
    } catch (error) {
      console.error("Erro ao deletar:", error);
      toast.error("Erro ao remover");
    } finally {
      setDeleting(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <Badge className="bg-green-500/20 text-green-600 border-green-500/30"><CheckCircle className="h-3 w-3 mr-1" />Ativo</Badge>;
      case "pending":
        return <Badge className="bg-yellow-500/20 text-yellow-600 border-yellow-500/30"><Clock className="h-3 w-3 mr-1" />Pendente</Badge>;
      case "missing":
        return <Badge className="bg-red-500/20 text-red-600 border-red-500/30"><XCircle className="h-3 w-3 mr-1" />Faltando</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const filteredGifs = gifs.filter(gif => {
    const matchesSearch = 
      gif.exercise_name_pt.toLowerCase().includes(searchTerm.toLowerCase()) ||
      gif.exercise_name_en.toLowerCase().includes(searchTerm.toLowerCase()) ||
      gif.muscle_group.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesMuscle = filterMuscle === "all" || gif.muscle_group === filterMuscle;
    const matchesStatus = filterStatus === "all" || gif.status === filterStatus;
    return matchesSearch && matchesMuscle && matchesStatus;
  });

  if (authLoading || adminLoading || loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/admin")}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Banco de GIFs</h1>
            <p className="text-muted-foreground">Gerencie as demonstrações de exercícios</p>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="flex items-center gap-3 py-4">
              <Image className="h-8 w-8 text-primary" />
              <div>
                <p className="text-2xl font-bold">{stats.total}</p>
                <p className="text-sm text-muted-foreground">Total</p>
              </div>
            </CardContent>
          </Card>
          <Card className="border-green-500/30">
            <CardContent className="flex items-center gap-3 py-4">
              <CheckCircle className="h-8 w-8 text-green-500" />
              <div>
                <p className="text-2xl font-bold text-green-600">{stats.active}</p>
                <p className="text-sm text-muted-foreground">Ativos</p>
              </div>
            </CardContent>
          </Card>
          <Card className="border-yellow-500/30">
            <CardContent className="flex items-center gap-3 py-4">
              <Clock className="h-8 w-8 text-yellow-500" />
              <div>
                <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
                <p className="text-sm text-muted-foreground">Pendentes</p>
              </div>
            </CardContent>
          </Card>
          <Card className="border-red-500/30">
            <CardContent className="flex items-center gap-3 py-4">
              <XCircle className="h-8 w-8 text-red-500" />
              <div>
                <p className="text-2xl font-bold text-red-600">{stats.missing}</p>
                <p className="text-sm text-muted-foreground">Faltando</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Actions */}
        <div className="flex justify-end mb-6">
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => handleOpenDialog()}>
                <Plus className="h-4 w-4 mr-2" />
                Adicionar Exercício
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-lg">
              <DialogHeader>
                <DialogTitle>
                  {editingGif ? "Editar Exercício" : "Novo Exercício"}
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="exercise_name_pt">Nome em Português *</Label>
                  <Input
                    id="exercise_name_pt"
                    value={formData.exercise_name_pt}
                    onChange={(e) => setFormData({ ...formData, exercise_name_pt: e.target.value })}
                    placeholder="Ex: Supino Reto com Barra"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="exercise_name_en">Nome em Inglês *</Label>
                  <Input
                    id="exercise_name_en"
                    value={formData.exercise_name_en}
                    onChange={(e) => setFormData({ ...formData, exercise_name_en: e.target.value })}
                    placeholder="Ex: barbell bench press"
                  />
                  <p className="text-xs text-muted-foreground">
                    Usado para buscar na API ExerciseDB
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="gif_url">URL do GIF (opcional)</Label>
                  <Input
                    id="gif_url"
                    value={formData.gif_url}
                    onChange={(e) => setFormData({ ...formData, gif_url: e.target.value })}
                    placeholder="https://..."
                  />
                  <p className="text-xs text-muted-foreground">
                    Se vazio, o sistema buscará automaticamente na API
                  </p>
                </div>

                {formData.gif_url && (
                  <div className="border rounded-lg p-4 bg-muted/30">
                    <Label className="text-sm mb-2 block">Preview</Label>
                    <img 
                      src={formData.gif_url} 
                      alt="Preview" 
                      className="w-full max-h-48 object-contain rounded"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = "/placeholder.svg";
                      }}
                    />
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="muscle_group">Grupo Muscular *</Label>
                    <Select
                      value={formData.muscle_group}
                      onValueChange={(value) => setFormData({ ...formData, muscle_group: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                      <SelectContent>
                        {MUSCLE_GROUPS.map((group) => (
                          <SelectItem key={group} value={group}>
                            {group}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="status">Status</Label>
                    <Select
                      value={formData.status}
                      onValueChange={(value: "active" | "pending" | "missing") => setFormData({ ...formData, status: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {STATUS_OPTIONS.map((s) => (
                          <SelectItem key={s.value} value={s.value}>
                            {s.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-4">
                  <Button
                    variant="outline"
                    onClick={() => setIsDialogOpen(false)}
                    disabled={saving}
                  >
                    Cancelar
                  </Button>
                  <Button onClick={handleSave} disabled={saving}>
                    {saving ? <LoadingSpinner size="sm" className="mr-2" /> : null}
                    {editingGif ? "Salvar" : "Adicionar"}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <CardContent className="py-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar exercício..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={filterMuscle} onValueChange={setFilterMuscle}>
                <SelectTrigger className="w-full sm:w-48">
                  <SelectValue placeholder="Grupo muscular" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os grupos</SelectItem>
                  {MUSCLE_GROUPS.map((group) => (
                    <SelectItem key={group} value={group}>
                      {group}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-full sm:w-40">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  {STATUS_OPTIONS.map((s) => (
                    <SelectItem key={s.value} value={s.value}>
                      {s.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Table */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">
              {filteredGifs.length} exercício{filteredGifs.length !== 1 ? "s" : ""} encontrado{filteredGifs.length !== 1 ? "s" : ""}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-16">GIF</TableHead>
                    <TableHead>Nome (PT)</TableHead>
                    <TableHead className="hidden md:table-cell">Nome (EN)</TableHead>
                    <TableHead>Grupo</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredGifs.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                        Nenhum exercício encontrado
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredGifs.map((gif) => (
                      <TableRow key={gif.id}>
                        <TableCell>
                          {gif.gif_url ? (
                            <img 
                              src={gif.gif_url} 
                              alt={gif.exercise_name_pt}
                              className="w-12 h-12 object-cover rounded cursor-pointer hover:opacity-80"
                              onClick={() => setPreviewGif(gif)}
                              onError={(e) => {
                                (e.target as HTMLImageElement).src = "/placeholder.svg";
                              }}
                            />
                          ) : (
                            <div className="w-12 h-12 bg-muted rounded flex items-center justify-center">
                              <Image className="h-5 w-5 text-muted-foreground" />
                            </div>
                          )}
                        </TableCell>
                        <TableCell className="font-medium">{gif.exercise_name_pt}</TableCell>
                        <TableCell className="hidden md:table-cell text-muted-foreground text-sm">
                          {gif.exercise_name_en}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{gif.muscle_group}</Badge>
                        </TableCell>
                        <TableCell>{getStatusBadge(gif.status)}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1">
                            {gif.gif_url && (
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => window.open(gif.gif_url!, "_blank")}
                                title="Abrir GIF"
                              >
                                <ExternalLink className="h-4 w-4" />
                              </Button>
                            )}
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleOpenDialog(gif)}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => setDeleteId(gif.id)}
                              className="text-destructive hover:text-destructive"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* Preview Dialog */}
        <Dialog open={!!previewGif} onOpenChange={() => setPreviewGif(null)}>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>{previewGif?.exercise_name_pt}</DialogTitle>
            </DialogHeader>
            {previewGif?.gif_url && (
              <div className="flex justify-center">
                <img 
                  src={previewGif.gif_url} 
                  alt={previewGif.exercise_name_pt}
                  className="max-w-full max-h-[60vh] rounded-lg"
                />
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation */}
        <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
              <AlertDialogDescription>
                Tem certeza que deseja remover este exercício? Esta ação não pode ser desfeita.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={deleting}>Cancelar</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDelete}
                disabled={deleting}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                {deleting ? <LoadingSpinner size="sm" className="mr-2" /> : null}
                Excluir
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}
