import {
	StatusBarItem,
	window,
	workspace,
	ExtensionContext,
	StatusBarAlignment,
	commands
} from 'vscode'
import Codeowners = require('@nmann/codeowners')

let statusBarItem: StatusBarItem
const statusBarCommand = 'codeowners.fileOwners'

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

export function activate(context: ExtensionContext) {
	statusBarItem = window.createStatusBarItem(StatusBarAlignment.Right, 100)
	statusBarItem.command = statusBarCommand

	const fileOwners = commands.registerCommand(statusBarCommand, () =>
		window.showQuickPick(getOwners() ?? [])
	)

	const activeEditor = window.onDidChangeActiveTextEditor(updateStatusBarItem)

	context.subscriptions.push(fileOwners, statusBarItem, activeEditor)

	updateStatusBarItem()
}

export function deactivate() {}
