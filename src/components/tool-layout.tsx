import { Badge } from "@/components/ui/badge";
import { ReactNode } from "react";

interface ToolLayoutProps {
    title: string;
    description: string;
    children: ReactNode;
}

export function ToolLayout({ title, description, children }: ToolLayoutProps) {
    return (
        <div className="flex-1 w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-16">
            {/* Section 1: Header */}
            <div className="text-center space-y-4 mb-12">
                <Badge
                    variant="secondary"
                    className="px-3 py-1 text-sm transition-colors"
                    style={{ backgroundColor: "#05514918", color: "#055149" }}
                >
                    Free Tool – No Login Required
                </Badge>
                <h1 className="text-3xl md:text-5xl font-bold tracking-tight text-foreground">
                    <span style={{ color: "#055149" }}>{title.split(" ").slice(0, -1).join(" ")}</span>
                    {" "}{title.split(" ").slice(-1)}
                </h1>
                <p className="max-w-xl mx-auto text-lg text-muted-foreground">
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
