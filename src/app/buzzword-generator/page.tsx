"use client";

import { useState } from "react";
import { useCompletion } from "@ai-sdk/react";
import { Copy, RefreshCw, Sparkles, Check, CircleCheckBig, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ToolLayout } from "@/components/tool-layout";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// "Best for" metadata per tab
const BEST_FOR: Record<string, string[]> = {
    professional: ["Daily or Weekly Updates", "Client Reporting", "Resume Bullet Points"],
    performance: ["Appraisals & Reviews", "Promotion Discussions", "Bonus Justification"],
    executive: ["Director-Level Positioning", "Board Decks", "Leadership Bios"],
};

export default function BuzzwordGenerator() {
    const [copiedTab, setCopiedTab] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState("professional");

    const { completion, input, handleInputChange, handleSubmit, isLoading } = useCompletion({
        api: "/api/chat",
        streamProtocol: "text",
        body: { tool: "buzzword-generator" },
        onError: (error: Error) => {
            toast.error(error.message || "Failed to generate response. Please try again.");
        },
    });

    const handleCopy = (tab: string, textToCopy: string) => {
        if (textToCopy) {
            navigator.clipboard.writeText(textToCopy);
            setCopiedTab(tab);
            toast.success("Copied to clipboard!");
            setTimeout(() => setCopiedTab(null), 2000);
        }
    };

    const hasOutput = completion.length > 0;

    // Parse the 3 styles from the streaming completion output
    const extractSection = (content: string, startMarker: string, endMarker?: string) => {
        const startIndex = content.indexOf(startMarker);
        if (startIndex === -1) return "";
        const contentStartIndex = startIndex + startMarker.length;
        if (endMarker) {
            const endIndex = content.indexOf(endMarker, contentStartIndex);
            if (endIndex === -1) return content.substring(contentStartIndex).trim();
            return content.substring(contentStartIndex, endIndex).trim();
        }
        return content.substring(contentStartIndex).trim();
    };

    const professionalText = extractSection(completion, "🔹 **Professional Style**", "🔹 **Performance Review Style**");
    const performanceText = extractSection(completion, "🔹 **Performance Review Style**", "🔹 **Leadership Style**");
    const executiveText = extractSection(completion, "🔹 **Leadership Style**");

    const cleanTextForCopy = (text: string) =>
        text.replace(/\(Use for[\s\S]*?\)\n?/, "").replace(/^→ /m, "").trim();

    const tabContent: Record<string, string> = {
        professional: professionalText,
        performance: performanceText,
        executive: executiveText,
    };

    const currentTabText = tabContent[activeTab] ?? "";

    return (
        <ToolLayout
            title="Corporate Buzzword Generator"
            description="Stop underselling your work. Transform everyday tasks into executive-level achievement bullets that leadership understands and rewards."
        >
            {/* LEFT SIDE: Input */}
            <div className="flex flex-col space-y-6">
                <form onSubmit={handleSubmit} className="flex flex-col space-y-4">
                    <div className="space-y-2">
                        <label className="text-sm font-semibold leading-none">
                            Share your task
                        </label>
                        <Textarea
                            placeholder="eg: I've made 5 sales today from facebook ads"
                            value={input}
                            onChange={handleInputChange}
                            className="min-h-[220px] resize-none focus-visible:ring-primary shadow-sm"
                            disabled={isLoading}
                            required
                        />
                    </div>

                    <Button
                        type="submit"
                        disabled={isLoading || !input?.trim()}
                        className="w-full sm:w-auto self-start mt-2 text-white"
                        style={{ backgroundColor: "#055149" }}
                    >
                        {isLoading ? (
                            <>
                                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                                Generating...
                            </>
                        ) : (
                            <>
                                <Sparkles className="mr-2 h-4 w-4" />
                                Upgrade Statement
                            </>
                        )}
                    </Button>
                </form>
            </div>

            {/* RIGHT SIDE: Output */}
            <div className="flex flex-col gap-4">
                {/* Output card */}
                <div className="bg-card rounded-xl border shadow-sm p-5 relative flex flex-col min-h-[340px]">
                    {!hasOutput && !isLoading ? (
                        <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground space-y-4 py-10">
                            <Sparkles className="h-10 w-10 opacity-20" />
                            <p className="text-sm">Your upgraded statements will appear here.</p>
                        </div>
                    ) : (
                        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full flex flex-col flex-1">
                            {/* Tab header row with copy icon */}
                            <div className="flex items-center justify-between mb-4">
                                <TabsList className="grid grid-cols-3 flex-1 mr-3">
                                    <TabsTrigger value="professional">Professional</TabsTrigger>
                                    <TabsTrigger value="performance">Performance</TabsTrigger>
                                    <TabsTrigger value="executive">Executive</TabsTrigger>
                                </TabsList>
                                {/* Per-tab copy icon */}
                                <button
                                    onClick={() => handleCopy(activeTab, cleanTextForCopy(currentTabText))}
                                    disabled={!currentTabText || isLoading}
                                    title="Copy to clipboard"
                                    className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors disabled:opacity-30 disabled:cursor-not-allowed flex-shrink-0"
                                >
                                    {copiedTab === activeTab
                                        ? <Check className="h-4 w-4 text-green-600" />
                                        : <Copy className="h-4 w-4" />
                                    }
                                </button>
                            </div>

                            {/* Tab content panels */}
                            {(["professional", "performance", "executive"] as const).map((tab) => (
                                <TabsContent key={tab} value={tab} className="flex-1 mt-0 outline-none flex flex-col gap-4">
                                    {/* Generated output text */}
                                    <div className="prose prose-sm dark:prose-invert max-w-none flex-1">
                                        {tabContent[tab] ? (
                                            <div className="whitespace-pre-wrap">{tabContent[tab]}</div>
                                        ) : isLoading ? (
                                            <div className="flex items-center space-x-1.5 text-muted-foreground animate-pulse mt-2">
                                                <div className="h-2 w-2 bg-current rounded-full" />
                                                <div className="h-2 w-2 bg-current rounded-full" />
                                                <div className="h-2 w-2 bg-current rounded-full" />
                                            </div>
                                        ) : null}
                                    </div>

                                    {/* "Best for" section */}
                                    <div
                                        className="rounded-lg px-4 py-3 mt-2"
                                        style={{ backgroundColor: "#05514910" }}
                                    >
                                        <p className="text-sm font-semibold mb-2" style={{ color: "#055149" }}>
                                            Best for
                                        </p>
                                        <div className="flex flex-wrap gap-x-4 gap-y-1">
                                            {BEST_FOR[tab].map((point) => (
                                                <span
                                                    key={point}
                                                    className="flex items-center gap-1.5 text-xs text-muted-foreground"
                                                >
                                                    <CircleCheckBig className="h-3.5 w-3.5 flex-shrink-0" style={{ color: "#055149" }} />
                                                    {point}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                </TabsContent>
                            ))}
                        </Tabs>
                    )}
                </div>

                {/* USDRemoteJobs promotional callout — shown once output is generated */}
                {hasOutput && (
                    <div
                        className="rounded-xl px-5 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
                        style={{ backgroundColor: "#055149" }}
                    >
                        <div className="space-y-2">
                            <p className="text-white font-semibold text-sm">
                                Find Remote Jobs that pay USD Salary
                            </p>
                            <div className="flex flex-wrap gap-x-4 gap-y-1">
                                {[
                                    "3X Your Salary for same skill",
                                    "100% Remote Jobs",
                                    "Tech, Marketing & Design Jobs",
                                ].map((point) => (
                                    <span
                                        key={point}
                                        className="flex items-center gap-1.5 text-xs text-white/80"
                                    >
                                        <CircleCheckBig className="h-3.5 w-3.5 flex-shrink-0 text-white/80" />
                                        {point}
                                    </span>
                                ))}
                            </div>
                        </div>
                        <a
                            href="https://usdremotejobs.com"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 bg-white text-sm font-medium px-4 py-2 rounded-lg whitespace-nowrap transition-opacity hover:opacity-90 flex-shrink-0"
                            style={{ color: "#055149" }}
                        >
                            Checkout Jobs
                            <ExternalLink className="h-3.5 w-3.5" />
                        </a>
                    </div>
                )}
            </div>
        </ToolLayout>
    );
}
