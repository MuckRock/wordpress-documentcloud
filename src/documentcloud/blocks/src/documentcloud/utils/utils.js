import { PATTERN_CONFIGS } from './constants';

/**
 * Get the type of DocumentCloud URL.
 *
 * @param {string} url The URL to check
 * @return {string} The URL type (document, note, page)
 */
export function getDocumentCloudUrlType( url ) {
	if ( ! url ) {
		return 'document';
	}

	// Parse the URL to extract components
	const urlComponents = parseDocumentCloudUrl( url );

	// Check for note ID - if present, it's a note URL
	if ( urlComponents.note_id ) {
		return 'note';
	}

	// Check for page number - if present, it's a page URL
	if ( urlComponents.page_number ) {
		return 'page';
	}

	// Direct check for annotation path in URL as a fallback
	if ( url.includes( '/annotations/' ) ) {
		return 'note';
	}

	// Default to document type
	return 'document';
}

/**
 * Generates the embed URL for a DocumentCloud document.
 *
 * @param {Object}  params               - Parameters for generating the URL.
 * @param {boolean} params.useDocumentId - Whether to use document ID or URL.
 * @param {string}  params.documentId    - The document ID.
 * @param {string}  params.url           - The document URL.
 * @param {boolean} params.title         - Whether to show the title.
 * @param {boolean} params.fullscreen    - Whether to show fullscreen button.
 * @param {boolean} params.onlyshoworg   - Whether to only show organization.
 * @param {boolean} params.pdf           - Whether to show PDF download link.
 * @param {string}  params.style         - Custom CSS style.
 * @param {boolean} params.responsive    - Should it be responsive.
 * @return {string} The generated embed URL.
 */
export const getEmbedUrl = ( {
	useDocumentId,
	documentId,
	url,
	title,
	fullscreen,
	onlyshoworg,
	pdf,
	style,
	responsive = true,
} ) => {
	if ( ! ( useDocumentId ? documentId : url ) ) {
		return '';
	}

	let baseUrl = '';

	if ( useDocumentId && documentId ) {
		const encodedId = encodeURIComponent( documentId.trim() );
		baseUrl = `https://www.documentcloud.org/documents/${ encodedId }`;
	} else if ( ! useDocumentId && url ) {
		baseUrl = url.trim();
		if ( ! baseUrl.startsWith( 'https://' ) ) {
			baseUrl = baseUrl.replace( /^http:\/\//, 'https://' );
		}
	}

	// Check if this is a page or note URL
	const urlType = getDocumentCloudUrlType( baseUrl );
	const isSpecialUrl = urlType === 'page' || urlType === 'note';

	// For page or note URLs, don't add query parameters if they already have a hash fragment
	if (
		isSpecialUrl &&
		( baseUrl.includes( '#document/p' ) ||
			baseUrl.includes( '#annotation/a' ) )
	) {
		// Just ensure it has embed=1
		if ( ! baseUrl.includes( 'embed=1' ) ) {
			if ( baseUrl.includes( '?' ) ) {
				baseUrl = baseUrl.replace( '?', '?embed=1&' );
			} else {
				// Insert embed parameter before the hash
				const hashIndex = baseUrl.indexOf( '#' );
				if ( hashIndex !== -1 ) {
					baseUrl =
						baseUrl.substring( 0, hashIndex ) +
						'?embed=1' +
						baseUrl.substring( hashIndex );
				} else {
					baseUrl += '?embed=1';
				}
			}
		}
		return baseUrl;
	}

	if ( typeof title !== 'boolean' ) {
		title = true;
	}

	if ( typeof fullscreen !== 'boolean' ) {
		fullscreen = true;
	}

	// For regular document URLs, add the query parameters
	const params = {
		embed: 1,
		title: title ? 1 : 0,
		fullscreen: fullscreen ? 1 : 0,
		onlyshoworg: onlyshoworg ? 1 : 0,
		pdf: pdf ? 1 : 0,
		style: style || '',
		responsive: responsive ? 1 : 0,
	};

	const queryString = Object.entries( params )
		.filter( ( [ , value ] ) => value !== '' )
		.map( ( [ key, value ] ) => {
			return `${ encodeURIComponent( key ) }=${ encodeURIComponent(
				value
			) }`;
		} )
		.join( '&' );

	return queryString ? `${ baseUrl }?${ queryString }` : baseUrl;
};

/**
 * Generates the oEmbed API URL for a DocumentCloud document.
 *
 * @param {string} documentUrl - The document URL.
 * @param {string} width       - The width of the embed.
 * @param {string} height      - The height of the embed.
 * @return {string} The generated oEmbed API URL.
 */
export const getOEmbedApiUrl = ( documentUrl, width, height ) => {
	if ( ! documentUrl ) {
		return '';
	}

	const apiBaseUrl = 'https://api.www.documentcloud.org/api/oembed/';
	const params = new URLSearchParams();
	params.append( 'url', documentUrl );
	params.append( 'format', 'json' );
	params.append( 'dnt', '1' );

	// Use maxwidth and maxheight for the oEmbed API
	if ( width ) {
		// Strip any non-numeric characters
		const numericWidth = width.toString().replace( /[^0-9]/g, '' );
		if ( numericWidth ) {
			params.append( 'maxwidth', numericWidth );
		}
	}

	if ( height ) {
		// Strip any non-numeric characters
		const numericHeight = height.toString().replace( /[^0-9]/g, '' );
		if ( numericHeight ) {
			params.append( 'maxheight', numericHeight );
		}
	}

	return `${ apiBaseUrl }?${ params.toString() }`;
};

/**
 * Parse a DocumentCloud URL into its components with optimized performance.
 *
 * @param {string} url The URL to parse
 * @return {Object} The extracted URL components
 */
export const parseDocumentCloudUrl = ( url ) => {
	if ( ! url ) {
		return {};
	}

	// Early classification to reduce pattern testing
	const patternSubset = getRelevantPatterns( url );

	// Try each relevant pattern
	for ( const patternConfig of patternSubset ) {
		const match = url.match( patternConfig.regex );

		if ( match ) {
			// Extract the common parts
			const elements = {
				protocol: match[ 1 ],
				dc_host: match[ 2 ],
				document_slug: match[ 3 ],
			};

			// Extract page number if this pattern has one
			if ( patternConfig.pageGroup && match[ patternConfig.pageGroup ] ) {
				elements.page_number = match[ patternConfig.pageGroup ];
			}

			// Extract note ID if this pattern has one
			if ( patternConfig.noteGroup && match[ patternConfig.noteGroup ] ) {
				elements.note_id = match[ patternConfig.noteGroup ];
			}

			return elements;
		}
	}

	return {};
};

/**
 * Get a subset of patterns relevant to the URL format.
 * This improves performance by reducing the number of regex tests.
 *
 * @param {string} url The URL to classify
 * @return {Array} Subset of patterns to test
 */
function getRelevantPatterns( url ) {
	// For page URLs
	if ( url.includes( '/pages/' ) ) {
		return PATTERN_CONFIGS.filter(
			( config ) =>
				config.type === 'page_ext' || config.type === 'page_no_ext'
		);
	}

	// For annotation URLs
	if ( url.includes( '/annotations/' ) ) {
		return PATTERN_CONFIGS.filter(
			( config ) => config.type === 'note_annotations'
		);
	}

	// For hash-based page references
	if ( url.includes( '#document/p' ) ) {
		if ( url.includes( '/a' ) ) {
			return PATTERN_CONFIGS.filter(
				( config ) => config.type === 'note_hash_page'
			);
		}
		return PATTERN_CONFIGS.filter(
			( config ) => config.type === 'page_hash'
		);
	}

	// For hash-based annotation references
	if ( url.includes( '#annotation/a' ) ) {
		return PATTERN_CONFIGS.filter(
			( config ) => config.type === 'note_hash_annotation'
		);
	}

	// For basic document URLs (fallback)
	return PATTERN_CONFIGS.filter( ( config ) => config.type === 'document' );
}

/**
 * Fetches oEmbed data from a given API URL
 *
 * @param {string} apiUrl - The oEmbed API URL to fetch from
 * @return {Promise<{html: string, error: string}>} - Promise resolving to object with html content and error
 */
export const fetchOEmbedData = async ( apiUrl ) => {
	try {
		const response = await fetch( apiUrl );
		if ( ! response.ok ) {
			throw new Error( `HTTP error! Status: ${ response.status }` );
		}

		const data = await response.json();

		// Extract the HTML content
		const htmlContent = data.html || '';

		return {
			html: htmlContent,
			error: '',
		};
	} catch ( error ) {
		return {
			html: '',
			error: 'Failed to load document preview.',
		};
	}
};

/**
 * Extracts configuration parameters from URL query string.
 * This allows users to paste URLs with configuration already set.
 *
 * @param {string}   rawURL                - The raw URL potentially containing query parameters.
 * @param {Function} handleDimensionChange - Function to update dimension attributes.
 * @param {Function} onChangeStyle         - Function to update style.
 * @param {Function} setAttributes         - Function to update block attributes.
 * @return {URL|undefined} A cleaned URL object with parameters removed.
 */
export const extractAttributesFromHTML = (
	rawURL,
	handleDimensionChange,
	setAttributes
) => {
	if ( ! rawURL ) {
		return;
	}

	// Parse the URL to access query parameters.
	const parsedURL = new URL( rawURL );

	if ( parsedURL ) {
		try {
			const searchParams = parsedURL.searchParams;

			// Extract height parameter.
			const localHeight = searchParams.get( 'height' );
			searchParams.delete( 'height' );
			if ( localHeight ) {
				handleDimensionChange( 'height', localHeight );
			}

			// Extract width parameter.
			const localWidth = searchParams.get( 'width' );
			searchParams.delete( 'width' );
			if ( localWidth ) {
				handleDimensionChange( 'width', localWidth );
			}

			// Extract title display parameter.
			const localTitle = String( searchParams.get( 'title' ) );
			searchParams.delete( 'title' );
			if ( [ '0', '1' ].includes( localTitle ) ) {
				const parsedTitle = localTitle === '1';
				setAttributes( { title: parsedTitle } );
			}

			// Extract organization display parameter.
			const localOnlyShowOrg = String(
				searchParams.get( 'onlyshoworg' )
			);
			searchParams.delete( 'onlyshoworg' );
			if ( [ '0', '1' ].includes( localOnlyShowOrg ) ) {
				const parsedOnlyShowOrg = localOnlyShowOrg === '1';
				setAttributes( { onlyshoworg: parsedOnlyShowOrg } );
			}

			// Extract fullscreen button parameter.
			const localFullScreen = String( searchParams.get( 'fullscreen' ) );
			searchParams.delete( 'fullscreen' );
			if ( [ '0', '1' ].includes( localFullScreen ) ) {
				const parsedFullScreen = localFullScreen === '1';
				setAttributes( { fullscreen: parsedFullScreen } );
			}

			// Extract PDF download link parameter.
			const localPdf = String( searchParams.get( 'pdf' ) );
			searchParams.delete( 'pdf' );
			if ( [ '0', '1' ].includes( localPdf ) ) {
				const parsedPdf = localPdf === '1';
				setAttributes( { pdf: parsedPdf } );
			}
		} catch {
			// Silent error handling to prevent breaking the UI.
		}
	}
	return parsedURL;
};
