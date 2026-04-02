import type { CaptionChunk } from "@/lib/transcription/types";
import { parseSrt } from "./srt";

export interface ParseSubtitleResult {
	captions: CaptionChunk[];
	skippedCueCount: number;
}

export function parseSubtitleFile({
	fileName,
	input,
}: {
	fileName: string;
	input: string;
}): ParseSubtitleResult {
	const extension = getFileExtension({ fileName });

	switch (extension) {
		case "srt":
			return parseSrt({ input });
		default:
			throw new Error("Unsupported subtitle format");
	}
}

function getFileExtension({ fileName }: { fileName: string }): string {
	const extension = fileName.split(".").pop();
	return extension?.toLowerCase() ?? "";
}
