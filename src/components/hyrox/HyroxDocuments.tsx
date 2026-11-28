import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Download, Upload } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { useEntitlements } from "@/hooks/useEntitlements";
import { dateBR } from "@/lib/hyrox90";
import type { Program } from "@/hooks/useHyrox90";
import type { Database } from "@/integrations/supabase/types";
type Document = Database["public"]["Tables"]["hyrox_documents"]["Row"];
const categories = {
  anamnese: "Anamnese",
  assessment: "Avaliação física",
  running: "Corrida",
  nutrition: "Plano alimentar",
  guidance: "Orientações do nutricionista",
  historical: "Referência histórica",
  review_photo: "Foto voluntária",
};
export function HyroxDocuments({
  program,
  documents,
  admin,
  refresh,
}: {
  program: Program;
  documents: Document[];
  admin: boolean;
  refresh: () => Promise<void>;
}) {
  const { isFull } = useEntitlements();
  const { user } = useAuth();
  const [busy, setBusy] = useState(false);
  const [title, setTitle] = useState("");
  const [author, setAuthor] = useState("");
  const [date, setDate] = useState("");
  const [category, setCategory] = useState<Document["category"]>("assessment");
  const [file, setFile] = useState<File | null>(null);
  async function upload() {
    if (!user || !file) return;
    if (!admin && !file.type.startsWith("image/"))
      return toast.error("Envie uma foto JPG, PNG ou WEBP.");
    if (
      !["application/pdf", "image/jpeg", "image/png", "image/webp"].includes(
        file.type,
      ) ||
      file.size > 20 * 1024 * 1024
    )
      return toast.error("Envie PDF ou imagem de até 20 MB.");
    if (admin && (!title.trim() || !author.trim()))
      return toast.error("Informe título e autoria do documento.");
    setBusy(true);
    const path = `hyrox/${program.user_id}/${crypto.randomUUID()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, "_")}`;
    try {
      const up = await supabase.storage
        .from("client-documents")
        .upload(path, file, { contentType: file.type });
      if (up.error) throw up.error;
      const { error } = await supabase
        .from("hyrox_documents")
        .insert({
          program_id: program.id,
          storage_path: path,
          title: admin ? title.trim() : "Foto voluntária de acompanhamento",
          author: admin ? author.trim() : "Enviada pelo aluno",
          category: admin ? category : "review_photo",
          document_date: date || null,
        });
      if (error) {
        if (admin)
          await supabase.storage.from("client-documents").remove([path]);
        throw error;
      }
      setFile(null);
      setTitle("");
      await refresh();
      toast.success("Arquivo privado anexado.");
    } catch {
      toast.error("Não foi possível anexar o arquivo.");
    } finally {
      setBusy(false);
    }
  }
  async function open(doc: Document) {
    const tab = window.open("about:blank", "_blank");
    if (tab) tab.opener = null;
    const { data, error } = await supabase.storage
      .from("client-documents")
      .createSignedUrl(doc.storage_path, 120);
    if (error || !data) {
      tab?.close();
      return toast.error("Não foi possível abrir o documento.");
    }
    if (tab) tab.location.href = data.signedUrl;
    else toast.error("Permita abrir documentos em uma nova janela.");
  }
  return (
    <div className="space-y-6">
      <h2 className="section-title">Documentos privados</h2>
      <ul className="divide-y divide-border border-y border-border">
        {documents.map((doc) => (
          <li
            key={doc.id}
            className="py-4 flex flex-col sm:flex-row sm:items-center gap-3"
          >
            <div className="min-w-0 flex-1">
              <p className="font-medium break-words">{doc.title}</p>
              <p className="text-sm text-muted-foreground break-words">
                {categories[doc.category]} · {doc.author}
                {doc.document_date ? ` · ${dateBR(doc.document_date)}` : ""}
              </p>
              {doc.category === "historical" && (
                <p className="text-xs text-muted-foreground mt-1">
                  Referência anterior; não substitui o protocolo aprovado.
                </p>
              )}
            </div>
            <Button
              variant="outline"
              onClick={() => open(doc)}
              className="self-start"
            >
              <Download />
              Abrir original
            </Button>
          </li>
        ))}
      </ul>
      {!documents.length && (
        <p className="text-muted-foreground">Nenhum documento anexado.</p>
      )}
      <section className="space-y-4 border-t border-border pt-6">
        <h3 className="font-medium">
          {admin
            ? "Anexar documento original"
            : "Foto de acompanhamento (opcional)"}
        </h3>
        <div className="grid sm:grid-cols-2 gap-4">
          {admin && (
            <>
              <label className="space-y-2">
                <Label>Título</Label>
                <Input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </label>
              <label className="space-y-2">
                <Label>Autor / profissional responsável</Label>
                <Input
                  value={author}
                  onChange={(e) => setAuthor(e.target.value)}
                />
              </label>
              <label className="space-y-2">
                <Label>Tipo</Label>
                <select
                  className="h-10 w-full border border-input rounded-md bg-background px-3"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                >
                  {Object.entries(categories).map(([k, v]) => (
                    <option key={k} value={k}>
                      {v}
                    </option>
                  ))}
                </select>
              </label>
            </>
          )}
          <label className="space-y-2">
            <Label>Data do documento / foto</Label>
            <Input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </label>
          <label className="space-y-2 min-w-0">
            <Label>Arquivo privado</Label>
            <Input
              key={file ? "selected" : "empty"}
              type="file"
              accept={
                admin
                  ? "application/pdf,image/jpeg,image/png,image/webp"
                  : "image/jpeg,image/png,image/webp"
              }
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            />
          </label>
        </div>
        <Button
          disabled={busy || !file || (!admin && !isFull)}
          onClick={upload}
        >
          <Upload />
          {busy ? "Enviando…" : "Anexar arquivo"}
        </Button>
      </section>
    </div>
  );
}
