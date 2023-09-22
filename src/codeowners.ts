import { CodeownerEntry } from './types'
import { getAllCodeowners } from './fileHelpers'

export class Codeowners {
	private codeownerEntries: CodeownerEntry[] = []

	public async init() {
		this.codeownerEntries = await getAllCodeowners()
	}

	public getFilesOwnedBy = (owner: string) =>
		this.codeownerEntries
			.filter(({ owners }) => owners.includes(owner))
			.map(({ pattern }) => pattern)

	public getAllOwners = () =>
		Array.from(
			new Set(
				this.codeownerEntries.reduce(
					(acc: string[], { owners }) => [...acc, ...owners],
					[]
				)
			)
		).sort()

	public getFileOwners = (filePath: string) =>
		Array.from(
			this.codeownerEntries.find(({ matcher }) => matcher.ignores(filePath))
				?.owners ?? []
		)
}
