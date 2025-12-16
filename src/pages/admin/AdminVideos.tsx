import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useAdminCheck } from "@/hooks/useAdminCheck";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  Video,
  Play
} from "lucide-react";

interface ExerciseVideo {
  id: string;
  exercise_name: string;
  video_url: string;
  muscle_group: string;
  difficulty_level: string | null;
  environment: string | null;
  created_at: string | null;
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

const DIFFICULTY_LEVELS = [
  { value: "iniciante", label: "Iniciante" },
  { value: "intermediario", label: "Intermediário" },
  { value: "avancado", label: "Avançado" },
  { value: "todos", label: "Todos os níveis" }
];

const ENVIRONMENTS = [
  { value: "casa", label: "Casa" },
  { value: "academia", label: "Academia" },
  { value: "ambos", label: "Ambos" }
];

const isValidYouTubeUrl = (url: string): boolean => {
  const patterns = [
    /^(https?:\/\/)?(www\.)?youtube\.com\/watch\?v=[\w-]+/,
    /^(https?:\/\/)?(www\.)?youtube\.com\/embed\/[\w-]+/,
    /^(https?:\/\/)?(www\.)?youtu\.be\/[\w-]+/,
    /^(https?:\/\/)?(www\.)?youtube\.com\/shorts\/[\w-]+/
  ];
  return patterns.some(pattern => pattern.test(url.trim()));
};

const extractYoutubeId = (url: string): string | null => {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/shorts\/)([^&\s?]+)/
  ];
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match && match[1]) return match[1];
  }
  return null;
};

export default function AdminVideos() {
  const { user, loading: authLoading } = useAuth();
  const { isAdmin, loading: adminLoading } = useAdminCheck();
  const navigate = useNavigate();

  const [videos, setVideos] = useState<ExerciseVideo[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterMuscle, setFilterMuscle] = useState<string>("all");
  const [filterEnvironment, setFilterEnvironment] = useState<string>("all");
  
  // Form state
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingVideo, setEditingVideo] = useState<ExerciseVideo | null>(null);
  const [formData, setFormData] = useState({
    exercise_name: "",
    video_url: "",
    muscle_group: "",
    difficulty_level: "todos",
    environment: "ambos"
  });
  
  // Preview state
  const [previewVideo, setPreviewVideo] = useState<ExerciseVideo | null>(null);
  const [saving, setSaving] = useState(false);
  
  // Delete confirmation
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

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
      fetchVideos();
    }
  }, [isAdmin]);

  const fetchVideos = async () => {
    try {
      const { data, error } = await supabase
        .from("exercise_videos")
        .select("*")
        .order("muscle_group")
        .order("exercise_name");

      if (error) throw error;
      setVideos(data || []);
    } catch (error) {
      console.error("Erro ao buscar vídeos:", error);
      toast.error("Erro ao carregar vídeos");
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (video?: ExerciseVideo) => {
    if (video) {
      setEditingVideo(video);
      setFormData({
        exercise_name: video.exercise_name,
        video_url: video.video_url,
        muscle_group: video.muscle_group,
        difficulty_level: video.difficulty_level || "todos",
        environment: video.environment || "ambos"
      });
    } else {
      setEditingVideo(null);
      setFormData({
        exercise_name: "",
        video_url: "",
        muscle_group: "",
        difficulty_level: "todos",
        environment: "ambos"
      });
    }
    setIsDialogOpen(true);
  };

  const handleSave = async () => {
    if (!formData.exercise_name.trim() || !formData.video_url.trim() || !formData.muscle_group) {
      toast.error("Preencha todos os campos obrigatórios");
      return;
    }

    if (!isValidYouTubeUrl(formData.video_url)) {
      toast.error("URL inválida. Use um link válido do YouTube (youtube.com/watch, youtu.be, ou youtube.com/shorts)");
      return;
    }

    setSaving(true);
    try {
      if (editingVideo) {
        const { error } = await supabase
          .from("exercise_videos")
          .update({
            exercise_name: formData.exercise_name,
            video_url: formData.video_url,
            muscle_group: formData.muscle_group,
            difficulty_level: formData.difficulty_level,
            environment: formData.environment
          })
          .eq("id", editingVideo.id);

        if (error) throw error;
        toast.success("Vídeo atualizado com sucesso");
      } else {
        const { error } = await supabase
          .from("exercise_videos")
          .insert({
            exercise_name: formData.exercise_name,
            video_url: formData.video_url,
            muscle_group: formData.muscle_group,
            difficulty_level: formData.difficulty_level,
            environment: formData.environment
          });

        if (error) throw error;
        toast.success("Vídeo adicionado com sucesso");
      }

      setIsDialogOpen(false);
      fetchVideos();
    } catch (error) {
      console.error("Erro ao salvar vídeo:", error);
      toast.error("Erro ao salvar vídeo");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;

    setDeleting(true);
    try {
      const { error } = await supabase
        .from("exercise_videos")
        .delete()
        .eq("id", deleteId);

      if (error) throw error;
      toast.success("Vídeo removido com sucesso");
      setDeleteId(null);
      fetchVideos();
    } catch (error) {
      console.error("Erro ao deletar vídeo:", error);
      toast.error("Erro ao remover vídeo");
    } finally {
      setDeleting(false);
    }
  };

  const filteredVideos = videos.filter(video => {
    const matchesSearch = video.exercise_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         video.muscle_group.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesMuscle = filterMuscle === "all" || video.muscle_group === filterMuscle;
    const matchesEnvironment = filterEnvironment === "all" || video.environment === filterEnvironment;
    return matchesSearch && matchesMuscle && matchesEnvironment;
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
            <h1 className="text-2xl font-bold text-foreground">Banco de Vídeos</h1>
            <p className="text-muted-foreground">Gerencie os vídeos de exercícios</p>
          </div>
        </div>

        {/* Stats & Actions */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <Card className="w-full sm:w-auto">
            <CardContent className="flex items-center gap-3 py-4">
              <Video className="h-8 w-8 text-primary" />
              <div>
                <p className="text-2xl font-bold">{videos.length}</p>
                <p className="text-sm text-muted-foreground">vídeos cadastrados</p>
              </div>
            </CardContent>
          </Card>

          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => handleOpenDialog()}>
                <Plus className="h-4 w-4 mr-2" />
                Adicionar Vídeo
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>
                  {editingVideo ? "Editar Vídeo" : "Novo Vídeo"}
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="exercise_name">Nome do Exercício *</Label>
                  <Input
                    id="exercise_name"
                    value={formData.exercise_name}
                    onChange={(e) => setFormData({ ...formData, exercise_name: e.target.value })}
                    placeholder="Ex: Supino Reto com Barra"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="video_url">URL do YouTube *</Label>
                  <Input
                    id="video_url"
                    value={formData.video_url}
                    onChange={(e) => setFormData({ ...formData, video_url: e.target.value })}
                    placeholder="https://youtube.com/watch?v=..."
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="muscle_group">Grupo Muscular *</Label>
                  <Select
                    value={formData.muscle_group}
                    onValueChange={(value) => setFormData({ ...formData, muscle_group: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o grupo muscular" />
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

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="difficulty_level">Nível</Label>
                    <Select
                      value={formData.difficulty_level}
                      onValueChange={(value) => setFormData({ ...formData, difficulty_level: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {DIFFICULTY_LEVELS.map((level) => (
                          <SelectItem key={level.value} value={level.value}>
                            {level.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="environment">Ambiente</Label>
                    <Select
                      value={formData.environment}
                      onValueChange={(value) => setFormData({ ...formData, environment: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {ENVIRONMENTS.map((env) => (
                          <SelectItem key={env.value} value={env.value}>
                            {env.label}
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
                    {editingVideo ? "Salvar" : "Adicionar"}
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
              <Select value={filterEnvironment} onValueChange={setFilterEnvironment}>
                <SelectTrigger className="w-full sm:w-40">
                  <SelectValue placeholder="Ambiente" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  {ENVIRONMENTS.map((env) => (
                    <SelectItem key={env.value} value={env.value}>
                      {env.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Videos Table */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">
              {filteredVideos.length} vídeo{filteredVideos.length !== 1 ? "s" : ""} encontrado{filteredVideos.length !== 1 ? "s" : ""}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Exercício</TableHead>
                    <TableHead>Grupo Muscular</TableHead>
                    <TableHead className="hidden md:table-cell">Nível</TableHead>
                    <TableHead className="hidden md:table-cell">Ambiente</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredVideos.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                        Nenhum vídeo encontrado
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredVideos.map((video) => (
                      <TableRow key={video.id}>
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-2">
                            <Video className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                            <span className="truncate max-w-[200px]">{video.exercise_name}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary">
                            {video.muscle_group}
                          </span>
                        </TableCell>
                        <TableCell className="hidden md:table-cell capitalize">
                          {video.difficulty_level === "todos" ? "Todos" : video.difficulty_level || "-"}
                        </TableCell>
                        <TableCell className="hidden md:table-cell capitalize">
                          {video.environment === "ambos" ? "Ambos" : video.environment || "-"}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => setPreviewVideo(video)}
                              title="Preview"
                            >
                              <Play className="h-4 w-4 text-primary" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleOpenDialog(video)}
                              title="Editar"
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => setDeleteId(video.id)}
                              title="Excluir"
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
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
      </div>

      {/* Video Preview Dialog */}
      <Dialog open={!!previewVideo} onOpenChange={() => setPreviewVideo(null)}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Video className="h-5 w-5 text-primary" />
              {previewVideo?.exercise_name}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {previewVideo && extractYoutubeId(previewVideo.video_url) ? (
              <div className="aspect-video w-full rounded-lg overflow-hidden bg-black">
                <iframe
                  src={`https://www.youtube.com/embed/${extractYoutubeId(previewVideo.video_url)}?autoplay=1&rel=0`}
                  title={previewVideo.exercise_name}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  className="w-full h-full"
                />
              </div>
            ) : (
              <div className="aspect-video w-full rounded-lg bg-muted flex items-center justify-center">
                <p className="text-muted-foreground">URL de vídeo inválida</p>
              </div>
            )}
            <div className="flex flex-wrap gap-2">
              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-primary/10 text-primary">
                {previewVideo?.muscle_group}
              </span>
              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-muted text-muted-foreground capitalize">
                {previewVideo?.difficulty_level === "todos" ? "Todos os níveis" : previewVideo?.difficulty_level}
              </span>
              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-muted text-muted-foreground capitalize">
                {previewVideo?.environment === "ambos" ? "Casa/Academia" : previewVideo?.environment}
              </span>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja remover este vídeo? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleting}
              className="bg-destructive hover:bg-destructive/90"
            >
              {deleting ? <LoadingSpinner size="sm" className="mr-2" /> : null}
              Remover
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
