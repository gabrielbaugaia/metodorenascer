import { ContentBlock } from "./RichTextEditor";
import { FileDown } from "lucide-react";
import { Button } from "@/components/ui/button";

interface BlogPostRendererProps {
  blocks: ContentBlock[];
  onDocumentClick?: (url: string, fileName: string) => void;
}

export function BlogPostRenderer({ blocks, onDocumentClick }: BlogPostRendererProps) {
  const renderBlock = (block: ContentBlock) => {
    switch (block.type) {
      case 'paragraph':
        return (
          <p key={block.id} className="text-foreground leading-relaxed mb-4">
            {block.content}
          </p>
        );
      
      case 'heading1':
        return (
          <h2 key={block.id} className="text-3xl font-bold text-foreground mt-8 mb-4">
            {block.content}
          </h2>
        );
      
      case 'heading2':
        return (
          <h3 key={block.id} className="text-2xl font-semibold text-foreground mt-6 mb-3">
            {block.content}
          </h3>
        );
      
      case 'heading3':
        return (
          <h4 key={block.id} className="text-xl font-medium text-foreground mt-4 mb-2">
            {block.content}
          </h4>
        );
      
      case 'quote':
        return (
          <blockquote 
            key={block.id} 
            className="border-l-4 border-primary pl-4 py-2 my-6 italic text-muted-foreground bg-muted/30 rounded-r-lg"
          >
            {block.content}
          </blockquote>
        );
      
      case 'image':
        return (
          <figure key={block.id} className="my-6">
            <img 
              src={block.url} 
              alt={block.alt || ''} 
              className="w-full rounded-lg shadow-lg"
              loading="lazy"
            />
            {block.caption && (
              <figcaption className="text-center text-sm text-muted-foreground mt-2">
                {block.caption}
              </figcaption>
            )}
          </figure>
        );
      
      case 'youtube':
        return (
          <div key={block.id} className="aspect-video my-6">
            <iframe
              src={block.url}
              className="w-full h-full rounded-lg shadow-lg"
              allowFullScreen
              title="YouTube video"
              loading="lazy"
            />
          </div>
        );
      
      case 'document':
        return (
          <div 
            key={block.id} 
            className="flex items-center gap-4 p-4 my-6 bg-gradient-to-r from-primary/10 to-primary/5 border border-primary/20 rounded-lg cursor-pointer hover:border-primary/40 transition-colors"
            onClick={() => onDocumentClick?.(block.url || '', block.fileName || '')}
          >
            <div className="p-3 bg-primary/20 rounded-lg">
              <FileDown className="h-8 w-8 text-primary" />
            </div>
            <div className="flex-1">
              <p className="font-semibold text-foreground">{block.fileName}</p>
              <p className="text-sm text-muted-foreground">Clique para baixar</p>
            </div>
            <Button variant="outline" size="sm">
              Download
            </Button>
          </div>
        );
      
      case 'list':
        return (
          <ul key={block.id} className="list-disc list-inside space-y-2 my-4 pl-4">
            {block.items?.map((item, i) => (
              <li key={i} className="text-foreground">{item}</li>
            ))}
          </ul>
        );
      
      case 'ordered-list':
        return (
          <ol key={block.id} className="list-decimal list-inside space-y-2 my-4 pl-4">
            {block.items?.map((item, i) => (
              <li key={i} className="text-foreground">{item}</li>
            ))}
          </ol>
        );
      
      default:
        return null;
    }
  };

  return (
    <article className="prose prose-lg dark:prose-invert max-w-none">
      {blocks.map(renderBlock)}
    </article>
  );
}
