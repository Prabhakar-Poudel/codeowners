import { CodeownerEntry } from './types'
import { getAllCodeowners } from './fileHelpers'

export class Codeowners {
	private codeownerEntries: CodeownerEntry[] = []

	public async init() {
		this.codeownerEntries = await getAllCodeowners()
	}

	public getFilesOwnedBy = (owner: string) =>
		this.getOwnerEntries(owner).map(({ pattern }) => pattern)

	public getOwnerEntries = (owner: string) =>
		this.codeownerEntries.filter(({ owners }) => owners.includes(owner))

	public getAllOwners = () =>
		Array.from(
			new Set(
				this.codeownerEntries.reduce(
					(acc: string[], { owners }) => [...acc, ...owners],
					[]
				)
			)
		).sort()

	public getFileOwnerEntries = (filePath: string) =>
		this.codeownerEntries.find(({ matcher }) => matcher.ignores(filePath))

	public getFileOwners = (filePath: string) =>
		this.getFileOwnerEntries(filePath)?.owners ?? []
}
