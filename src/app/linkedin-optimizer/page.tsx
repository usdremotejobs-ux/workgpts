"use client";

import { useState, useRef, FormEvent } from "react";
import { Upload, FileText, CheckCircle2, AlertCircle, RefreshCw, Sparkles, Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ToolLayout } from "@/components/tool-layout";
import { toast } from "sonner";
import { extractTextFromPDF, parseLinkedInText, ParsedProfile } from "@/lib/linkedin";
import { Card, CardContent, CardTitle, CardHeader } from "@/components/ui/card";
import { useCompletion } from "@ai-sdk/react";
import ReactMarkdown from "react-markdown";

export default function LinkedInOptimizer() {
    const [isDragging, setIsDragging] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [parsedData, setParsedData] = useState<ParsedProfile | null>(null);
    const [targetRole, setTargetRole] = useState("");
    const [copiedSection, setCopiedSection] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const { complete, completion, isLoading } = useCompletion({
        api: "/api/chat",
        streamProtocol: "text",
        body: {
            tool: "linkedin-optimizer",
        },
        onError: (err) => {
            console.error("LinkedIn Optimizer Error:", err);
            toast.error(err.message || "Failed to generate optimization. Please try again.");
        },
    });

    const handleCopy = async (id: string, text: string) => {
        if (!text) return;
        try {
            await navigator.clipboard.writeText(text);
            setCopiedSection(id);
            toast.success("Copied to clipboard!");
            setTimeout(() => setCopiedSection(null), 2000);
        } catch (err) {
            toast.error("Failed to copy. Please try selecting the text manually.");
        }
    };

    // --- Output parsing logic ---
    const extractSection = (content: string, startRegex: RegExp, endRegex?: RegExp) => {
        const startMatch = content.match(startRegex);
        if (!startMatch || startMatch.index === undefined) return "";

        const remainingAfterStart = content.substring(startMatch.index + startMatch[0].length);

        if (endRegex) {
            const endMatch = remainingAfterStart.match(endRegex);
            if (endMatch && endMatch.index !== undefined) {
                return remainingAfterStart.substring(0, endMatch.index).trim();
            }
        }

        return remainingAfterStart.trim();
    };

    const headlinesText = extractSection(completion, /^.*Headlines.*$/im, /^.*About Section.*$/im);
    const aboutText = extractSection(completion, /^.*About Section.*$/im, /^.*Experience Section.*$/im);
    const experienceText = extractSection(completion, /^.*Experience Section.*$/im, /^.*Positioning Diagnosis.*$/im);
    const diagnosisText = extractSection(completion, /^.*Positioning Diagnosis.*$/im);

    const sections = [
        { id: "headlines", title: "🚀 Attention-Grabbing Headlines", content: headlinesText },
        { id: "about", title: "🔥 Magnetic About Section", content: aboutText },
        { id: "experience", title: "💼 Experience Section Rewrite", content: experienceText },
        { id: "diagnosis", title: "📊 Positioning Diagnosis", content: diagnosisText }
    ];

    const hasAnySection = sections.some(s => s.content.length > 0);

    const handleOptimize = async (e: FormEvent) => {
        e.preventDefault();
        if (!parsedData) return;

        let promptText = `TARGET ROLE: ${targetRole || "Infer from profile content"}\n\n`;
        promptText += `--- RAW PROFILE JSON ---\n${JSON.stringify(parsedData, null, 2)}`;

        await complete(promptText);
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
    };

    const processFile = async (file: File) => {
        if (file.type !== "application/pdf") {
            toast.error("Please upload a PDF file.");
            return;
        }

        setIsProcessing(true);
        try {
            const rawText = await extractTextFromPDF(file);
            const data = parseLinkedInText(rawText);
            setParsedData(data);
            toast.success("Profile parsed successfully! (0 AI Credits used)");
        } catch (error) {
            console.error(error);
            toast.error("Failed to parse PDF. Make sure it's a valid LinkedIn export.");
        } finally {
            setIsProcessing(false);
        }
    };

    const handleDrop = async (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);

        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            await processFile(e.dataTransfer.files[0]);
        }
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            await processFile(e.target.files[0]);
        }
    };

    return (
        <ToolLayout
            title="LinkedIn Profile Optimizer"
            description="Upload your LinkedIn PDF. We extract the text locally to save AI credits, then optimize your profile for executive visibility."
        >
            {/* LEFT SIDE: Input & Local Parsing */}
            <div className="flex flex-col space-y-6">
                {!parsedData ? (
                    <div
                        className={`border-2 border-dashed rounded-xl p-12 flex flex-col items-center justify-center text-center transition-colors cursor-pointer ${isDragging ? "border-primary bg-primary/5" : "border-muted-foreground/25 hover:border-primary/50 hover:bg-muted/50"
                            }`}
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        onDrop={handleDrop}
                        onClick={() => fileInputRef.current?.click()}
                    >
                        <input
                            type="file"
                            accept=".pdf"
                            className="hidden"
                            ref={fileInputRef}
                            onChange={handleFileChange}
                        />

                        {isProcessing ? (
                            <>
                                <RefreshCw className="h-10 w-10 text-muted-foreground animate-spin mb-4" />
                                <h3 className="text-lg font-semibold">Extracting local text...</h3>
                                <p className="text-sm text-muted-foreground mt-2">Zero AI credits used.</p>
                            </>
                        ) : (
                            <>
                                <Upload className="h-10 w-10 text-muted-foreground mb-4" />
                                <h3 className="text-lg font-semibold">Click or drag your LinkedIn PDF here</h3>
                                <p className="text-sm text-muted-foreground mt-2">
                                    Go to your LinkedIn Profile → Click "More" → "Save to PDF"
                                </p>
                                <Button variant="secondary" className="mt-6 pointer-events-none">
                                    Select PDF File
                                </Button>
                            </>
                        )}
                    </div>
                ) : (
                    <form onSubmit={handleOptimize} className="space-y-6">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center text-green-600 dark:text-green-500">
                                <CheckCircle2 className="h-5 w-5 mr-2" />
                                <span className="font-medium">Successfully extracted locally</span>
                            </div>
                            <Button variant="outline" size="sm" type="button" onClick={() => { setParsedData(null); }}>
                                <Upload className="mr-2 h-4 w-4" /> Upload Different PDF
                            </Button>
                        </div>

                        <div className="grid gap-4">
                            <Card className="shadow-sm border-primary/20">
                                <CardContent className="pt-6">
                                    <h4 className="text-sm font-semibold text-primary uppercase mb-2">Raw Headline Output</h4>
                                    <p className="text-sm">{parsedData.headline || <span className="text-muted-foreground italic">No headline found</span>}</p>
                                </CardContent>
                            </Card>
                            <Card className="shadow-sm border-primary/20">
                                <CardContent className="pt-6">
                                    <h4 className="text-sm font-semibold text-primary uppercase mb-2">Raw Summary Output</h4>
                                    <p className="text-sm whitespace-pre-wrap">{parsedData.summary || <span className="text-muted-foreground italic">No summary found</span>}</p>
                                </CardContent>
                            </Card>
                            <Card className="shadow-sm border-primary/20 bg-muted/30">
                                <CardContent className="pt-6">
                                    <h4 className="text-sm font-semibold text-primary uppercase mb-2 flex items-center justify-between">
                                        Compressed Experience
                                        <Badge variant="secondary" className="text-xs font-normal">Ready for AI</Badge>
                                    </h4>
                                    <p className="text-xs font-mono bg-background border p-4 rounded-md overflow-y-auto max-h-48 whitespace-pre-wrap">
                                        {parsedData.experience || <span className="text-muted-foreground italic">No experience found</span>}
                                    </p>
                                    <div className="flex items-center text-xs text-muted-foreground mt-3">
                                        <AlertCircle className="h-3 w-3 mr-1 flex-shrink-0" />
                                        <span>Noise (like pagination and dates) has been stripped locally to massively save AI token costs.</span>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Target Role Field */}
                            <div className="pt-2">
                                <label className="text-sm font-medium mb-2 block">What is your Target Role? (Optional)</label>
                                <Input
                                    placeholder="e.g. Senior Frontend Engineer, Product Manager"
                                    value={targetRole}
                                    onChange={(e) => setTargetRole(e.target.value)}
                                    disabled={isLoading}
                                    className="bg-background"
                                />
                                <p className="text-xs text-muted-foreground mt-2">If left blank, DeepSeek will infer it from your profile.</p>
                            </div>
                        </div>

                        <Button
                            size="lg"
                            type="submit"
                            className="w-full shadow-md text-white hover:opacity-90 transition-opacity"
                            style={{ backgroundColor: "#055149" }}
                            disabled={isLoading}
                        >
                            {isLoading ? (
                                <>
                                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                                    Optimizing Profile...
                                </>
                            ) : (
                                <>
                                    <Sparkles className="mr-2 h-4 w-4" />
                                    Optimize Profile with DeepSeek
                                </>
                            )}
                        </Button>
                    </form>
                )}
            </div>

            {/* RIGHT SIDE: Output */}
            <div className="h-full border rounded-xl bg-card shadow-sm flex flex-col relative min-h-[400px] overflow-hidden">
                {!parsedData && !completion ? (
                    <div className="flex-1 flex flex-col items-center justify-center p-6 text-center text-muted-foreground">
                        <FileText className="h-12 w-12 opacity-20 mb-4" />
                        <p>Upload a PDF on the left to begin.</p>
                    </div>
                ) : parsedData && !completion && !isLoading ? (
                    <div className="flex-1 flex flex-col items-center justify-center p-6 text-center text-muted-foreground">
                        <Sparkles className="h-12 w-12 opacity-20 mb-4 text-[#055149]" />
                        <h3 className="font-medium text-foreground mb-2">Ready to Optimize</h3>
                        <p className="max-w-[280px]">Fill in your Target Role and click the button to send the payload to DeepSeek.</p>
                    </div>
                ) : (
                    <div className="flex flex-col h-full bg-slate-50/50 dark:bg-slate-900/20">
                        {/* Header toolbar */}
                        <div className="flex items-center justify-between border-b px-4 py-3 bg-muted/10">
                            <div className="flex items-center space-x-2">
                                <Badge variant="outline" className="text-xs font-normal border-[#055149]/30 text-[#055149] bg-[#055149]/5 dark:border-[#055149] dark:text-[#055149] dark:bg-transparent">
                                    DeepSeek Final Version
                                </Badge>
                                {isLoading && <RefreshCw className="h-3 w-3 animate-spin text-muted-foreground" />}
                            </div>
                        </div>

                        {/* Output Sections */}
                        <div className="flex-1 overflow-y-auto p-4 lg:p-6 space-y-6">
                            {hasAnySection ? (
                                sections.map(section => (
                                    section.content ? (
                                        <div key={section.id} className="bg-background border rounded-xl shadow-sm overflow-hidden flex flex-col">
                                            <div className="bg-muted/30 px-4 py-3 border-b flex items-center justify-between">
                                                <h3 className="font-semibold text-sm">{section.title}</h3>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="h-8 gap-1 text-muted-foreground hover:text-foreground"
                                                    onClick={() => handleCopy(section.id, section.content)}
                                                    disabled={!section.content}
                                                >
                                                    {copiedSection === section.id ? <Check className="h-3.5 w-3.5 text-green-500" /> : <Copy className="h-3.5 w-3.5" />}
                                                    <span className="text-xs">{copiedSection === section.id ? 'Copied' : 'Copy'}</span>
                                                </Button>
                                            </div>
                                            <div className="p-4 prose prose-sm md:prose-base dark:prose-invert max-w-none">
                                                <ReactMarkdown>{section.content}</ReactMarkdown>
                                            </div>
                                        </div>
                                    ) : null
                                ))
                            ) : completion ? (
                                <div className="bg-background border rounded-xl shadow-sm overflow-hidden flex flex-col">
                                    <div className="bg-muted/30 px-4 py-3 border-b flex items-center justify-between">
                                        <h3 className="font-semibold text-sm">Full Output</h3>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="h-8 gap-1 text-muted-foreground hover:text-foreground"
                                            onClick={() => handleCopy("all", completion)}
                                        >
                                            {copiedSection === "all" ? <Check className="h-3.5 w-3.5 text-green-500" /> : <Copy className="h-3.5 w-3.5" />}
                                            <span className="text-xs">{copiedSection === "all" ? 'Copied' : 'Copy'}</span>
                                        </Button>
                                    </div>
                                    <div className="p-4 prose prose-sm md:prose-base dark:prose-invert max-w-none">
                                        <ReactMarkdown>{completion}</ReactMarkdown>
                                    </div>
                                </div>
                            ) : (
                                <div className="text-muted-foreground italic flex justify-center items-center h-full pt-12">
                                    Waiting for DeepSeek to start streaming...
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </ToolLayout>
    );
}
