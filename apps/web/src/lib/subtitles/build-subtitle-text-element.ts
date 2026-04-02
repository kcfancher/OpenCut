import { FONT_SIZE_SCALE_REFERENCE } from "@/constants/text-constants";
import { measureTextBlock } from "@/lib/text/layout";
import { DEFAULTS } from "@/lib/timeline/defaults";
import type { CreateTextElement } from "@/lib/timeline";
import type { CaptionChunk } from "@/lib/transcription/types";

const SUBTITLE_MAX_WIDTH_RATIO = 0.8;
const SUBTITLE_BOTTOM_MARGIN_RATIO = 0.05;
const SUBTITLE_FONT_SIZE = 5;

function quoteFontFamily({ fontFamily }: { fontFamily: string }): string {
	return `"${fontFamily.replace(/"/g, '\\"')}"`;
}

function createMeasurementContext(): CanvasRenderingContext2D | null {
	const canvas = document.createElement("canvas");
	canvas.width = 4096;
	canvas.height = 4096;
	return canvas.getContext("2d");
}

function measureLineWidth({
	ctx,
	text,
}: {
	ctx: CanvasRenderingContext2D;
	text: string;
}): number {
	return ctx.measureText(text).width;
}

function wrapSubtitleText({
	ctx,
	text,
	maxWidth,
}: {
	ctx: CanvasRenderingContext2D;
	text: string;
	maxWidth: number;
}): string {
	const normalized = text.trim().replace(/\r\n/g, "\n");
	const paragraphs = normalized.split("\n");
	const wrappedParagraphs: string[] = [];

	for (const paragraph of paragraphs) {
		const trimmedParagraph = paragraph.trim();
		if (!trimmedParagraph) {
			wrappedParagraphs.push("");
			continue;
		}

		const words = trimmedParagraph.split(/\s+/);
		let currentLine = words[0] ?? "";
		const lines: string[] = [];

		for (let i = 1; i < words.length; i++) {
			const nextLine = `${currentLine} ${words[i]}`;
			if (measureLineWidth({ ctx, text: nextLine }) <= maxWidth) {
				currentLine = nextLine;
				continue;
			}

			lines.push(currentLine);
			currentLine = words[i];
		}

		lines.push(currentLine);
		wrappedParagraphs.push(lines.join("\n"));
	}

	return wrappedParagraphs.join("\n");
}

function measureWrappedTextBlock({
	ctx,
	content,
	canvasHeight,
}: {
	ctx: CanvasRenderingContext2D;
	content: string;
	canvasHeight: number;
}) {
	const scaledFontSize =
		SUBTITLE_FONT_SIZE * (canvasHeight / FONT_SIZE_SCALE_REFERENCE);
	const lineHeight = (DEFAULTS.text.lineHeight ?? 1.2) * scaledFontSize;
	const lines = content.split("\n");
	const lineMetrics = lines.map((line) => ctx.measureText(line));

	return measureTextBlock({
		lineMetrics,
		lineHeightPx: lineHeight,
		fallbackFontSize: scaledFontSize,
	});
}

export function buildSubtitleTextElement({
	index,
	caption,
	canvasSize,
}: {
	index: number;
	caption: CaptionChunk;
	canvasSize: { width: number; height: number };
}): CreateTextElement {
	const ctx = createMeasurementContext();
	const fontFamily = quoteFontFamily({
		fontFamily: DEFAULTS.text.element.fontFamily,
	});
	const fontWeight = "bold";
	const fontStyle =
		DEFAULTS.text.element.fontStyle === "italic" ? "italic" : "normal";
	const scaledFontSize =
		SUBTITLE_FONT_SIZE * (canvasSize.height / FONT_SIZE_SCALE_REFERENCE);
	const fontString = `${fontStyle} ${fontWeight} ${scaledFontSize}px ${fontFamily}, sans-serif`;
	const maxWidth = canvasSize.width * SUBTITLE_MAX_WIDTH_RATIO;

	let content = caption.text;
	let blockHeight = scaledFontSize;

	if (ctx) {
		ctx.font = fontString;
		content = wrapSubtitleText({
			ctx,
			text: caption.text,
			maxWidth,
		});
		blockHeight = measureWrappedTextBlock({
			ctx,
			content,
			canvasHeight: canvasSize.height,
		}).height;
	}

	const bottomMargin = canvasSize.height * SUBTITLE_BOTTOM_MARGIN_RATIO;
	const centerY = canvasSize.height - bottomMargin - blockHeight / 2;
	const positionY = centerY - canvasSize.height / 2;

	return {
		...DEFAULTS.text.element,
		name: `Caption ${index + 1}`,
		content,
		duration: caption.duration,
		startTime: caption.startTime,
		fontSize: SUBTITLE_FONT_SIZE,
		fontWeight,
		background: {
			...DEFAULTS.text.element.background,
			enabled: false,
		},
		transform: {
			...DEFAULTS.text.element.transform,
			position: {
				x: 0,
				y: positionY,
			},
		},
	};
}
