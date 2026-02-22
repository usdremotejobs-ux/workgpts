"use client";

import { useState } from "react";
import { useCompletion } from "@ai-sdk/react";
import { Copy, RefreshCw, Sparkles, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ToolLayout } from "@/components/tool-layout";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function BuzzwordGenerator() {
    const [copied, setCopied] = useState(false);
    const [activeTab, setActiveTab] = useState("professional");

    // useCompletion provides simple state handling for a single-turn prompt generator
    const { completion, input, handleInputChange, handleSubmit, isLoading, complete } = useCompletion({
        api: "/api/chat", // Uses our custom route
        streamProtocol: "text", // Match the backend toTextStreamResponse
        body: {
            tool: "buzzword-generator",
        },
        onError: (error: Error) => {
            toast.error(error.message || "Failed to generate response. Please try again.");
        }
    });

    const handleCopy = (textToCopy: string) => {
        if (textToCopy) {
            navigator.clipboard.writeText(textToCopy);
            setCopied(true);
            toast.success("Copied to clipboard!");
            setTimeout(() => setCopied(false), 2000);
        }
    };

    const handleRegenerate = () => {
        if (input?.trim()) {
            complete(input);
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
            if (endIndex === -1) {
                // End marker not found yet (maybe still streaming), return remainder
                return content.substring(contentStartIndex).trim();
            }
            return content.substring(contentStartIndex, endIndex).trim();
        }

        // No end marker, return everything to the end
        return content.substring(contentStartIndex).trim();
    };

    const professionalText = extractSection(completion, "🔹 **Professional Style**", "🔹 **Performance Review Style**");
    const performanceText = extractSection(completion, "🔹 **Performance Review Style**", "🔹 **Leadership Style**");
    const leadershipText = extractSection(completion, "🔹 **Leadership Style**");

    // Helper to extract clean text for copying (stripping the hint text if it exists)
    const cleanTextForCopy = (text: string) => {
        // Strip the (Use for...) hint line if it exists
        return text.replace(/\(Use for[\s\S]*?\)\n?/, '').replace(/^→ /m, '').trim();
    };

    const currentTabText =
        activeTab === "professional" ? professionalText :
            activeTab === "performance" ? performanceText :
                leadershipText;

    const currentCleanText = cleanTextForCopy(currentTabText);

    return (
        <ToolLayout
            title="Professional Buzzword Generator"
            description="Transform simple work statements into executive-level achievement bullets."
        >
            {/* LEFT SIDE: Input */}
            <div className="flex flex-col space-y-6">
                <form onSubmit={handleSubmit} className="flex flex-col space-y-4 relative">
                    <div className="space-y-2">
                        <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                            What did you do?
                        </label>
                        <Textarea
                            placeholder="e.g., I made a spreadsheet that tracks our daily sales so we don't drop the ball."
                            value={input}
                            onChange={handleInputChange}
                            className="min-h-[200px] resize-none focus-visible:ring-primary shadow-sm"
                            disabled={isLoading}
                            required
                        />
                    </div>

                    <Button type="submit" disabled={isLoading || !input?.trim()} className="w-full sm:w-auto self-start mt-2">
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
            <div className="flex flex-col h-full min-h-[400px]">
                <div className="flex-1 bg-card rounded-xl border shadow-sm p-6 relative flex flex-col">
                    {!hasOutput && !isLoading ? (
                        <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground space-y-4">
                            <Sparkles className="h-12 w-12 opacity-20" />
                            <p>Your upgraded statements will appear here.</p>
                        </div>
                    ) : (
                        <div className="flex-1 flex flex-col">
                            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full flex-1 flex flex-col">
                                <TabsList className="grid w-full grid-cols-3 mb-6">
                                    <TabsTrigger value="professional">Professional</TabsTrigger>
                                    <TabsTrigger value="performance">Performance</TabsTrigger>
                                    <TabsTrigger value="leadership">Leadership</TabsTrigger>
                                </TabsList>

                                {["professional", "performance", "leadership"].map((tab) => (
                                    <TabsContent key={tab} value={tab} className="flex-1 mt-0 outline-none">
                                        <div className="prose prose-sm md:prose-base dark:prose-invert max-w-none">
                                            {tab === "professional" && professionalText && (
                                                <div className="whitespace-pre-wrap">{professionalText}</div>
                                            )}
                                            {tab === "performance" && performanceText && (
                                                <div className="whitespace-pre-wrap">{performanceText}</div>
                                            )}
                                            {tab === "leadership" && leadershipText && (
                                                <div className="whitespace-pre-wrap">{leadershipText}</div>
                                            )}

                                            {/* Show loading state in the active tab if it's currently streaming and empty */}
                                            {isLoading && (!currentTabText) && (
                                                <div className="flex items-center space-x-2 text-muted-foreground animate-pulse mt-4">
                                                    <div className="h-2 w-2 bg-current rounded-full"></div>
                                                    <div className="h-2 w-2 bg-current rounded-full animation-delay-200"></div>
                                                    <div className="h-2 w-2 bg-current rounded-full animation-delay-400"></div>
                                                </div>
                                            )}
                                        </div>
                                    </TabsContent>
                                ))}
                            </Tabs>
                        </div>
                    )}
                </div>

                {/* Action Buttons for Output */}
                {hasOutput && (
                    <div className="flex space-x-3 mt-4 justify-end">
                        <Button variant="outline" size="sm" onClick={handleRegenerate} disabled={isLoading}>
                            <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
                            Regenerate All
                        </Button>
                        <Button
                            variant="default"
                            size="sm"
                            onClick={() => handleCopy(currentCleanText)}
                            disabled={isLoading || !currentTabText}
                        >
                            {copied ? <Check className="mr-2 h-4 w-4" /> : <Copy className="mr-2 h-4 w-4" />}
                            {copied ? "Copied!" : "Copy to Clipboard"}
                        </Button>
                    </div>
                )}
            </div>
        </ToolLayout>
    );
}
