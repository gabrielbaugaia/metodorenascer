import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Upload, FileText, Trash2, Loader2 } from "lucide-react";

interface Props {
  clientId: string;
  onAnalyze: (materialIds: string[]) => void;
  analyzing: boolean;
}

interface Material {
  id: string;
  file_name: string;
  file_url: string;
  file_type: string | null;
  file_size: number | null;
  created_at: string;
}

export function MqoMaterialUpload({ clientId, onAnalyze, analyzing }: Props) {
  const [materials, setMaterials] = useState<Material[]>([]);
  const [uploading, setUploading] = useState(false);

  const fetchMaterials = useCallback(async () => {
    const { data } = await supabase
      .from("mqo_materials")
      .select("*")
      .eq("client_id", clientId)
      .order("created_at", { ascending: false });
    if (data) setMaterials(data as Material[]);
  }, [clientId]);

  useEffect(() => { fetchMaterials(); }, [fetchMaterials]);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files?.length) return;
    setUploading(true);

    for (const file of Array.from(files)) {
      const ext = file.name.split(".").pop();
      const path = `${clientId}/${Date.now()}-${file.name}`;

      const { error: uploadError } = await supabase.storage
        .from("mqo-materials")
        .upload(path, file);

      if (uploadError) {
        toast.error(`Erro ao enviar ${file.name}`);
        continue;
      }

      const { data: urlData } = supabase.storage
        .from("mqo-materials")
        .getPublicUrl(path);

      await supabase.from("mqo_materials").insert({
        client_id: clientId,
        file_name: file.name,
        file_url: urlData.publicUrl,
        file_type: ext || null,
        file_size: file.size,
      });
    }

    toast.success("Materiais enviados");
    fetchMaterials();
    setUploading(false);
    e.target.value = "";
  };

  const handleDelete = async (id: string) => {
    await supabase.from("mqo_materials").delete().eq("id", id);
    toast.success("Material removido");
    fetchMaterials();
  };

  return (
    <div className="border border-gray-200 rounded-lg p-5 space-y-4">
      <h3 className="font-bold text-sm uppercase tracking-wider text-gray-500 flex items-center gap-2">
        <div className="w-1 h-4 bg-[#FFC400] rounded-sm" />
        Upload de Materiais
      </h3>

      <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-[#FFC400] transition-colors">
        <input
          type="file"
          multiple
          accept=".pdf,.png,.jpg,.jpeg,.doc,.docx,.xls,.xlsx"
          onChange={handleUpload}
          className="hidden"
          id="mqo-upload"
          disabled={uploading}
        />
        <label htmlFor="mqo-upload" className="cursor-pointer">
          {uploading ? (
            <Loader2 className="mx-auto h-8 w-8 text-[#FFC400] animate-spin" />
          ) : (
            <Upload className="mx-auto h-8 w-8 text-gray-400" />
          )}
          <p className="mt-2 text-sm text-gray-500">
            {uploading ? "Enviando..." : "Clique ou arraste arquivos aqui"}
          </p>
          <p className="text-xs text-gray-400 mt-1">PDFs, imagens, documentos</p>
        </label>
      </div>

      {materials.length > 0 && (
        <div className="space-y-2">
          {materials.map((m) => (
            <div key={m.id} className="flex items-center justify-between bg-gray-50 rounded px-3 py-2 text-sm">
              <div className="flex items-center gap-2">
                <FileText size={14} className="text-[#FFC400]" />
                <span className="truncate max-w-[200px]">{m.file_name}</span>
                <span className="text-xs text-gray-400">
                  {m.file_size ? `${(m.file_size / 1024).toFixed(0)}KB` : ""}
                </span>
              </div>
              <button onClick={() => handleDelete(m.id)} className="text-gray-400 hover:text-red-500">
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="flex gap-2">
        <Button
          onClick={() => onAnalyze(materials.map((m) => m.id))}
          disabled={analyzing || !materials.length}
          className="bg-black text-white hover:bg-gray-800"
        >
          {analyzing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
          Analisar Arquivos
        </Button>
      </div>
    </div>
  );
}
