import {
	StatusBarItem,
	window,
	workspace,
	ExtensionContext,
	StatusBarAlignment,
	commands,
	Uri
} from 'vscode'
import Codeowners = require('@nmann/codeowners')

let statusBarItem: StatusBarItem
const statusBarCommand = 'codeowner.fileOwners'
const teamFilesCommand = 'codeowner.showFilesForOwner'

const getOwners = () => {
	const editor = window.activeTextEditor

	if (!editor) {
		return
	}

	const absolutePath = editor.document.fileName
	const relativePath = workspace.asRelativePath(absolutePath)
	const codeowners = new Codeowners(absolutePath)
	return codeowners.getOwner(relativePath)
}

const updateStatusBarItem = () => {
	const owners = getOwners()

	if (!owners) {
		return statusBarItem.hide()
	}

	if (owners.length > 2) {
		statusBarItem.text = `${owners[0]} +${owners.length - 1}`
	} else if (owners.length === 2) {
		statusBarItem.text = `${owners[0]} +1`
	} else if (owners.length === 1) {
		statusBarItem.text = `${owners[0]}`
	} else {
		statusBarItem.text = 'No owner'
	}

	statusBarItem.tooltip = 'Show owners of this file'
	statusBarItem.show()
}

const getFirstWorspacePath = () => workspace.workspaceFolders?.[0].uri.path

const getFileOwners = () => {
	window.showQuickPick(getOwners() ?? []).then((owner) => {
		if (owner) {
			getFilesOwnedBy(owner)
		}
	})
}

const openFileOrFolder = (selectedItem: string) => {
	const workspaceUri = workspace.workspaceFolders?.[0].uri
	if (!workspaceUri) {
		return
	}

	const uri = Uri.joinPath(workspaceUri, selectedItem)
	if (selectedItem.endsWith('/')) {
		commands.executeCommand('revealInExplorer', uri)
	} else {
		commands.executeCommand('vscode.open', uri)
	}
}

const getFilesOwnedBy = (owner: string) => {
	const cwd = workspace.workspaceFolders?.[0].uri.path
	if (!cwd) {
		return
	}

	const codeowners = new Codeowners(cwd)

	window
		.showQuickPick(codeowners.getPathsForOwner(owner) ?? [])
		.then((selectedItem) => {
			if (selectedItem) {
				openFileOrFolder(selectedItem)
			}
		})
}

const handleFilesOwnedBy = () => {
	return window
		.showInputBox()
		.then((owner) => (owner ? getFilesOwnedBy(owner) : undefined))
}

export const activate = (context: ExtensionContext) => {
	statusBarItem = window.createStatusBarItem(StatusBarAlignment.Right, 100)
	statusBarItem.command = statusBarCommand

	const fileOwners = commands.registerCommand(statusBarCommand, getFileOwners)

	const teamFiles = commands.registerCommand(
		teamFilesCommand,
		handleFilesOwnedBy
	)

	const activeEditor = window.onDidChangeActiveTextEditor(updateStatusBarItem)

	context.subscriptions.push(fileOwners, statusBarItem, activeEditor, teamFiles)

	updateStatusBarItem()
}

export const deactivate = () => {}
