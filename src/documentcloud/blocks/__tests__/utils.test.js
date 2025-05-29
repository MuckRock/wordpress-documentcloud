import {
	getDocumentCloudUrlType,
	getEmbedUrl,
	getOEmbedApiUrl,
	parseDocumentCloudUrl,
	cleanDocumentCloudUrl,
} from '../src/documentcloud/utils/utils';

describe( 'DocumentCloud Utils', () => {
	// Tests for getDocumentCloudUrlType
	describe( 'getDocumentCloudUrlType', () => {
		it( 'should return "document" for an empty URL', () => {
			// Verifies that an empty URL is treated as a standard document
			expect( getDocumentCloudUrlType( '' ) ).toBe( 'document' );
		} );

		it( 'should return "note" for a note URL', () => {
			// Checks if a URL with a note fragment is identified as a "note"
			const url =
				'https://www.documentcloud.org/documents/123#document/p1/a1';
			expect( getDocumentCloudUrlType( url ) ).toBe( 'note' );
		} );

		it( 'should return "note" for a note URL with a different pattern', () => {
			// Ensures that a note URL with an alternate structure is identified as a "note"
			const url =
				'https://embed.documentcloud.org/documents/282753/annotations/42225/?embed=1';
			expect( getDocumentCloudUrlType( url ) ).toBe( 'note' );
		} );

		it( 'should return "page" for a page URL', () => {
			// Validates that a URL pointing to a specific page is identified as a "page"
			const url =
				'https://www.documentcloud.org/documents/123#document/p1';
			expect( getDocumentCloudUrlType( url ) ).toBe( 'page' );
		} );

		it( 'should return "document" for a standard document URL', () => {
			// Confirms that a standard document URL is identified as "document"
			const url = 'https://www.documentcloud.org/documents/123';
			expect( getDocumentCloudUrlType( url ) ).toBe( 'document' );
		} );
	} );

	// Tests for getEmbedUrl
	describe( 'getEmbedUrl', () => {
		it( 'should return an empty string if no documentId or URL is provided', () => {
			// Ensures that an empty string is returned when no parameters are provided
			expect( getEmbedUrl( {} ) ).toBe( '' );
		} );

		it( 'should generate an embed URL using documentId', () => {
			// Verifies that an embed URL is correctly generated using a document ID
			const params = {
				useDocumentId: true,
				documentId: '123',
				title: true,
				fullscreen: false,
				onlyshoworg: false,
				pdf: true,
				style: 'custom-style',
				responsive: true,
			};
			expect( getEmbedUrl( params ) ).toBe(
				'https://www.documentcloud.org/documents/123?embed=1&title=1&fullscreen=0&onlyshoworg=0&pdf=1&style=custom-style&responsive=1'
			);
		} );

		it( 'should generate an embed URL using a URL', () => {
			// Validates that an embed URL is correctly generated using a full URL
			const params = {
				useDocumentId: false,
				url: 'https://embed.documentcloud.org/documents/24479621-24-03-13-epic-motion-to-enforce-injunction',
				title: false,
				fullscreen: true,
				onlyshoworg: true,
				pdf: false,
				style: 'border: 1px solid #000;',
				responsive: false,
			};
			expect( getEmbedUrl( params ) ).toBe(
				'https://embed.documentcloud.org/documents/24479621-24-03-13-epic-motion-to-enforce-injunction?embed=1&title=0&fullscreen=1&onlyshoworg=1&pdf=0&style=border%3A%201px%20solid%20%23000%3B&responsive=0'
			);
		} );
	} );

	// Tests for getOEmbedApiUrl
	describe( 'getOEmbedApiUrl', () => {
		it( 'should return an empty string if no document URL is provided', () => {
			// Ensures that an empty string is returned when no URL is provided
			expect( getOEmbedApiUrl( '', '', '' ) ).toBe( '' );
		} );

		it( 'should generate an oEmbed API URL with width and height', () => {
			// Verifies that the oEmbed API URL is correctly generated with width and height
			const url = 'https://www.documentcloud.org/documents/123';
			expect( getOEmbedApiUrl( url, '800', '600' ) ).toBe(
				'https://api.www.documentcloud.org/api/oembed/?url=https%3A%2F%2Fwww.documentcloud.org%2Fdocuments%2F123&format=json&dnt=1&maxwidth=800&maxheight=600'
			);
		} );
	} );

	// Tests for parseDocumentCloudUrl
	describe( 'parseDocumentCloudUrl', () => {
		it( 'should return an empty object for an empty URL', () => {
			// Ensures that an empty object is returned for an empty URL
			expect( parseDocumentCloudUrl( '' ) ).toEqual( {} );
		} );

		it( 'should parse a standard document URL', () => {
			// Validates that a standard document URL is parsed correctly
			const url =
				'https://www.documentcloud.org/documents/282753-lefler-thesis';
			expect( parseDocumentCloudUrl( url ) ).toEqual( {
				protocol: 'https',
				dc_host: 'www.documentcloud.org',
				document_slug: '282753-lefler-thesis',
			} );
		} );

		it( 'should parse a page URL', () => {
			// Verifies that a URL pointing to a specific page is parsed correctly
			const url =
				'https://www.documentcloud.org/documents/282753-lefler-thesis/#document/p13';
			expect( parseDocumentCloudUrl( url ) ).toEqual( {
				protocol: 'https',
				dc_host: 'www.documentcloud.org',
				document_slug: '282753-lefler-thesis',
				page_number: '13',
			} );
		} );

		it( 'should parse a note URL', () => {
			// Ensures that a URL containing a note is parsed correctly
			const url =
				'https://www.documentcloud.org/documents/282753-lefler-thesis/#document/p1/a53674';
			expect( parseDocumentCloudUrl( url ) ).toEqual( {
				protocol: 'https',
				dc_host: 'www.documentcloud.org',
				document_slug: '282753-lefler-thesis',
				note_id: '53674',
				page_number: '1',
			} );
		} );
	} );
} );
