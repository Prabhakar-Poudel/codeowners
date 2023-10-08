import ignore from 'ignore'
import { workspace, Uri } from 'vscode'

import type { CodeownerEntry } from './types'

const CODEOWNERS_GLOB =
	'{.github/CODEOWNERS,.gitlab/CODEOWNERS,docs/CODEOWNERS,CODEOWNERS}'

export const findCodeownersFile = async () => {
	const files = await workspace.findFiles(CODEOWNERS_GLOB)
	return files[0]?.path
}

const codeownerLineToEntry = (line: string) => {
	const [pattern, ...ownerParts] = line.split('#')[0].split(/\s+/)

	return {
		matcher: ignore().add(pattern),
		pattern,
		owners: ownerParts.filter(Boolean)
	}
}

const commentRegex = /^#|\[.*\]$/

export const parseCodeowners = (codeownersContent: string): CodeownerEntry[] =>
	codeownersContent
		.split('\n')
		.map((line) => line.trim())
		.filter((line) => line && !commentRegex.test(line))
		.map(codeownerLineToEntry)
		.reverse()

export const readCodeOwners = async (codeownersPath: string) => {
	const content = await workspace.fs.readFile(Uri.file(codeownersPath))
	return content.toString()
}

export const getAllCodeowners = async () => {
	const file = await findCodeownersFile()

	if (!file) {
		return []
	}

	const codeownersContent = await readCodeOwners(file)
	return parseCodeowners(codeownersContent)
}
