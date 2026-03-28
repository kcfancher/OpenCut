import type { EditorCore } from "@/core";
import { DEFAULT_TEXT_ELEMENT } from "@/constants/text-constants";
import {
	AddTrackCommand,
	BatchCommand,
	InsertElementCommand,
} from "@/lib/commands";
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

	const addTrackCommand = new AddTrackCommand("text", 0);
	const trackId = addTrackCommand.getTrackId();
	const commands = [addTrackCommand];

	for (let i = 0; i < captions.length; i++) {
		const caption = captions[i];
		commands.push(
			new InsertElementCommand({
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
			}),
		);
	}

	editor.command.execute({
		command: new BatchCommand(commands),
	});

	return trackId;
}
