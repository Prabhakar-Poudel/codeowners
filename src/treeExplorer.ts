import {
	commands,
	EventEmitter,
	FileType,
	TreeDataProvider,
	TreeItem,
	TreeItemCollapsibleState,
	TreeView,
	Uri,
	window,
	workspace
} from 'vscode'
import { Codeowners } from './codeowners'

const sortByName = (children: Entry[]) =>
	children.sort((a, b) => {
		if (a.type === b.type) {
			return a.relativePath.localeCompare(b.relativePath)
		}
		return a.type === FileType.Directory ? -1 : 1
	})

interface Entry {
	relativePath: string
	type: FileType
	uri: Uri
}

export class TreeExplorerProvider implements TreeDataProvider<Entry> {
	private _onDidChangeTreeData = new EventEmitter<void>()
	private team: string = ''
	private ownerEntries: string[] = []
	treeView: TreeView<Entry>
	private owners: string[]

	constructor(private codeowners: Codeowners) {
		this.treeView = window.createTreeView('ownerFiles', {
			treeDataProvider: this,
			showCollapseAll: true
		})
		this.owners = this.codeowners.getAllOwners()
		commands.registerCommand(
			'codeowner.selectTreeOwner',
			this.renderFileOwnersPick
		)
	}

	readonly onDidChangeTreeData = this._onDidChangeTreeData.event

	setTeam(team: string) {
		this.team = team
		this.ownerEntries = this.codeowners.getFilesOwnedBy(team)
		this.treeView.description = team
		this._onDidChangeTreeData.fire()
	}

	renderFileOwnersPick = async () => {
		const owner = await window.showQuickPick(this.owners, {
			placeHolder: 'Select owner'
		})

		if (owner) {
			this.setTeam(owner)
		}
	}

	async getChildren(element?: Entry) {
		let dirPath: Uri
		let children: [string, FileType][] = []
		const workspaceFolder = workspace.workspaceFolders?.[0]

		if (element) {
			children = await workspace.fs.readDirectory(element.uri)
			dirPath = element.uri
		} else if (workspaceFolder) {
			children = await workspace.fs.readDirectory(workspaceFolder.uri)
			dirPath = workspaceFolder.uri
		}

		const teamEntries = children
			.map(([name, type]) => {
				const uri = Uri.joinPath(dirPath, name)
				const relativePath = workspace.asRelativePath(uri)
				return { uri, relativePath, type }
			})
			.filter(({ type, relativePath }) => {
				const path =
					type === FileType.Directory ? `${relativePath}/` : relativePath

				return (
					this.ownerEntries.some((glob) => glob.includes(path)) ||
					this.codeowners.getFileOwners(path).includes(this.team)
				)
			})

		sortByName(teamEntries)

		return teamEntries
	}

	getTreeItem(element: Entry) {
		const collapsed =
			element.type === FileType.Directory
				? TreeItemCollapsibleState.Collapsed
				: TreeItemCollapsibleState.None

		const treeItem = new TreeItem(element.uri, collapsed)
		treeItem.tooltip = element.relativePath
		if (element.type === FileType.File) {
			treeItem.command = {
				command: 'vscode.open',
				title: 'Open file',
				arguments: [element.uri]
			}
		}
		return treeItem
	}
}
