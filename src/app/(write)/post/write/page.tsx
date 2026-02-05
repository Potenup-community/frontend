'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, Bold, Italic, Heading1, Heading2, Heading3, Quote, Code, Image as ImageIcon, Link as LinkIcon, List, Eye, Edit3 } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkBreaks from 'remark-breaks';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneLight } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import { API_BASE_URL } from '@/lib/constants';
import { useQueryClient } from '@tanstack/react-query';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';
import { Header } from '@/components/layout/Header';
import { v4 as uuidv4 } from 'uuid';

const TOPIC_OPTIONS = [
  { value: 'KNOWLEDGE', label: '지식줍줍' },
  { value: 'EMPLOYMENT_TIP', label: '취업팁' },
  { value: 'SMALL_TALK', label: '자유게시판' },
];

export default function PostWrite() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const isMobile = useIsMobile();
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState<'write' | 'preview'>('write');
  
  const [topic, setTopic] = useState('');
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [draftId] = useState(() => uuidv4());

  const resolveImageSrc = (src: string) => {
    if (!src) return '';
    if (src.startsWith('data:') || src.startsWith('blob:')) return src;
    const apiIndex = src.indexOf('/api/v1/');
    if (apiIndex !== -1) return src.slice(apiIndex);
    if (src.startsWith('http://') || src.startsWith('https://')) {
      try {
        const url = new URL(src);
        return `/api/v1${url.pathname}${url.search}`;
      } catch {
        return src;
      }
    }
    if (src.startsWith('/api/')) return src;
    if (src.startsWith('/files/')) return `${API_BASE_URL}${src}`;
    if (src.startsWith('files/')) return `${API_BASE_URL}/${src}`;
    return src;
  };

  const insertMarkdown = (prefix: string, suffix: string = '') => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = textarea.value;
    const selectedText = text.substring(start, end);

    const newText = text.substring(0, start) + prefix + selectedText + suffix + text.substring(end);
    setContent(newText);
    
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + prefix.length + selectedText.length + suffix.length, start + prefix.length + selectedText.length + suffix.length);
    }, 0);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const toastId = toast.loading('이미지 업로드 중...');

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('draftId', draftId);

      const response = await api.upload<{ url: string; relativePath?: string }>('/files/upload', formData);
      const markdownSrc = response.url || response.relativePath;
      insertMarkdown(`![${file.name}](${markdownSrc})`);
      toast.success('이미지가 업로드되었습니다.', { id: toastId });
    } catch (error) {
      console.error('Image upload failed:', error);
      toast.error('이미지 업로드에 실패했습니다.', { id: toastId });
    } finally {
      if (e.target) {
        e.target.value = '';
      }
    }
  };

  const handleSubmit = async () => {
    if (!topic) {
      toast.error('카테고리를 선택해주세요.');
      return;
    }
    if (!title.trim()) {
      toast.error('제목을 입력해주세요.');
      return;
    }
    if (!content.trim()) {
      toast.error('내용을 입력해주세요.');
      return;
    }

    setIsSubmitting(true);

    try {
      const response: any = await api.post('/posts', {
        draftId,
        topic,
        title: title.trim(),
        content: content.trim(),
      });
      
      queryClient.invalidateQueries({ queryKey: ['posts'] });
      queryClient.invalidateQueries({ queryKey: ['my-posts'] });
      
      toast.success('게시글이 작성되었습니다!');
      
      // Extract post ID from Location header or response
      // The API returns 201 Created with Location header usually, 
      // but api.post returns JSON body.
      // If the response body is empty (201), we might need to rely on list refresh or just go to home.
      // The spec says "Response 201 ... Content {}" and "Header Location".
      // Our api client handles 201 by returning {}.
      // We can't access headers easily with the current api client wrapper unless we modify it.
      // For now, let's redirect to home or dashboard. 
      // Ideally, we should redirect to the new post, but without the ID it's hard.
      // Let's assume for now we go to home.
      
      router.push('/'); 
    } catch (error) {
      console.error('Post creation failed:', error);
      toast.error('게시글 작성에 실패했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-background overflow-hidden">
      {/* Global Site Header */}
      <Header />

      {/* Write Actions Bar */}
      <div className="flex items-center justify-between px-6 py-3 border-b bg-card/50 backdrop-blur-sm">
        <div className="flex items-center gap-4">
          <Select value={topic} onValueChange={setTopic}>
            <SelectTrigger className="w-[160px] h-9 bg-background border-border shadow-none font-medium">
              <SelectValue placeholder="카테고리 선택" />
            </SelectTrigger>
            <SelectContent>
              {TOPIC_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          {isMobile && (
            <div className="flex bg-muted rounded-lg p-1">
              <button
                onClick={() => setActiveTab('write')}
                className={cn(
                  "px-3 py-1.5 text-xs font-semibold rounded-md transition-all flex items-center gap-1.5",
                  activeTab === 'write' ? "bg-background shadow-sm text-primary" : "text-muted-foreground"
                )}
              >
                <Edit3 className="h-3.5 w-3.5" />
                작성
              </button>
              <button
                onClick={() => setActiveTab('preview')}
                className={cn(
                  "px-3 py-1.5 text-xs font-semibold rounded-md transition-all flex items-center gap-1.5",
                  activeTab === 'preview' ? "bg-background shadow-sm text-primary" : "text-muted-foreground"
                )}
              >
                <Eye className="h-3.5 w-3.5" />
                미리보기
              </button>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          <Button 
            variant="ghost" 
            onClick={() => router.back()} 
            disabled={isSubmitting}
            className="text-muted-foreground hover:text-foreground"
          >
            취소
          </Button>
          <Button 
            variant="linearPrimary"
            onClick={handleSubmit} 
            disabled={isSubmitting} 
            className="font-semibold px-5"
          >
            {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : '출간하기'}
          </Button>
        </div>
      </div>

      {/* Main Editor Body */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left: Editor Area */}
        <div className={cn(
          "flex-1 flex flex-col h-full bg-background border-r border-border/60",
          isMobile && activeTab === 'preview' && "hidden"
        )}>
          {/* Toolbar */}
          <div className="px-6 md:px-12 py-1.5 flex items-center gap-0.5 flex-wrap bg-background/50 border-b border-dashed border-border/40">
            <ToolbarButton icon={Heading1} onClick={() => insertMarkdown('# ')} tooltip="대제목" />
            <ToolbarButton icon={Heading2} onClick={() => insertMarkdown('## ')} tooltip="중제목" />
            <ToolbarButton icon={Heading3} onClick={() => insertMarkdown('### ')} tooltip="소제목" />
            <div className="w-px h-4 bg-border/60 mx-1.5" />
            <ToolbarButton icon={Bold} onClick={() => insertMarkdown('**', '**')} tooltip="볼드" />
            <ToolbarButton icon={Italic} onClick={() => insertMarkdown('*', '*')} tooltip="이탤릭" />
            <ToolbarButton icon={Quote} onClick={() => insertMarkdown('> ')} tooltip="인용구" />
            <div className="w-px h-4 bg-border/60 mx-1.5" />
            <ToolbarButton icon={Code} onClick={() => insertMarkdown('```\n', '\n```')} tooltip="코드블럭" />
            <ToolbarButton icon={LinkIcon} onClick={() => insertMarkdown('[', '](url)')} tooltip="링크" />
            <ToolbarButton icon={ImageIcon} onClick={() => fileInputRef.current?.click()} tooltip="이미지 업로드" />
            <div className="w-px h-4 bg-border/60 mx-1.5" />
            <ToolbarButton icon={List} onClick={() => insertMarkdown('- ')} tooltip="리스트" />
          </div>

          <input 
            type="file" 
            ref={fileInputRef} 
            className="hidden" 
            accept="image/*" 
            onChange={handleImageUpload} 
          />

          <div className="flex-1 flex flex-col px-6 md:px-12 py-8 overflow-y-auto">
            <input
              placeholder="제목을 입력하세요"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full text-4xl font-bold bg-transparent border-none outline-none placeholder:text-muted-foreground/30 mb-8"
            />
            <textarea
              ref={textareaRef}
              placeholder="당신의 이야기를 마크다운으로 적어보세요..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="flex-1 w-full resize-none border-none outline-none bg-transparent text-lg leading-relaxed font-mono placeholder:text-muted-foreground/30 min-h-[500px]"
            />
          </div>
        </div>

        {/* Right: Preview Area */}
        <div className={cn(
          "flex-1 h-full overflow-y-auto bg-muted/20 p-6 md:px-16 md:py-12",
          isMobile && activeTab === 'write' && "hidden"
        )}>
          <div className="prose prose-slate max-w-none dark:prose-invert prose-headings:font-bold prose-h1:text-4xl prose-h2:text-3xl prose-p:text-lg prose-p:leading-relaxed">
            <h1 className="mb-8 text-4xl font-bold break-words">{title || "제목 없음"}</h1>
            {content ? (
              <ReactMarkdown
                remarkPlugins={[remarkGfm, remarkBreaks]}
                urlTransform={(value) => value} // Allow blob: and data: URLs
                components={{
                  code({ node, inline, className, children, ...props }: any) {
                    const match = /language-(\w+)/.exec(className || '');
                    return !inline && match ? (
                      <SyntaxHighlighter
                        style={oneLight}
                        language={match[1]}
                        PreTag="div"
                        {...props}
                      >
                        {String(children).replace(/\n$/, '')}
                      </SyntaxHighlighter>
                    ) : (
                      <code className={className} {...props}>
                        {children}
                      </code>
                    );
                  },
                  img: ({ src, alt, ...props }: any) => {
                    if (!src) return null;
                    const resolvedSrc = resolveImageSrc(src);
                    console.log('[Image Debug] raw:', src, '→ resolved:', resolvedSrc);
                    return (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={resolvedSrc}
                        alt={alt}
                        className="rounded-lg shadow-sm border border-border/50 max-h-[500px] object-contain my-4"
                        onError={(e) => {
                          console.error('[Image Error] Failed to load:', resolvedSrc, 'original:', src);
                          (e.target as HTMLImageElement).style.display = 'none';
                        }}
                        {...props} 
                      />
                    );
                  }
                }}
              >
                {content}
              </ReactMarkdown>
            ) : (
              <div className="text-muted-foreground/30 italic flex items-center gap-2">
                <Eye className="h-5 w-5" />
                여기에 미리보기가 표시됩니다.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function ToolbarButton({ icon: Icon, onClick, tooltip }: { icon: any, onClick: () => void, tooltip: string }) {

  return (

    <button

      onClick={onClick}

      className="p-1.5 text-muted-foreground/70 hover:text-orange-500 hover:bg-orange-50/50 rounded-md transition-all active:scale-95"

      title={tooltip}

    >

      <Icon className="h-4 w-4" />

    </button>

  );

}
