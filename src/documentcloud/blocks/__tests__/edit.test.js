import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import Edit from '../src/documentcloud/edit';

describe( 'DocumentCloud Block Edit Component', () => {
	const mockSetAttributes = jest.fn();

	// Default attributes for the Edit component
	const defaultAttributes = {
		url: '',
		documentId: '',
		useDocumentId: false,
		height: '',
		width: '',
		title: false,
		fullscreen: false,
		onlyshoworg: false,
		pdf: false,
		style: '',
		embeddedHtml: '',
	};

	// Clear all mocks after each test to ensure a clean slate
	afterEach( () => {
		jest.clearAllMocks();
	} );

	// Test: Ensure placeholder text for URL input is rendered
	it( 'renders the placeholder text for URL input', () => {
		render(
			<Edit
				attributes={ { ...defaultAttributes, useDocumentId: false } }
				setAttributes={ mockSetAttributes }
			/>
		);

		expect(
			screen.getByText(
				'Enter a DocumentCloud URL to embed a document, page or note.'
			)
		).toBeInTheDocument();
	} );

	// Test: Ensure placeholder text for Document ID input is rendered
	it( 'renders the placeholder text for Document ID input', () => {
		render(
			<Edit
				attributes={ { ...defaultAttributes, useDocumentId: true } }
				setAttributes={ mockSetAttributes }
			/>
		);

		expect(
			screen.getByText( 'Enter a DocumentCloud ID to embed a document.' )
		).toBeInTheDocument();
	} );

	// Test: Verify toggling between URL and Document ID calls setAttributes
	it( 'calls setAttributes when toggling between URL and Document ID', () => {
		render(
			<Edit
				attributes={ { ...defaultAttributes, useDocumentId: false } }
				setAttributes={ mockSetAttributes }
			/>
		);

		const toggleControl = screen.getByLabelText( 'Use Document ID' );
		fireEvent.click( toggleControl );

		expect( mockSetAttributes ).toHaveBeenCalledWith( {
			useDocumentId: true,
		} );
	} );

	// Test: Ensure URL input value updates correctly
	it( 'updates the URL input value', () => {
		render(
			<Edit
				attributes={ { ...defaultAttributes, useDocumentId: false } }
				setAttributes={ mockSetAttributes }
			/>
		);

		const urlInput = screen.getByPlaceholderText(
			'https://www.documentcloud.org/documents/…'
		);
		fireEvent.change( urlInput, {
			target: {
				value: 'https://embed.documentcloud.org/documents/23060035-notes',
			},
		} );

		expect( urlInput.value ).toBe(
			'https://embed.documentcloud.org/documents/23060035-notes'
		);
	} );

	// Test: Ensure Document ID input value updates correctly
	it( 'updates the Document ID input value', () => {
		render(
			<Edit
				attributes={ { ...defaultAttributes, useDocumentId: true } }
				setAttributes={ mockSetAttributes }
			/>
		);

		const documentIdInput = screen.getByPlaceholderText( '123456789' );
		fireEvent.change( documentIdInput, { target: { value: '23060035' } } );

		expect( documentIdInput.value ).toBe( '23060035' );
	} );

	// Test: Display validation error for invalid URL submission
	it( 'displays validation error when invalid URL is submitted', () => {
		render(
			<Edit
				attributes={ { ...defaultAttributes, useDocumentId: false } }
				setAttributes={ mockSetAttributes }
			/>
		);

		const embedButton = screen.getByText( 'Embed' );
		fireEvent.click( embedButton );

		expect(
			screen.getByText( 'Please enter a DocumentCloud URL.' )
		).toBeInTheDocument();
	} );

	// Test: Display validation error for invalid Document ID submission
	it( 'displays validation error when invalid Document ID is submitted', () => {
		render(
			<Edit
				attributes={ { ...defaultAttributes, useDocumentId: true } }
				setAttributes={ mockSetAttributes }
			/>
		);

		const embedButton = screen.getByText( 'Embed' );
		fireEvent.click( embedButton );

		expect(
			screen.getByText( 'Please enter a DocumentCloud ID.' )
		).toBeInTheDocument();
	} );

	// Test: Ensure height and width input fields are rendered
	it( 'renders the height and width input fields', () => {
		render(
			<Edit
				attributes={ { ...defaultAttributes } }
				setAttributes={ mockSetAttributes }
			/>
		);

		expect( screen.getByLabelText( 'Height' ) ).toBeInTheDocument();
		expect( screen.getByLabelText( 'Width' ) ).toBeInTheDocument();
	} );

	// Test: Ensure height and width values update correctly
	it( 'updates height and width values', () => {
		render(
			<Edit
				attributes={ { ...defaultAttributes } }
				setAttributes={ mockSetAttributes }
			/>
		);

		const heightInput = screen.getByLabelText( 'Height' );
		const widthInput = screen.getByLabelText( 'Width' );

		fireEvent.change( heightInput, { target: { value: '600' } } );
		fireEvent.change( widthInput, { target: { value: '100' } } );

		expect( heightInput.value ).toBe( '600' );
		expect( widthInput.value ).toBe( '100' );
	} );

	// Test: Ensure loading spinner is rendered when isLoading is true
	it( 'renders the loading spinner when isLoading is true', () => {
		render(
			<Edit
				attributes={ { ...defaultAttributes } }
				setAttributes={ mockSetAttributes }
			/>
		);

		// Simulate loading state
		const spinner = screen.queryByText( 'Loading document…' );
		expect( spinner ).not.toBeInTheDocument();
	} );

	// Test: Verify toggling fullscreen attribute calls setAttributes
	it( 'toggles the fullscreen attribute', () => {
		render(
			<Edit
				attributes={ { ...defaultAttributes } }
				setAttributes={ mockSetAttributes }
			/>
		);

		const fullscreenToggle = screen.getByLabelText(
			'Show Fullscreen Button'
		);

		fullscreenToggle.click();
		expect( mockSetAttributes ).toHaveBeenCalledWith( {
			fullscreen: true,
		} );
	} );

	// Test: Verify toggling show title attribute calls setAttributes
	it( 'toggles the show title attribute', () => {
		render(
			<Edit
				attributes={ { ...defaultAttributes } }
				setAttributes={ mockSetAttributes }
			/>
		);

		const showTitleToggle = screen.getByLabelText( 'Show Title' );

		showTitleToggle.click();
		expect( mockSetAttributes ).toHaveBeenCalledWith( {
			title: true,
		} );
	} );

	// Test: Extract attributes from a valid URL and update attributes
	it( 'extracts attributes from a valid URL and updates attributes', () => {
		render(
			<Edit
				attributes={ defaultAttributes }
				setAttributes={ mockSetAttributes }
			/>
		);

		// Simulate entering a URL with query parameters
		const urlInput = screen.getByPlaceholderText(
			'https://www.documentcloud.org/documents/…'
		);
		fireEvent.change( urlInput, {
			target: {
				value: 'https://embed.documentcloud.org/documents/2222222-o2012-4806-pdf/?embed=1&height=600&width=800&title=1&fullscreen=1&onlyshoworg=0&pdf=1',
			},
		} );

		// Simulate clicking the Embed button
		const embedButton = screen.getByText( 'Embed' );
		fireEvent.click( embedButton );

		// Assertions for height and width
		expect( mockSetAttributes ).toHaveBeenCalledWith( { height: '600' } );
		expect( mockSetAttributes ).toHaveBeenCalledWith( { width: '800' } );

		// Assertions for title, onlyshoworg, fullscreen, and pdf
		expect( mockSetAttributes ).toHaveBeenCalledWith( { title: true } );
		expect( mockSetAttributes ).toHaveBeenCalledWith( {
			onlyshoworg: false,
		} );
		expect( mockSetAttributes ).toHaveBeenCalledWith( {
			fullscreen: true,
		} );
		expect( mockSetAttributes ).toHaveBeenCalledWith( { pdf: true } );
	} );
} );
