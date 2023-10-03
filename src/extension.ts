import { window, ExtensionContext, commands } from 'vscode'

import { Codeowners } from './codeowners'
import { StatusBar } from './statusbar'
import { TreeExplorerProvider } from './treeExplorer'

const codeowners = new Codeowners()
const statusBar = new StatusBar(codeowners)
const ownedFilesCommand = 'codeowner.showFilesForOwner'
let explorereProvider: TreeExplorerProvider

const handleFilesOwnedBy = () => {
	statusBar.renderFileOwnersPick(codeowners.getAllOwners())
}

export const activate = async (context: ExtensionContext) => {
	await codeowners.init()
	const fileOwners = statusBar.register()
	const teamFiles = commands.registerCommand(
		ownedFilesCommand,
		handleFilesOwnedBy
	)

	const activeEditor = window.onDidChangeActiveTextEditor(
		statusBar.updateStatusBar
	)

	context.subscriptions.push(
		fileOwners,
		statusBar.owner,
		activeEditor,
		teamFiles
	)

	statusBar.updateStatusBar()

	explorereProvider = new TreeExplorerProvider(codeowners)
	context.subscriptions.push(explorereProvider.treeView)
}

export const deactivate = () => {}
