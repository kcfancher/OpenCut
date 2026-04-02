import type { EditorCore } from "@/core";
import type { CaptionChunk } from "@/lib/transcription/types";
import {
	AddTrackCommand,
	BatchCommand,
	InsertElementCommand,
} from "@/lib/commands";
import { buildSubtitleTextElement } from "./build-subtitle-text-element";

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
	const canvasSize = editor.project.getActive().settings.canvasSize;

	for (let i = 0; i < captions.length; i++) {
		const caption = captions[i];
		commands.push(
			new InsertElementCommand({
				placement: { mode: "explicit", trackId },
				element: buildSubtitleTextElement({
					index: i,
					caption,
					canvasSize,
				}),
			}),
		);
	}

	editor.command.execute({
		command: new BatchCommand(commands),
	});

	return trackId;
}
