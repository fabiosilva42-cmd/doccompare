import { useState, useRef, useCallback } from "react";
import { useNavigate, useLocation } from "react-router";
import { trpc } from "@/providers/trpc";
import { useTranslation } from "@/i18n/LanguageProvider";
import {
  Upload,
  X,
  FileText,
  ArrowRight,
  ArrowLeft,
  ArrowLeftRight,
  Sparkles,
  Lock,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Check,
  CircleDashed,
  FileCheck,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { PageShell } from "@/components/layout/PageShell";
import { PageHeader } from "@/components/phase2/PageHeader";

function getLucideIcon(name: string) {
  try {
    const icons = require("lucide-react");
    return icons[name] || FileText;
  } catch {
    return FileText;
  }
}

// Gerador de ID compatível com HTTP (não seguro) — crypto.randomUUID() requer HTTPS
function generateId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 9)}`;
}

type TipoDocumento =
  | "order_details"
  | "foto"
  | "die_cut"
  | "briefing"
  | "artwork"
  | "contraprova"
  | "relatorio_inspecao"
  | "packing_list"
  | "commercial_invoice"
  | "bill_of_lading"
  | "outro";

const DOC_TYPE_VALUES: TipoDocumento[] = [
  "order_details", "die_cut", "foto", "commercial_invoice", "relatorio_inspecao",
  "briefing", "artwork", "contraprova", "packing_list", "bill_of_lading", "outro",
];

type FileItem = {
  id: string;
  file: File;
  nome: string;
  tamanho: number;
  tipo: string;
  base64: string;
  tipoDocumento: TipoDocumento;
};

type UploadStatus = "pending" | "uploading" | "done" | "error";

type FileUploadState = {
  id: string;
  nome: string;
  status: UploadStatus;
  progress: number;
};

export default function NovaComparacao() {
  const { t, locale } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const tipoPreSelecionado = (location.state as { tipoSelecionado?: string })?.tipoSelecionado;

  const [step, setStep] = useState(1);
  const [files, setFiles] = useState<FileItem[]>([]);
  const [selectedTipo, setSelectedTipo] = useState<string | null>(tipoPreSelecionado || null);
  const [codigoPedido, setCodigoPedido] = useState("");
  const [nomePedido, setNomePedido] = useState("");
  const [executando, setExecutando] = useState(false);
  const [error, setError] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const [uploadStates, setUploadStates] = useState<FileUploadState[]>([]);
  const [uploadPhase, setUploadPhase] = useState<"idle" | "creating" | "uploading" | "analyzing" | "done">("idle");

  const { data: promptsList } = trpc.prompt.list.useQuery();
  const utils = trpc.useUtils();

  const pedidoCreateMutation = trpc.pedido.create.useMutation();
  const comparacaoCreateMutation = trpc.comparacao.create.useMutation();
  const uploadMutation = trpc.upload.register.useMutation();
  const executarMutation = trpc.comparacao.executar.useMutation();

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  /**
   * Sugere o tipo de documento baseado no nome do arquivo
   */
  function sugerirTipoDocumento(nome: string): TipoDocumento {
    const lower = nome.toLowerCase();
    const ext = lower.split(".").pop() || "";

    if (lower.includes("order") && lower.includes("detail")) return "order_details";
    if (lower.includes("od") && (ext === "xlsx" || ext === "xls" || ext === "csv")) return "order_details";
    if (ext === "xlsx" || ext === "xls" || ext === "csv") return "order_details";

    if (lower.includes("die") || lower.includes("cut") || lower.includes("knife") || lower.includes("structural") || lower.includes("molde")) return "die_cut";

    if (ext === "jpg" || ext === "jpeg" || ext === "png" || ext === "webp" || ext === "tiff") return "foto";
    if (lower.includes("foto") || lower.includes("photo") || lower.includes("image") || lower.includes("picture")) return "foto";

    if (lower.includes("po") || lower.includes("purchase") || lower.includes("ordem") || lower.includes("compra") || lower.includes("pi")) return "commercial_invoice";

    if (lower.includes("inspection") || lower.includes("inspecao") || lower.includes("report") || lower.includes("relatorio")) return "relatorio_inspecao";

    if (lower.includes("briefing") || lower.includes("brief")) return "briefing";
    if (lower.includes("artwork") || lower.includes("art")) return "artwork";
    if (lower.includes("contra") || lower.includes("proof") || lower.includes("prova")) return "contraprova";
    if (lower.includes("packing") || lower.includes("packlist")) return "packing_list";
    if (lower.includes("bl") || lower.includes("lading")) return "bill_of_lading";

    return "outro";
  }

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        const base64 = result.split(",")[1];
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const processFiles = async (fileList: FileList) => {
    const newFiles: FileItem[] = [];
    for (const file of Array.from(fileList)) {
      const base64 = await fileToBase64(file);
      newFiles.push({
        id: generateId(),
        file,
        nome: file.name,
        tamanho: file.size,
        tipo: file.type || "application/octet-stream",
        base64,
        tipoDocumento: sugerirTipoDocumento(file.name),
      });
    }
    setFiles((prev) => [...prev, ...newFiles]);
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files) {
      processFiles(e.dataTransfer.files);
    }
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      processFiles(e.target.files);
    }
  };

  const removeFile = (id: string) => {
    setFiles((prev) => prev.filter((f) => f.id !== id));
  };

  const handleExecutar = async () => {
    if (!selectedTipo) {
      setError(t("comparison.selectAnalysisError"));
      return;
    }
    if (files.length < 1) {
      setError(t("comparison.minFilesError"));
      return;
    }

    setExecutando(true);
    setError("");
    setUploadPhase("creating");

    setUploadStates(
      files.map((f) => ({ id: f.id, nome: f.nome, status: "pending" as UploadStatus, progress: 0 }))
    );

    try {
      const prompt = promptsList?.find((p) => p.slug === selectedTipo);
      if (!prompt) throw new Error("Prompt nao encontrado");

      const codigo = codigoPedido || `PED-${Date.now()}`;
      const nome = nomePedido || `Pedido ${prompt.nome} - ${new Date().toLocaleDateString(locale === "pt" ? "pt-BR" : "en-US")}`;
      const { id: pedidoId } = await pedidoCreateMutation.mutateAsync({
        codigoPedido: codigo,
        nome,
        faseAtual: prompt.departamento as "atendimento" | "design" | "cq",
      });

      setUploadPhase("uploading");

      for (const f of files) {
        setUploadStates((prev) => prev.map((s) => s.id === f.id ? { ...s, status: "uploading", progress: 30 } : s));
        await uploadMutation.mutateAsync({
          pedidoId,
          files: [{ nomeOriginal: f.nome, mimeType: f.tipo, tamanhoBytes: f.tamanho, base64: f.base64, tipoDocumento: f.tipoDocumento, tipoEmbalagem: "nao_aplicavel" as const }],
        });
        setUploadStates((prev) => prev.map((s) => s.id === f.id ? { ...s, status: "done", progress: 100 } : s));
      }

      setUploadPhase("analyzing");
      const { uuid: comparacaoUuid } = await comparacaoCreateMutation.mutateAsync({
        pedidoId, departamento: prompt.departamento, promptId: prompt.id,
      });
      await executarMutation.mutateAsync({ comparacaoUuid });

      setUploadPhase("done");
      utils.pedido.list.invalidate();
      navigate(`/resultado/${comparacaoUuid}`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Erro desconhecido";
      setError(msg);
      setUploadStates((prev) => prev.map((s) => s.status === "uploading" ? { ...s, status: "error" } : s));
      setUploadPhase("idle");
      setExecutando(false);
    }
  };

  const steps = [
    { num: 1, label: t("comparison.stepDocuments") },
    { num: 2, label: t("comparison.stepType") },
    { num: 3, label: t("comparison.stepExecute") },
  ];

  return (
    <PageShell width="wide">
      <PageHeader
        badge={t("comparison.workflow")}
        title={t("comparison.title")}
        subtitle={t("comparison.subtitle")}
        icon={ArrowLeftRight}
      />

      {/* Stepper */}
      <div className="flex items-center gap-2 rounded-2xl border-2 border-slate-300 bg-slate-50/80 p-3 sm:p-4">
        {steps.map((s, i) => (
          <div key={s.num} className="flex min-w-0 flex-1 items-center gap-2">
            <div className={cn(
              "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-sm font-bold transition-all duration-200 sm:h-9 sm:w-9",
              step === s.num ? "bg-slate-900 text-white" :
              step > s.num ? "bg-emerald-600 text-white" : "border-2 border-slate-300 bg-white text-slate-400"
            )}>
              {step > s.num ? <CheckCircle2 className="h-4 w-4" /> : s.num}
            </div>
            <span className={cn("hidden truncate text-sm font-semibold transition-colors sm:block", step === s.num ? "text-slate-900" : "text-slate-400")}>
              {s.label}
            </span>
            {i < 2 && (
              <div className={cn("mx-1 h-[2px] flex-1 rounded-full transition-colors duration-200", step > s.num ? "bg-emerald-500" : "bg-slate-200")} />
            )}
          </div>
        ))}
      </div>

      {/* Error */}
      {error && (
        <Card className="mb-6 border-red-200 bg-red-50/70">
          <CardContent className="p-4 flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
            <div>
              <p className="text-sm font-semibold text-red-700">{t("common.error")}</p>
              <p className="text-xs text-red-600">{error}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 1: Upload */}
      {step === 1 && (
        <div className="space-y-6">
          <Card className={cn(
            "border-2 border-dashed rounded-2xl p-12 text-center cursor-pointer transition-all duration-300",
            isDragging ? "border-sky-500 bg-sky-50/50 scale-[1.01] shadow-lg shadow-sky-500/10" : "border-slate-300 bg-slate-50/50 hover:border-sky-400 hover:bg-sky-50/30"
          )} onDragOver={handleDragOver} onDragLeave={handleDragLeave} onDrop={handleDrop} onClick={() => fileInputRef.current?.click()}>
            <input ref={fileInputRef} type="file" multiple accept=".txt,.pdf,.doc,.docx,.xls,.xlsx,.csv,.json,.md" onChange={handleFileSelect} className="hidden" />
            <div className="w-16 h-16 rounded-2xl bg-white shadow-sm flex items-center justify-center mx-auto mb-4">
              <Upload className={cn("w-7 h-7", isDragging ? "text-sky-500" : "text-slate-400")} />
            </div>
            <p className="text-sm font-semibold text-slate-700 mb-1">{t("comparison.dropTitle")}</p>
            <p className="text-xs text-slate-400">{t("comparison.dropHint")}</p>
            {files.length > 0 && (
              <p className="text-xs text-sky-600 font-semibold mt-2 bg-sky-50 inline-block px-3 py-1 rounded-full">
                {t("comparison.filesSelected", { count: files.length })}
              </p>
            )}
          </Card>

          {files.length > 0 && (
            <div className="space-y-2">
              {files.map((file) => (
                <Card key={file.id} className="border-2 border-slate-300 shadow-sm hover:border-sky-500 transition-all duration-200 group">
                  <CardContent className="p-3 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-sky-50 to-slate-100 flex items-center justify-center flex-shrink-0">
                      <FileText className="w-4 h-4 text-sky-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-slate-900 truncate">{file.nome}</p>
                      <p className="text-xs text-slate-500">{formatFileSize(file.tamanho)}</p>
                    </div>
                    <Select
                      value={file.tipoDocumento}
                      onValueChange={(val) => {
                        setFiles((prev) =>
                          prev.map((f) =>
                            f.id === file.id ? { ...f, tipoDocumento: val as TipoDocumento } : f
                          )
                        );
                      }}
                    >
                      <SelectTrigger className="w-[180px] h-8 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {DOC_TYPE_VALUES.map((value) => (
                          <SelectItem key={value} value={value} className="text-xs">
                            {t(`comparison.docTypes.${value}`)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg hover:bg-red-50 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity" onClick={(e) => { e.stopPropagation(); removeFile(file.id); }}>
                      <X className="w-4 h-4" />
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          <div className="flex justify-end">
            <Button onClick={() => setStep(2)} disabled={files.length < 1} className="bg-sky-700 hover:bg-sky-800 text-white rounded-xl px-6 h-11 font-semibold shadow-lg shadow-sky-500/15 transition-all hover:scale-[1.02] active:scale-[0.98]">
              {t("common.next")} <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </div>
      )}

      {/* Step 2: Select Type */}
      {step === 2 && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {promptsList?.map((tipo) => {
              const Icon = getLucideIcon(tipo.icone);
              const isSelected = selectedTipo === tipo.slug;
              return (
                <Card key={tipo.id} onClick={() => setSelectedTipo(tipo.slug)} className={cn(
                  "cursor-pointer transition-all duration-300",
                  isSelected ? "border-sky-500 bg-sky-50/50 shadow-lg shadow-sky-500/10 ring-1 ring-sky-500" : "border-2 border-slate-300 shadow-sm hover:border-sky-300 hover:shadow-md hover:-translate-y-0.5"
                )}>
                  <CardContent className="p-5">
                    <div className="flex items-start gap-4">
                      <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 transition-all", isSelected ? "bg-sky-600 shadow-lg shadow-sky-500/20" : "bg-slate-100")}>
                        <Icon className={cn("w-5 h-5", isSelected ? "text-white" : "text-slate-600")} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="font-semibold text-sm text-slate-900">{tipo.nome}</p>
                          <Badge variant={tipo.badge === "PRO" ? "default" : "outline"} className="text-[10px] font-semibold">{tipo.badge}</Badge>
                        </div>
                        <p className="text-xs text-slate-500 leading-relaxed">{tipo.descricao}</p>
                        {isSelected && (
                          <div className="flex items-center gap-1.5 mt-2 text-sky-600">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span className="text-xs font-semibold">{t("comparison.selected")}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          <div className="flex justify-between">
            <Button variant="outline" onClick={() => setStep(1)} className="rounded-xl h-11">
              <ArrowLeft className="w-4 h-4 mr-2" /> {t("common.back")}
            </Button>
            <Button onClick={() => setStep(3)} disabled={!selectedTipo} className="bg-sky-700 hover:bg-sky-800 text-white rounded-xl px-6 h-11 font-semibold shadow-lg shadow-sky-500/15 transition-all hover:scale-[1.02] active:scale-[0.98]">
              {t("common.next")} <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </div>
      )}

      {/* Step 3: Confirm & Execute */}
      {step === 3 && (
        <div className="space-y-6">
          <Card className="border-2 border-slate-300 shadow-sm">
            <CardContent className="p-5 space-y-4">
              <div className="flex items-center gap-2 mb-1">
                <FileCheck className="w-4 h-4 text-sky-600" />
                <h3 className="font-semibold text-slate-900">{t("comparison.orderData")}</h3>
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider mb-2 block">{t("comparison.orderCode")}</label>
                <input type="text" value={codigoPedido} onChange={(e) => setCodigoPedido(e.target.value)} placeholder="Ex: SAT11675-25"
                  className="w-full px-4 py-2.5 border-2 border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent bg-slate-50/50 transition-all" />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider mb-2 block">{t("comparison.orderName")} <span className="text-slate-400 font-normal normal-case">({t("common.optional")})</span></label>
                <input type="text" value={nomePedido} onChange={(e) => setNomePedido(e.target.value)} placeholder="Ex: LED Mirror Inner Box"
                  className="w-full px-4 py-2.5 border-2 border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent bg-slate-50/50 transition-all" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-2 border-slate-300 shadow-sm">
            <CardContent className="p-5 space-y-4">
              <h3 className="font-semibold text-slate-900 flex items-center gap-2">
                <Zap className="w-4 h-4 text-amber-500" />
                {t("comparison.summary")}
              </h3>
              <div className="space-y-3">
                <div>
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">{t("comparison.documents")} ({files.length})</p>
                  <div className="space-y-1.5">
                    {files.map((f, i) => (
                      <div key={f.id} className="flex items-center gap-2 text-sm bg-slate-50 rounded-lg px-3 py-2">
                        <FileText className="w-4 h-4 text-slate-400" />
                        <span className="text-slate-700">{i + 1}. {f.nome}</span>
                        <span className="text-xs text-slate-400 ml-auto">{formatFileSize(f.tamanho)}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="border-t border-slate-100 pt-3">
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">{t("comparison.analysisType")}</p>
                  <div className="flex items-center gap-3">
                    {(() => {
                      const tipo = promptsList?.find((t: any) => t.slug === selectedTipo);
                      if (!tipo) return null;
                      const Icon = getLucideIcon(tipo.icone);
                      return (
                        <>
                          <div className="w-10 h-10 rounded-lg bg-sky-50 flex items-center justify-center">
                            <Icon className="w-4 h-4 text-sky-600" />
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-slate-900">{tipo.nome}</p>
                            <div className="flex items-center gap-1.5 mt-0.5">
                              <Lock className="w-3 h-3 text-slate-400" />
                              <span className="text-xs text-slate-500">{t("comparison.protectedPrompt")}</span>
                            </div>
                          </div>
                        </>
                      );
                    })()}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="flex items-start gap-3 p-4 bg-gradient-to-r from-sky-50 to-blue-50 rounded-xl border border-sky-100">
            <Sparkles className="w-5 h-5 text-sky-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-sky-800">{t("comparison.avgTime")}</p>
              <p className="text-xs text-sky-600 mt-0.5">{t("comparison.avgTimeHint")}</p>
            </div>
          </div>

          {/* Progress Panel */}
          {executando && (
            <Card className="border-sky-200 bg-sky-50/30 shadow-sm">
              <CardContent className="p-5">
                <div className="flex items-center gap-3 mb-4">
                  <Loader2 className="w-5 h-5 animate-spin text-sky-600" />
                  <div>
                    <p className="text-sm font-semibold text-slate-900">
                      {uploadPhase === "creating" && t("comparison.creatingOrder")}
                      {uploadPhase === "uploading" && t("comparison.uploading")}
                      {uploadPhase === "analyzing" && t("comparison.analyzing")}
                      {uploadPhase === "done" && t("comparison.redirecting")}
                    </p>
                    <p className="text-xs text-slate-500">{t("comparison.uploadedOf", { done: uploadStates.filter((s) => s.status === "done").length, total: uploadStates.length })}</p>
                  </div>
                </div>
                <div className="mb-4">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs text-slate-500 font-medium">{t("comparison.uploadedOf", { done: uploadStates.filter((s) => s.status === "done").length, total: uploadStates.length })}</span>
                    <span className="text-xs text-sky-600 font-bold">{Math.round(uploadStates.length > 0 ? (uploadStates.filter((s) => s.status === "done").length / uploadStates.length) * 100 : 0)}%</span>
                  </div>
                  <div className="w-full h-2.5 bg-sky-200/40 rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-sky-500 to-sky-600 rounded-full transition-all duration-500 ease-out"
                      style={{ width: `${uploadStates.length > 0 ? (uploadStates.filter((s) => s.status === "done").length / uploadStates.length) * 100 : 0}%` }} />
                  </div>
                </div>
                <div className="space-y-2">
                  {uploadStates.map((s) => (
                    <div key={s.id} className="flex items-center justify-between px-3 py-2 bg-white rounded-lg border border-slate-100">
                      <div className="flex items-center gap-2 min-w-0">
                        <FileText className="w-4 h-4 text-slate-400 flex-shrink-0" />
                        <span className="text-xs text-slate-700 truncate">{s.nome}</span>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        {s.status === "pending" && <CircleDashed className="w-4 h-4 text-slate-300" />}
                        {s.status === "uploading" && <Loader2 className="w-4 h-4 animate-spin text-sky-500" />}
                        {s.status === "done" && <Check className="w-4 h-4 text-emerald-500" />}
                        {s.status === "error" && <AlertCircle className="w-4 h-4 text-red-500" />}
                        <span className="text-[10px] text-slate-400 uppercase font-medium">
                          {s.status === "pending" ? t("comparison.waiting") : s.status === "uploading" ? t("comparison.uploadingStatus") : s.status === "done" ? t("comparison.done") : t("common.error")}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          <div className="flex justify-between">
            <Button variant="outline" onClick={() => setStep(2)} disabled={executando} className="rounded-xl h-11">
              <ArrowLeft className="w-4 h-4 mr-2" /> {t("common.back")}
            </Button>
            <Button onClick={handleExecutar} disabled={executando} className="bg-sky-700 hover:bg-sky-800 text-white rounded-xl px-8 h-11 font-semibold shadow-xl shadow-sky-500/15 transition-all hover:scale-[1.02] active:scale-[0.98]">
              {executando ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> {t("common.processing")}</> : <><Sparkles className="w-4 h-4 mr-2" /> {t("comparison.execute")}</>}
            </Button>
          </div>
        </div>
      )}
    </PageShell>
  );
}
