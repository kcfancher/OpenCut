import { Button } from "@/components/ui/button";
import { PanelView } from "@/components/editor/panels/assets/views/base-panel";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { useState, useRef } from "react";
import { extractTimelineAudio } from "@/lib/media/mediabunny";
import { useEditor } from "@/hooks/use-editor";
import {
	DEFAULT_TRANSCRIPTION_SAMPLE_RATE,
	TRANSCRIPTION_LANGUAGES,
} from "@/constants/transcription-constants";
import type {
	CaptionChunk,
	TranscriptionLanguage,
	TranscriptionProgress,
} from "@/lib/transcription/types";
import { transcriptionService } from "@/services/transcription/service";
import { decodeAudioToFloat32 } from "@/lib/media/audio";
import { buildCaptionChunks } from "@/lib/transcription/caption";
import { insertCaptionChunksAsTextTrack } from "@/lib/subtitles/insert";
import { parseSubtitleFile } from "@/lib/subtitles/parse";
import { Spinner } from "@/components/ui/spinner";
import {
	Section,
	SectionContent,
	SectionField,
	SectionFields,
} from "@/components/section";

export function Captions() {
	const [selectedLanguage, setSelectedLanguage] =
		useState<TranscriptionLanguage>("auto");
	const [isProcessing, setIsProcessing] = useState(false);
	const [processingStep, setProcessingStep] = useState("");
	const [error, setError] = useState<string | null>(null);
	const [warning, setWarning] = useState<string | null>(null);
	const containerRef = useRef<HTMLDivElement>(null);
	const fileInputRef = useRef<HTMLInputElement>(null);
	const editor = useEditor();

	const handleProgress = (progress: TranscriptionProgress) => {
		if (progress.status === "loading-model") {
			setProcessingStep(`Loading model ${Math.round(progress.progress)}%`);
		} else if (progress.status === "transcribing") {
			setProcessingStep("Transcribing...");
		}
	};

	const handleGenerateTranscript = async () => {
		try {
			setIsProcessing(true);
			setError(null);
			setWarning(null);
			setProcessingStep("Extracting audio...");

			const audioBlob = await extractTimelineAudio({
				tracks: editor.timeline.getTracks(),
				mediaAssets: editor.media.getAssets(),
				totalDuration: editor.timeline.getTotalDuration(),
			});

			setProcessingStep("Preparing audio...");
			const { samples } = await decodeAudioToFloat32({
				audioBlob,
				sampleRate: DEFAULT_TRANSCRIPTION_SAMPLE_RATE,
			});

			const result = await transcriptionService.transcribe({
				audioData: samples,
				language: selectedLanguage === "auto" ? undefined : selectedLanguage,
				onProgress: handleProgress,
			});

			setProcessingStep("Generating captions...");
			const captionChunks = buildCaptionChunks({ segments: result.segments });
			insertCaptionChunks({ captions: captionChunks });
		} catch (error) {
			console.error("Transcription failed:", error);
			setError(
				error instanceof Error ? error.message : "An unexpected error occurred",
			);
		} finally {
			setIsProcessing(false);
			setProcessingStep("");
		}
	};

	const insertCaptionChunks = ({
		captions,
	}: {
		captions: CaptionChunk[];
	}) => {
		const trackId = insertCaptionChunksAsTextTrack({
			editor,
			captions,
		});

		if (!trackId) {
			throw new Error("No captions were generated");
		}
	};

	const handleImportClick = () => {
		fileInputRef.current?.click();
	};

	const handleImportFile = async ({
		file,
	}: {
		file: File;
	}) => {
		try {
			setIsProcessing(true);
			setError(null);
			setWarning(null);
			setProcessingStep("Reading subtitle file...");

			const input = await file.text();
			const result = parseSubtitleFile({
				fileName: file.name,
				input,
			});

			if (result.captions.length === 0) {
				throw new Error("No valid subtitle cues were found in the .srt file");
			}

			setProcessingStep("Importing subtitles...");
			insertCaptionChunks({ captions: result.captions });

			if (result.skippedCueCount > 0) {
				setWarning(
					`Imported ${result.captions.length} subtitle cue(s) and skipped ${result.skippedCueCount} malformed cue(s).`,
				);
			}
		} catch (error) {
			console.error("Subtitle import failed:", error);
			setError(
				error instanceof Error ? error.message : "An unexpected error occurred",
			);
		} finally {
			setIsProcessing(false);
			setProcessingStep("");
		}
	};

	const handleFileChange = async ({
		event,
	}: {
		event: React.ChangeEvent<HTMLInputElement>;
	}) => {
		const file = event.target.files?.[0];
		if (event.target) {
			event.target.value = "";
		}
		if (!file) return;

		await handleImportFile({ file });
	};

	const handleLanguageChange = ({ value }: { value: string }) => {
		if (value === "auto") {
			setSelectedLanguage("auto");
			return;
		}

		const matchedLanguage = TRANSCRIPTION_LANGUAGES.find(
			(language) => language.code === value,
		);
		if (!matchedLanguage) return;
		setSelectedLanguage(matchedLanguage.code);
	};

	return (
		<PanelView
			title="Captions"
			contentClassName="px-0 flex flex-col h-full"
			ref={containerRef}
		>
			<input
				ref={fileInputRef}
				type="file"
				accept=".srt"
				className="hidden"
				onChange={(event) => void handleFileChange({ event })}
			/>
			<Section showTopBorder={false} showBottomBorder={false} className="flex-1">
				<SectionContent className="flex flex-col gap-4 h-full pt-1">
					<SectionFields>
						<SectionField label="Language">
							<Select
								value={selectedLanguage}
								onValueChange={(value) => handleLanguageChange({ value })}
							>
								<SelectTrigger>
									<SelectValue placeholder="Select a language" />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="auto">Auto detect</SelectItem>
									{TRANSCRIPTION_LANGUAGES.map((language) => (
										<SelectItem key={language.code} value={language.code}>
											{language.name}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</SectionField>
					</SectionFields>

					{error && (
						<div className="bg-destructive/10 border-destructive/20 rounded-md border p-3">
							<p className="text-destructive text-sm">{error}</p>
						</div>
					)}
					{warning && (
						<div className="rounded-md border border-amber-500/20 bg-amber-500/10 p-3">
							<p className="text-sm text-amber-700">{warning}</p>
						</div>
					)}
				</SectionContent>
			</Section>
			<Section showBottomBorder={false} showTopBorder={false}>
				<SectionContent>
					<div className="flex gap-2">
						<Button
							className="flex-1"
							onClick={handleGenerateTranscript}
							disabled={isProcessing}
						>
							{isProcessing && <Spinner className="mr-1" />}
							{isProcessing ? processingStep : "Generate transcript"}
						</Button>
						<Button
							variant="outline"
							className="flex-1"
							onClick={handleImportClick}
							disabled={isProcessing}
						>
							Import .srt
						</Button>
					</div>
				</SectionContent>
			</Section>
		</PanelView>
	);
}
