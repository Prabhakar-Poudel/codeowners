import { workspace, commands, Uri, FileType } from 'vscode'

export const ownersToText = (owners: string[]) => {
	if (owners.length >= 2) {
		return `${owners[0]} +${owners.length - 1}`
	} else if (owners.length === 1) {
		return `${owners[0]}`
	} else {
		return 'No owner'
	}
}

export const openFile = async (file: string) => {
	const workspaceUri = workspace.workspaceFolders?.[0].uri
	if (!workspaceUri) {
		return
	}

	try {
		const uri = Uri.joinPath(workspaceUri, file)
		const stat = await workspace.fs.stat(uri)

		if (stat.type === FileType.Directory) {
			await commands.executeCommand('revealInExplorer', uri)
			commands.executeCommand('workbench.action.quickOpen', file)
		} else if (stat.type === FileType.File) {
			commands.executeCommand('vscode.open', uri)
		}
	} catch {
		commands.executeCommand('workbench.action.quickOpen', file)
	}
}
