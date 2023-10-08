import {
	StatusBarAlignment,
	StatusBarItem,
	commands,
	window,
	workspace
} from 'vscode'
import { Codeowners } from './codeowners'
import { openFile, ownersToText } from './extensionHelpers'

export class StatusBar {
	owner: StatusBarItem
	command = 'codeowner.fileOwners'

	constructor(private codeowners: Codeowners) {
		this.owner = window.createStatusBarItem(StatusBarAlignment.Right, 100)
		this.owner.command = this.command
	}

	register = () => commands.registerCommand(this.command, this.getFileOwners)
	getFileOwners = async () => {
		const owners = await this.getOwnersOfCurrentFile()
		this.renderFileOwnersPick(owners)
	}

	renderFileOwnersPick = async (owners: string[] | null) => {
		if (!owners) {
			return this.owner.hide()
		}
		if (owners.length === 0) {
			return window.showInformationMessage(
				'No owners found. Make sure the CODEOWNERS file is present and stored at the right path.'
			)
		}
		const owner = await window.showQuickPick(owners, {
			placeHolder: 'Select owner to view their owned files'
		})

		if (owner) {
			this.getFilesOwnedBy(owner)
		}
	}

	getOwnersOfCurrentFile = () => {
		const editor = window.activeTextEditor

		if (!editor) {
			return null
		}

		const absolutePath = editor.document.fileName
		const relativePath = workspace.asRelativePath(absolutePath)
		return this.codeowners.getFileOwners(relativePath)
	}

	getFilesOwnedBy = async (owner: string) => {
		const selectedFile = await window.showQuickPick(
			this.codeowners.getFilesOwnedBy(owner),
			{ placeHolder: 'Filter file by name' }
		)

		if (selectedFile) {
			openFile(selectedFile)
		}
	}

	updateStatusBar = async () => {
		const owners = await this.getOwnersOfCurrentFile()

		if (!owners) {
			return this.owner.hide()
		}

		this.owner.text = ownersToText(owners)
		this.owner.tooltip = 'Show owners of this file'
		this.owner.show()
	}
}
