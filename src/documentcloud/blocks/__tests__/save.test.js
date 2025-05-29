import React from 'react';
import save from '../src/documentcloud/save';
import { render } from '@testing-library/react';
import '@testing-library/jest-dom';

// Mock the useBlockProps.save function from @wordpress/block-editor
jest.mock( '@wordpress/block-editor', () => ( {
	useBlockProps: {
		save: jest.fn( () => ( {
			className: 'wp-block-documentcloud',
		} ) ),
	},
} ) );

describe( 'DocumentCloud Block Save Component', () => {
	it( 'renders an empty container when no embeddedHtml is provided', () => {
		const attributes = {
			embeddedHtml: '',
		};

		const { container } = render( save( { attributes } ) );

		// Ensure the container is rendered with the correct className
		expect( container.firstChild ).toHaveClass( 'wp-block-documentcloud' );
		// Ensure the container is empty
		expect( container.firstChild ).toBeEmptyDOMElement();
	} );

	it( 'renders the embedded HTML when embeddedHtml is provided', () => {
		const attributes = {
			embeddedHtml:
				'<iframe src="https://embed.documentcloud.org/documents/23060035-notes"></iframe>',
		};

		const { container } = render( save( { attributes } ) );

		// Ensure the container is rendered with the correct className
		expect( container.firstChild ).toHaveClass( 'wp-block-documentcloud' );
		// Ensure the embedded HTML is rendered inside the container
		expect(
			container.querySelector( '.documentcloud-embed' )
		).toBeInTheDocument();
		expect(
			container.querySelector( '.documentcloud-embed' ).innerHTML
		).toBe(
			'<iframe src="https://embed.documentcloud.org/documents/23060035-notes"></iframe>'
		);
	} );

	// add snapshot test
	it( 'matches the snapshot', () => {
		const attributes = {
			embeddedHtml:
				'<iframe src="https://embed.documentcloud.org/documents/23060035-notes"></iframe>',
		};

		const { container } = render( save( { attributes } ) );

		expect( container ).toMatchSnapshot();
	} );
} );
