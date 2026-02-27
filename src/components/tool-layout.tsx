import { Badge } from "@/components/ui/badge";
import { ReactNode } from "react";

interface ToolLayoutProps {
    title: string;
    description: string;
    children: ReactNode;
    /** Override the badge label (defaults to "Free Tool – No Login Required") */
    badge?: string;
    /** Render a fully custom headline instead of the auto-split title */
    titleNode?: ReactNode;
}

export function ToolLayout({ title, description, children, badge, titleNode }: ToolLayoutProps) {
    return (
        <div className="flex-1 w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-16">
            {/* Section 1: Header */}
            <div className="text-center space-y-4 mb-12">
                <Badge
                    variant="secondary"
                    className="px-3 py-1 text-sm transition-colors"
                    style={{ backgroundColor: "#05514918", color: "#055149" }}
                >
                    {badge ?? "Free Tool – No Login Required"}
                </Badge>
                {titleNode ? (
                    <h1 className="text-3xl md:text-5xl font-bold tracking-tight leading-tight">
                        {titleNode}
                    </h1>
                ) : (
                    <h1 className="text-3xl md:text-5xl font-bold tracking-tight text-foreground">
                        <span style={{ color: "#055149" }}>{title.split(" ").slice(0, -1).join(" ")}</span>
                        {" "}{title.split(" ").slice(-1)}
                    </h1>
                )}
                <p className="max-w-xl mx-auto text-base text-muted-foreground">
                    {description}
                </p>
            </div>

            {/* Section 2: Two-column content layout */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-start">
                {children}
            </div>
        </div>
    );
}
