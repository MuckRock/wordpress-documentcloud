import { __ } from '@wordpress/i18n';

/**
 * Validates a DocumentCloud URL.
 * Checks for HTTPS protocol and valid DocumentCloud domains.
 *
 * @param {string} testUrl - The URL to validate.
 * @return {Object} Object with valid (boolean) and message (string) properties.
 */
export const validateUrl = ( testUrl ) => {
	// URL cannot be empty.
	if ( ! testUrl ) {
		return {
			valid: false,
			message: __( 'Please enter a DocumentCloud URL.', 'documentcloud' ),
		};
	}

	const sanitizedUrl = testUrl.trim();

	// List of valid DocumentCloud domains.
	const validDomains = new Set( [
		'documentcloud.org',
		'www.documentcloud.org',
		'beta.documentcloud.org',
		'embed.documentcloud.org',
		'assets.documentcloud.org',
	] );

	try {
		// Parse URL to validate and extract components.
		const urlObj = new URL( sanitizedUrl );

		// URL must use HTTPS protocol.
		if ( 'https:' !== urlObj.protocol ) {
			return {
				valid: false,
				message: __( 'URL must use HTTPS protocol.', 'documentcloud' ),
			};
		}

		// URL hostname must be a valid DocumentCloud domain.
		if ( validDomains.has( urlObj.hostname ) ) {
			return { valid: true, message: '' };
		}

		return {
			valid: false,
			message: __(
				'URL must be from a valid DocumentCloud domain.',
				'documentcloud'
			),
		};
	} catch ( e ) {
		// Return error if URL parsing fails.
		return {
			valid: false,
			message: __( 'Please enter a valid URL.', 'documentcloud' ),
		};
	}
};

/**
 * Validates a DocumentCloud Document ID.
 * Currently only checks that ID is not empty.
 *
 * @param {string} id - The Document ID to validate.
 * @return {Object} Object with valid (boolean) and message (string) properties.
 */
export const validateDocumentId = ( id ) => {
	if ( ! id ) {
		return {
			valid: false,
			message: __( 'Please enter a DocumentCloud ID.', 'documentcloud' ),
		};
	}
	return { valid: true, message: '' };
};

/**
 * Validates CSS style syntax.
 * Performs basic validation to ensure style string has valid CSS format.
 *
 * @param {string} styleString - The CSS style string to validate.
 * @return {Object} Object with valid (boolean) and message (string) properties.
 */
export const validateStyle = ( styleString ) => {
	// Empty style is always valid.
	if ( ! styleString || '' === styleString.trim() ) {
		return { valid: true, message: '' };
	}

	try {
		// If style doesn't have basic CSS syntax characters, it's valid.
		if ( ! styleString.includes( ';' ) && ! styleString.includes( ':' ) ) {
			return { valid: true, message: '' };
		}

		// Split style into individual declarations.
		const styleEntries = styleString.split( ';' ).filter( Boolean );

		// Validate each CSS declaration.
		for ( const entry of styleEntries ) {
			if ( entry.trim() && ! entry.includes( ':' ) ) {
				continue;
			}

			if ( entry.trim() && entry.includes( ':' ) ) {
				const colonIndex = entry.indexOf( ':' );
				const property = entry.substring( 0, colonIndex ).trim();

				// Property name cannot be empty.
				if ( ! property ) {
					return {
						valid: false,
						message: __(
							'Invalid CSS: Empty property name.',
							'documentcloud'
						),
					};
				}
			}
		}

		return { valid: true, message: '' };
	} catch ( error ) {
		// Return validation error if an exception occurs.
		return {
			valid: false,
			message: `${ __( 'Invalid CSS:', 'documentcloud' ) } ${
				error.message
			}`,
		};
	}
};
