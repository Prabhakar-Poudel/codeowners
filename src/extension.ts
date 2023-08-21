import {
	StatusBarItem,
	window,
	workspace,
	ExtensionContext,
	StatusBarAlignment,
	commands
} from 'vscode'

import { Codeowners } from './codeowners'
import { openFile, ownersToText } from './extensionHelpers'

const codeowners = new Codeowners()
let statusBarItem: StatusBarItem
const statusBarCommand = 'codeowner.fileOwners'
const ownedFilesCommand = 'codeowner.showFilesForOwner'

const getOwnersOfCurrentFile = () => {
	const editor = window.activeTextEditor

	if (!editor) {
		return []
	}

	const absolutePath = editor.document.fileName
	const relativePath = workspace.asRelativePath(absolutePath)
	return codeowners.getFileOwners(relativePath)
}

const updateStatusBarItem = async () => {
	const owners = await getOwnersOfCurrentFile()

	if (!owners) {
		return statusBarItem.hide()
	}

	statusBarItem.text = ownersToText(owners)
	statusBarItem.tooltip = 'Show owners of this file'
	statusBarItem.show()
}

const getFileOwners = async () => {
	const owners = await getOwnersOfCurrentFile()
	renderFileOwnersPick(owners)
}

const renderFileOwnersPick = async (owners: string[]) => {
	const owner = await window.showQuickPick(owners, {
		placeHolder: 'Select owner to view their owned files'
	})

	if (owner) {
		getFilesOwnedBy(owner)
	}
}

const getFilesOwnedBy = async (owner: string) => {
	const selectedFile = await window.showQuickPick(
		codeowners.getFilesOwnedBy(owner),
		{ placeHolder: 'Filter file by name' }
	)

	if (selectedFile) {
		openFile(selectedFile)
	}
}

const handleFilesOwnedBy = () => {
	renderFileOwnersPick(codeowners.getAllOwners())
}

export const activate = async (context: ExtensionContext) => {
	statusBarItem = window.createStatusBarItem(StatusBarAlignment.Right, 100)
	statusBarItem.command = statusBarCommand

	await codeowners.init()

	const fileOwners = commands.registerCommand(statusBarCommand, getFileOwners)

	const teamFiles = commands.registerCommand(
		ownedFilesCommand,
		handleFilesOwnedBy
	)

	const activeEditor = window.onDidChangeActiveTextEditor(updateStatusBarItem)

	context.subscriptions.push(fileOwners, statusBarItem, activeEditor, teamFiles)

	updateStatusBarItem()
}

export const deactivate = () => {}
