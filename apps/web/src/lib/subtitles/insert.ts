import type { EditorCore } from "@/core";
import { DEFAULT_TEXT_ELEMENT } from "@/constants/text-constants";
import type { CaptionChunk } from "@/types/transcription";

export function insertCaptionChunksAsTextTrack({
	editor,
	captions,
}: {
	editor: EditorCore;
	captions: CaptionChunk[];
}): string | null {
	if (captions.length === 0) {
		return null;
	}

	const trackId = editor.timeline.addTrack({
		type: "text",
		index: 0,
	});

	for (let i = 0; i < captions.length; i++) {
		const caption = captions[i];
		editor.timeline.insertElement({
			placement: { mode: "explicit", trackId },
			element: {
				...DEFAULT_TEXT_ELEMENT,
				name: `Caption ${i + 1}`,
				content: caption.text,
				duration: caption.duration,
				startTime: caption.startTime,
				fontSize: 65,
				fontWeight: "bold",
			},
		});
	}

	return trackId;
}
