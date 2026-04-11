import type { TextBackground, TextElement } from "@/lib/timeline";
import type { CaptionChunk } from "@/lib/transcription/types";

export interface SubtitlePlacementStyle {
	verticalAlign?: "top" | "middle" | "bottom";
	marginLeftRatio?: number;
	marginRightRatio?: number;
	marginVerticalRatio?: number;
}

export interface SubtitleStyleOverrides {
	fontSize?: number;
	fontFamily?: string;
	color?: string;
	background?: Pick<TextBackground, "enabled" | "color"> &
		Partial<Omit<TextBackground, "enabled" | "color">>;
	textAlign?: TextElement["textAlign"];
	fontWeight?: TextElement["fontWeight"];
	fontStyle?: TextElement["fontStyle"];
	textDecoration?: TextElement["textDecoration"];
	letterSpacing?: number;
	lineHeight?: number;
	placement?: SubtitlePlacementStyle;
}

export interface SubtitleCue extends CaptionChunk {
	style?: SubtitleStyleOverrides;
}

export interface ParseSubtitleResult {
	captions: SubtitleCue[];
	skippedCueCount: number;
	warnings: string[];
}
