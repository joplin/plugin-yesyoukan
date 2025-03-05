import * as React from "react";
import { useCallback, useState, useMemo, useRef } from "react";
import { Board, Note, WebviewApi, emptyBoard } from "../../utils/types";
import StackViewer, { StackDropEventHandler, StackEvent, StackEventHandler } from "../StackViewer";
import { DragDropContext, Droppable, OnDragEndResponder } from "@hello-pangea/dnd";
import { ThemeProvider } from "@mui/material";
import Toolbar from '../Toolbar';
import setupFontAwesome from "../../utils/setupFontAwesome";
import SettingsDialog from "../config/Dialog";
import { darkBackgroundColors, lightBackgroundColors } from "../../utils/colors";
import getTheme from "./utils/getTheme";
import useHistory from "./hooks/useHistory";
import useCardContentRendering from "./hooks/useCardContentRendering";
import { AfterSetNoteAction, DialogConfig } from "./utils/types";
import useCardHandler from "./hooks/useCardHandler";
import useStackHandler from "./hooks/useStackHandler";
import useRendererEvents from "./hooks/useRendererEvents";
import useDarkMode from "./hooks/useDarkMode";
import usePlatform from "./hooks/usePlatform";
import useEffectiveBoardSettings from "./hooks/useEffectiveBoardSettings";
import useNoteSync from "./hooks/useNoteSync";
import useOnCreateNoteFromCard from "./hooks/useOnCreateNoteFromCard";
import useOnScrollToCard from "./hooks/useOnScrollToCard";
import useOnOpenAssociatedNote from "./hooks/useOnOpenAssociatedNote";
import useOnDragEnd from "./hooks/useOnDragEnd";
import useStyle from "./hooks/useStyle";
import useToolbarButtons from "./hooks/useToolbarButtons";
import Logger from "@joplin/utils/Logger";
import useOnStackDrop from "./hooks/useOnStackDrop";

declare var webviewApi: WebviewApi;

setupFontAwesome();

const theme = getTheme();

export default () => {
	const [board, setBoard] = useState<Board>(emptyBoard());
	const afterSetNoteAction = useRef<AfterSetNoteAction|null>(null);
	const [dialogConfig, setDialogConfig] = useState<DialogConfig|null>(null);

	const effectiveBoardSettings = useEffectiveBoardSettings({
		board,
		webviewApi,
	});

	const { history, pushUndo, clearUndo, onUndoBoard, onRedoBoard } = useHistory({ 
		board,
		setBoard,
	});

	const { cssStrings } = useCardContentRendering({
		board,
		setBoard,
		webviewApi,
	});

	const {
		editedCardIds,
		onCardEditorStart,
		onCardChange,
		onEditCardSettings,
		onDeleteCard,
		onCardEditorCancel,
		onAddCard,
	} = useCardHandler({
		board,
		pushUndo,
		setBoard,
		setDialogConfig,
		webviewApi,
	});

	const {
		onEditStackSettings,
		onStackTitleChange, 
		onStackDelete,
		onAddStack,
	} = useStackHandler({
		board,
		pushUndo,
		setBoard,
		setDialogConfig,
	});

	useRendererEvents({
		webviewApi,
		setBoard,
	});

	const platform = usePlatform();

	const isDarkMode = useDarkMode({ webviewApi });

	const backgroundColors = useMemo(() => {
		return isDarkMode ? darkBackgroundColors : lightBackgroundColors;
	}, [isDarkMode]);

	useNoteSync({
		setBoard,
		webviewApi,
		afterSetNoteAction,
		board,
		clearUndo,
	});

	const onCreateNoteFromCard = useOnCreateNoteFromCard({
		afterSetNoteAction,
		board,
		setBoard,
		webviewApi,
	});

	const onScrollToCard = useOnScrollToCard({
		board,
		webviewApi,
	});

	const onOpenAssociatedNote = useOnOpenAssociatedNote({
		board,
		webviewApi,
	});

	const onDragEnd = useOnDragEnd({
		board,
		pushUndo,
		setBoard,
	});

	const onStackDrop = useOnStackDrop({
		board,
		setBoard,
		webviewApi,
	});

	const appStyle = useStyle({
		backgroundColors,
		cssStrings,
		stackDynamicWidth: effectiveBoardSettings.stackDynamicWidth,
		stackWidth: effectiveBoardSettings.stackWidth,
	});

	const toolbarButtons = useToolbarButtons({
		historyRedoLength: history.redo.length,
		historyUndoLength: history.undo.length,
		onAddStack,
		onRedoBoard,
		onUndoBoard,
	});

	const onSettingsDialogClose = useCallback(() => {
		setDialogConfig(null);
	}, []);

	const renderStacks = () => {
		const dynamicWidth = effectiveBoardSettings.stackDynamicWidth ? board.stacks.length : 0;

		const output:React.JSX.Element[] = [];
		for (let [index, stack] of board.stacks.entries()) {
			output.push(<StackViewer
				onDelete={onStackDelete}
				onTitleChange={onStackTitleChange}
				onCardEditorStart={onCardEditorStart}
				onCardEditorSubmit={onCardChange}
				onCardEditorCancel={onCardEditorCancel}
				onScrollToCard={onScrollToCard}
				onCreateNoteFromCard={onCreateNoteFromCard}
				onOpenAssociatedNote={onOpenAssociatedNote}
				onEditCardSettings={onEditCardSettings}
				onAddCard={onAddCard}
				onDeleteCard={onDeleteCard}
				onEditSettings={onEditStackSettings}
				onDrop={onStackDrop}
				isLast={index === board.stacks.length - 1}
				dynamicWidth={dynamicWidth}
				key={stack.id}
				value={stack}
				platform={platform}
				index={index}
				confirmKey={effectiveBoardSettings.confirmKey}
				newlineKey={effectiveBoardSettings.newlineKey}
				editedCardIds={editedCardIds}
				cardDoubleClickAction={effectiveBoardSettings.cardDoubleClickAction}
			/>);
		}
		return output;
	}

	const renderSettingsDialog = () => {
		if (!dialogConfig) return;

		return (
			<SettingsDialog
				title={dialogConfig.title}
				settingItems={dialogConfig.settingItems}
				settings={dialogConfig.settings}
				onClose={onSettingsDialogClose}
				onSave={dialogConfig.onSave}
				backgroundColor={backgroundColors}
				isDarkMode={isDarkMode}
			/>
		);
	}

	return (
		<ThemeProvider theme={theme}>
			<div className="app">
				{renderSettingsDialog()}
				<style>{appStyle}</style>
				<Toolbar buttons={toolbarButtons}/>
				<div className="stacks">
					<DragDropContext onDragEnd={onDragEnd}>
						<Droppable droppableId="all" direction="horizontal" type="column">
							{(provided) => {
								return (
									<div className="stacks-inner" ref={provided.innerRef}>
										{renderStacks()}
										{provided.placeholder}
									</div>
								);
							}}
						</Droppable>
					</DragDropContext>
				</div>
			</div>
		</ThemeProvider>
	);
}