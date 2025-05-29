// Define the base document pattern with improved slug matching
const DOCUMENT_BASE =
	'(https?):\\/\\/([\\w.-]*documentcloud\\.org)\\/documents\\/([0-9]+(?:-[\\w\\d%-]*)?)';

// Define pattern types and their associated regex patterns
export const PATTERN_CONFIGS = [
	{
		type: 'document',
		regex: new RegExp( `^${ DOCUMENT_BASE }(\\.html)?$` ),
	},
	{
		type: 'page_hash',
		regex: new RegExp(
			`^${ DOCUMENT_BASE }(\\.html)?\\/?\\??.*#document\\/p([0-9]+)$`
		),
		pageGroup: 5,
	},
	{
		type: 'page_ext',
		regex: new RegExp(
			`^${ DOCUMENT_BASE }\\/pages\\/([0-9]+)\\.(html|js)$`
		),
		pageGroup: 4,
	},
	{
		type: 'page_no_ext',
		regex: new RegExp(
			`^${ DOCUMENT_BASE }\\/pages\\/([0-9]+)\\/?\\??.*$`
		),
		pageGroup: 4,
	},
	{
		type: 'note_annotations',
		regex: new RegExp(
			`^${ DOCUMENT_BASE }\\/annotations\\/([0-9]+)\\.(html|js)$`
		),
		noteGroup: 4,
	},
	{
		type: 'note_annotations_embed',
		regex: new RegExp(
			`^${ DOCUMENT_BASE }\\/annotations\\/([0-9]+)\\/?\\??.*$`
		),
		noteGroup: 4,
	},
	{
		type: 'note_hash_page',
		regex: new RegExp(
			`^${ DOCUMENT_BASE }(\\.html)?\\/?\\??.*#document\\/p([0-9]+)\\/a([0-9]+)$`
		),
		pageGroup: 5,
		noteGroup: 6,
	},
	{
		type: 'note_hash_annotation',
		regex: new RegExp(
			`^${ DOCUMENT_BASE }(\\.html)?\\/?\\??.*#annotation\\/a([0-9]+)(\\.[a-z]+)?$`
		),
		noteGroup: 5,
	},
];
