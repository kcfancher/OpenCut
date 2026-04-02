import type { EditorCore } from "@/core";
import { DEFAULTS } from "@/lib/timeline/defaults";
import type { CaptionChunk } from "@/lib/transcription/types";
import {
	AddTrackCommand,
	BatchCommand,
	InsertElementCommand,
} from "@/lib/commands";

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

	const addTrackCommand = new AddTrackCommand("text", 0);
	const trackId = addTrackCommand.getTrackId();
	const commands = [addTrackCommand];

	for (let i = 0; i < captions.length; i++) {
		const caption = captions[i];
		commands.push(
			new InsertElementCommand({
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
			}),
		);
	}

	editor.command.execute({
		command: new BatchCommand(commands),
	});

	return trackId;
}
