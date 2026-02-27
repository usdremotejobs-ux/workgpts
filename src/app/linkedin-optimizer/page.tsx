"use client";

import { useState, useRef, useEffect, FormEvent } from "react";
import {
    Upload, FileText, AlertCircle,
    RefreshCw, Copy, Check, CircleCheckBig,
    ExternalLink, CloudUpload, Linkedin,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { extractTextFromPDF, parseLinkedInText, ParsedProfile } from "@/lib/linkedin";
import { useCompletion } from "@ai-sdk/react";
import ReactMarkdown from "react-markdown";

// ── Bullet pre-processor ──────────────────────────────────────────────────
// The AI outputs bullets as inline "•" chars: "Company Role • Point 1 • Point 2"
// This converts them into proper markdown list items so ReactMarkdown renders
// real <li> elements instead of a flat paragraph.
function preprocessBullets(text: string): string {
    return text
        .split("\n")
        .map(line => {
            if (!line.includes(" • ")) return line;
            const [header, ...bullets] = line.split(" • ");
            return [
                header.trim(),
                ...bullets.map(b => `- ${b.trim()}`),
            ].join("\n");
        })
        .join("\n");
}

// ── Section parsing config ──────────────────────────────────────────────────
const OUTPUT_SECTIONS = [
    { id: "headline", regex: /^.*Headlines.*$/im, endRegex: /^.*About Section.*$/im, label: "Your Profile Headline" },
    { id: "about", regex: /^.*About Section.*$/im, endRegex: /^.*Experience Section.*$/im, label: "Your Profile Summary" },
    { id: "experience", regex: /^.*Experience Section.*$/im, endRegex: /^.*Positioning Diagnosis.*$/im, label: "Your Experiences" },
    { id: "diagnosis", regex: /^.*Positioning Diagnosis.*$/im, endRegex: undefined, label: "Positioning Diagnosis" },
] as const;

// ── Component ────────────────────────────────────────────────────────────────
export default function LinkedInOptimizer() {
    const [isDragging, setIsDragging] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [parsedData, setParsedData] = useState<ParsedProfile | null>(null);
    const [targetRole, setTargetRole] = useState("");
    const [copiedSection, setCopiedSection] = useState<string | null>(null);
    const [hasScrolled, setHasScrolled] = useState(false);

    const fileInputRef = useRef<HTMLInputElement>(null);
    const outputRef = useRef<HTMLDivElement>(null);

    const { complete, completion, isLoading } = useCompletion({
        api: "/api/chat",
        streamProtocol: "text",
        body: { tool: "linkedin-optimizer" },
        onError: (err) => toast.error(err.message || "Failed to generate optimisation. Please try again."),
    });

    // Auto-scroll once output first appears
    useEffect(() => {
        if (completion && !hasScrolled && outputRef.current) {
            outputRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
            setHasScrolled(true);
        }
    }, [completion, hasScrolled]);

    // Reset scroll guard when a new optimisation kicks off
    useEffect(() => { if (isLoading) setHasScrolled(false); }, [isLoading]);

    // ── Helpers ────────────────────────────────────────────────────────────
    const handleCopy = async (id: string, text: string) => {
        if (!text) return;
        try {
            await navigator.clipboard.writeText(text);
            setCopiedSection(id);
            toast.success("Copied to clipboard!");
            setTimeout(() => setCopiedSection(null), 2000);
        } catch {
            toast.error("Failed to copy.");
        }
    };

    const extractSection = (content: string, startRegex: RegExp, endRegex?: RegExp) => {
        const startMatch = content.match(startRegex);
        if (!startMatch || startMatch.index === undefined) return "";
        const after = content.substring(startMatch.index + startMatch[0].length);
        if (endRegex) {
            const endMatch = after.match(endRegex);
            if (endMatch?.index !== undefined) return after.substring(0, endMatch.index).trim();
        }
        return after.trim();
    };

    const parsedSections = OUTPUT_SECTIONS.map(s => ({
        ...s,
        content: extractSection(completion, s.regex, s.endRegex),
    }));
    const hasAnySection = parsedSections.some(s => s.content.length > 0);

    // ── Handlers ───────────────────────────────────────────────────────────
    const handleOptimize = async (e: FormEvent) => {
        e.preventDefault();
        if (!parsedData) return;
        const prompt = `TARGET ROLE: ${targetRole || "Infer from profile content"}\n\n--- RAW PROFILE JSON ---\n${JSON.stringify(parsedData, null, 2)}`;
        await complete(prompt);
    };

    const processFile = async (file: File) => {
        if (file.type !== "application/pdf") { toast.error("Please upload a PDF file."); return; }
        setIsProcessing(true);
        try {
            const rawText = await extractTextFromPDF(file);
            setParsedData(parseLinkedInText(rawText));
            toast.success("Profile parsed! (0 AI credits used)");
        } catch {
            toast.error("Failed to parse PDF. Make sure it's a valid LinkedIn export.");
        } finally {
            setIsProcessing(false);
        }
    };

    const handleDrop = async (e: React.DragEvent) => {
        e.preventDefault(); setIsDragging(false);
        if (e.dataTransfer.files?.[0]) await processFile(e.dataTransfer.files[0]);
    };
    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files?.[0]) await processFile(e.target.files[0]);
    };

    // ── Render ─────────────────────────────────────────────────────────────
    return (
        <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-16">

            {/* ── Page header ─────────────────────────────────────────── */}
            <div className="text-center space-y-4 mb-12">
                <Badge
                    variant="secondary"
                    className="px-3 py-1 text-sm transition-colors"
                    style={{ backgroundColor: "#05514918", color: "#055149" }}
                >
                    Linkedin profile Optimizer
                </Badge>
                <h1 className="text-3xl md:text-5xl font-bold tracking-tight leading-tight">
                    Get Found on Linkedin Searches{" "}
                    <span style={{ color: "#055149" }}>&amp; Land More Recruiter Messages</span>
                </h1>
                <p className="max-w-xl mx-auto text-base text-muted-foreground">
                    Upload your LinkedIn profile PDF. We&apos;ll rewrite your headline, about
                    section, and experience with the right keywords and skills – so you
                    show up in more searches.
                </p>
            </div>

            {/* ── Input section (centred, single-column) ──────────────── */}
            <div className="max-w-2xl mx-auto">

                {/* Upload zone */}
                {!parsedData ? (
                    <div
                        className={`border-2 border-dashed rounded-2xl p-12 flex flex-col items-center justify-center text-center transition-all duration-200 cursor-pointer select-none
                            ${isDragging
                                ? "border-[#055149] bg-[#05514908]"
                                : "border-muted-foreground/20 hover:border-[#055149]/40 hover:bg-muted/30"
                            }`}
                        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                        onDragLeave={(e) => { e.preventDefault(); setIsDragging(false); }}
                        onDrop={handleDrop}
                        onClick={() => fileInputRef.current?.click()}
                    >
                        <input type="file" accept=".pdf" className="hidden" ref={fileInputRef} onChange={handleFileChange} />

                        {isProcessing ? (
                            <>
                                <div className="h-14 w-14 rounded-full flex items-center justify-center mb-4" style={{ backgroundColor: "#05514914" }}>
                                    <RefreshCw className="h-7 w-7 animate-spin" style={{ color: "#055149" }} />
                                </div>
                                <p className="font-semibold text-base">Extracting locally…</p>
                                <p className="text-sm text-muted-foreground mt-1">Zero AI credits used.</p>
                            </>
                        ) : (
                            <>
                                <div className="h-14 w-14 rounded-full flex items-center justify-center mb-4" style={{ backgroundColor: "#05514914" }}>
                                    <CloudUpload className="h-7 w-7" style={{ color: "#055149" }} />
                                </div>
                                <p className="font-semibold text-base">Click or drag your LinkedIn PDF</p>
                                <p className="text-sm text-muted-foreground mt-1 max-w-[280px]">Open your profile on desktop -&gt; Click<br />Resources -&gt; Save to PDF</p>
                                <div className="mt-5 flex items-center gap-2 text-xs text-muted-foreground">
                                    <Linkedin className="h-3.5 w-3.5" />
                                    <span>Parsed 100% in your browser — never sent to any server</span>
                                </div>
                            </>
                        )}
                    </div>

                ) : (
                    /* ── Parsed-data form ────────────────────────────── */
                    <form onSubmit={handleOptimize} className="flex flex-col gap-4">

                        {/* Change PDF */}
                        <div className="flex justify-end">
                            <Button variant="outline" size="sm" type="button" onClick={() => setParsedData(null)}>
                                <Upload className="mr-1.5 h-3.5 w-3.5" /> Change PDF
                            </Button>
                        </div>

                        {/* Your Profile Headline */}
                        <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
                            <div className="px-5 py-3 border-b" style={{ backgroundColor: "#05514910" }}>
                                <p className="text-sm font-semibold" style={{ color: "#055149" }}>Your Profile Headline</p>
                            </div>
                            <p className="px-5 py-4 text-sm leading-relaxed">
                                {parsedData.headline || <span className="text-muted-foreground italic">No headline found</span>}
                            </p>
                        </div>

                        {/* Your Profile Summary */}
                        <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
                            <div className="px-5 py-3 border-b" style={{ backgroundColor: "#05514910" }}>
                                <p className="text-sm font-semibold" style={{ color: "#055149" }}>Your Profile Summary</p>
                            </div>
                            <p className="px-5 py-4 text-sm leading-relaxed whitespace-pre-wrap">
                                {parsedData.summary || <span className="text-muted-foreground italic">No summary found</span>}
                            </p>
                        </div>

                        {/* Your Experiences */}
                        <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
                            <div className="px-5 py-3 border-b" style={{ backgroundColor: "#05514910" }}>
                                <p className="text-sm font-semibold" style={{ color: "#055149" }}>Your Experiences</p>
                            </div>
                            <div className="px-5 py-4">
                                <p className="text-sm leading-relaxed whitespace-pre-wrap max-h-44 overflow-y-auto">
                                    {parsedData.experience || <span className="text-muted-foreground italic">No experience found</span>}
                                </p>
                                <p className="text-xs text-muted-foreground mt-3 flex items-center gap-1.5">
                                    <AlertCircle className="h-3 w-3 flex-shrink-0" />
                                    Noise &amp; dates stripped locally to save AI token costs.
                                </p>
                            </div>
                        </div>

                        {/* Target role */}
                        <div>
                            <label className="text-sm font-medium mb-1.5 block">What is your target role</label>
                            <Input
                                placeholder="eg: growth marketer, product designer"
                                value={targetRole}
                                onChange={(e) => setTargetRole(e.target.value)}
                                disabled={isLoading}
                                className="bg-background"
                            />
                        </div>

                        {/* Submit */}
                        <Button
                            size="lg"
                            type="submit"
                            className="w-full text-white hover:opacity-90 transition-opacity"
                            style={{ backgroundColor: "#055149" }}
                            disabled={isLoading}
                        >
                            {isLoading
                                ? <><RefreshCw className="mr-2 h-4 w-4 animate-spin" /> Optimizing Profile…</>
                                : "Optimize my Profile"
                            }
                        </Button>
                    </form>
                )}
            </div>

            {/* ── Output section (full-width, 70 / 30 grid) ──────────── */}
            {(completion || isLoading) && (
                <div ref={outputRef} className="mt-16 scroll-mt-6">
                    <h2 className="text-2xl font-bold mb-6">Final Version</h2>

                    <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_300px] gap-6 items-start">

                        {/* Left — output cards (≈70 %) */}
                        <div className="flex flex-col gap-4">
                            {hasAnySection ? (
                                parsedSections.map(section =>
                                    section.content ? (
                                        <div key={section.id} className="rounded-xl border bg-card shadow-sm overflow-hidden">
                                            {/* Card header */}
                                            <div className="flex items-center justify-between px-5 py-3 border-b" style={{ backgroundColor: "#05514910" }}>
                                                <p className="text-sm font-semibold" style={{ color: "#055149" }}>{section.label}</p>
                                                <button
                                                    onClick={() => handleCopy(section.id, section.content)}
                                                    className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                                                    title="Copy to clipboard"
                                                >
                                                    {copiedSection === section.id
                                                        ? <Check className="h-4 w-4 text-green-600" />
                                                        : <Copy className="h-4 w-4" />
                                                    }
                                                </button>
                                            </div>
                                            {/* Card body */}
                                            <div className="px-5 py-4 prose prose-sm dark:prose-invert max-w-none">
                                                <ReactMarkdown>{preprocessBullets(section.content)}</ReactMarkdown>
                                            </div>
                                        </div>
                                    ) : null
                                )
                            ) : completion ? (
                                /* Fallback: raw dump */
                                <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
                                    <div className="flex items-center justify-between px-5 py-3 border-b" style={{ backgroundColor: "#05514910" }}>
                                        <p className="text-sm font-semibold" style={{ color: "#055149" }}>AI Output</p>
                                        <button
                                            onClick={() => handleCopy("all", completion)}
                                            className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                                        >
                                            {copiedSection === "all" ? <Check className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
                                        </button>
                                    </div>
                                    <div className="px-5 py-4 prose prose-sm dark:prose-invert max-w-none">
                                        <ReactMarkdown>{preprocessBullets(completion)}</ReactMarkdown>
                                    </div>
                                </div>
                            ) : (
                                /* Waiting for first token */
                                <div className="flex items-center gap-2 text-muted-foreground py-16 justify-center">
                                    <div className="flex gap-1 animate-pulse">
                                        <div className="h-2 w-2 bg-current rounded-full" />
                                        <div className="h-2 w-2 bg-current rounded-full" />
                                        <div className="h-2 w-2 bg-current rounded-full" />
                                    </div>
                                    <span className="text-sm">Waiting for AI to start…</span>
                                </div>
                            )}
                        </div>

                        {/* Right — sticky USDRemoteJobs callout (≈30 %) */}
                        <div className="sticky top-8 h-fit">
                            <div className="rounded-xl p-5 flex flex-col gap-4" style={{ backgroundColor: "#055149" }}>
                                <p className="text-white font-semibold text-sm leading-snug">
                                    Find Remote Jobs that pay USD Salary
                                </p>
                                <div className="flex flex-col gap-2.5">
                                    {[
                                        "3X Your Salary for same skill",
                                        "100% Remote Jobs",
                                        "Tech, Marketing & Design Jobs",
                                    ].map(point => (
                                        <span key={point} className="flex items-center gap-2 text-xs text-white/90">
                                            <CircleCheckBig className="h-3.5 w-3.5 flex-shrink-0" />
                                            {point}
                                        </span>
                                    ))}
                                </div>
                                <a
                                    href="https://usdremotejobs.com"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center justify-center gap-1.5 bg-white text-sm font-medium px-4 py-2 rounded-lg transition-opacity hover:opacity-90"
                                    style={{ color: "#055149" }}
                                >
                                    Checkout Jobs <ExternalLink className="h-3.5 w-3.5" />
                                </a>
                            </div>
                        </div>

                    </div>
                </div>
            )}

            {/* Placeholder when PDF not yet uploaded */}
            {!parsedData && !completion && (
                <div className="mt-12 flex flex-col items-center justify-center text-muted-foreground gap-3">
                    <FileText className="h-10 w-10 opacity-20" />
                    <p className="text-sm">Upload your LinkedIn PDF above to get started.</p>
                </div>
            )}
        </div>
    );
}
