import type { EditorCore } from "@/core";
import { DEFAULTS } from "@/lib/timeline/defaults";
import type { CaptionChunk } from "@/lib/transcription/types";

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
				...DEFAULTS.text.element,
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
