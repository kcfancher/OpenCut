import type { EditorCore } from "@/core";
import type { Command } from "@/lib/commands";
import {
	AddTrackCommand,
	BatchCommand,
	InsertElementCommand,
} from "@/lib/commands";
import { buildSubtitleTextElement } from "./build-subtitle-text-element";
import type { SubtitleCue } from "./types";

export function insertCaptionChunksAsTextTrack({
	editor,
	captions,
}: {
	editor: EditorCore;
	captions: SubtitleCue[];
}): string | null {
	if (captions.length === 0) {
		return null;
	}

	const addTrackCommand = new AddTrackCommand("text", 0);
	const trackId = addTrackCommand.getTrackId();
	const canvasSize = editor.project.getActive().settings.canvasSize;
	const insertCommands = captions.map(
		(caption, index) =>
			new InsertElementCommand({
				placement: { mode: "explicit", trackId },
				element: buildSubtitleTextElement({
					index,
					caption,
					canvasSize,
				}),
			}),
	);
	const commands = [addTrackCommand, ...insertCommands] as unknown as Command[];

	editor.command.execute({
		command: new BatchCommand(commands),
	});

	return trackId;
}
