import { Ignore } from 'ignore'

export interface CodeownerEntry {
	matcher: Ignore
	pattern: string
	owners: string[]
}
