/**
 * WordPress dependencies.
 */
import { __ } from '@wordpress/i18n';
import { useBlockProps, InspectorControls } from '@wordpress/block-editor';
import {
	PanelBody,
	PanelRow,
	TextControl,
	ToggleControl,
	Placeholder,
	Button,
	Notice,
} from '@wordpress/components';
import {
	useState,
	useEffect,
	useCallback,
	useMemo,
	useRef,
} from '@wordpress/element';
import { debounce } from '@wordpress/compose';

/**
 * Internal dependencies.
 */
import './editor.scss';
import {
	getEmbedUrl,
	getOEmbedApiUrl,
	getDocumentCloudUrlType,
	fetchOEmbedData,
	extractAttributesFromHTML,
} from './utils/utils';
import { validateUrl, validateDocumentId } from './utils/validation';

import DocumentPreview from './components/documentcloud-preview';
import { ReactComponent as DocumentIcon } from '../../../assets/DocumentCloud-Block-Icon.svg';

/**
 * Edit component for the DocumentCloud block.
 *
 * This component manages the editor interface for the DocumentCloud block, allowing users to:
 * - Enter a DocumentCloud URL or document ID
 * - Configure display options (height, width etc.)
 * - Preview the embedded document
 *
 * The component handles validation, API fetching, and state management.
 *
 * @param {Object}   root0               The props provided by WordPress Block.
 * @param {Object}   root0.attributes    The attributes of the Block.
 * @param {Function} root0.setAttributes The function to change attributes.
 */
export default function Edit( { attributes, setAttributes } ) {
	/**
	 * Destructure all block attributes for easier access.
	 * These attributes represent the persistent state of the block.
	 */
	const {
		url,
		documentId,
		useDocumentId,
		height,
		width,
		title,
		fullscreen,
		onlyshoworg,
		pdf,
		embeddedHtml,
	} = attributes;

	/**
	 * State management section.
	 *
	 * The block uses multiple state variables to manage:
	 * - Form inputs and validation
	 * - API loading and errors
	 * - UI display modes
	 * - Temporary values before committing to block attributes
	 */
	// Validation and error states
	const [ validationMessage, setValidationMessage ] = useState( '' );
	const [ fetchError, setFetchError ] = useState( '' );

	// Temporary input values (before committing to block attributes)
	const [ tempUrl, setTempUrl ] = useState( url || '' );
	const [ tempDocumentId, setTempDocumentId ] = useState( documentId || '' );
	const [ tempDimensions, setTempDimensions ] = useState( {
		width: width || '',
		height: height || '',
	} );

	// UI state
	const [ isLoading, setIsLoading ] = useState( null );
	const [ urlType, setUrlType ] = useState(
		url ? getDocumentCloudUrlType( url ) : 'document'
	);
	const [ showEditorInput, setShowEditorInput ] = useState(
		! ( documentId || url )
	);

	/**
	 * References section.
	 *
	 * Refs are used for:
	 * - Tracking component mount status to prevent updates after unmount
	 * - Storing debounced functions to ensure proper cleanup
	 */
	const isMounted = useRef( true );
	const debouncedFetchApi = useRef( null );

	/**
	 * Derived state using useMemo.
	 *
	 * These values are computed from other state variables and
	 * will only recalculate when their dependencies change.
	 */
	// Check if the current input is valid (no validation message)
	const isValid = useMemo(
		() => validationMessage === '',
		[ validationMessage ]
	);

	// Determine if display options should be shown based on URL type
	const shouldShowDisplayOptions = urlType === 'document';

	/**
	 * Event handlers section.
	 *
	 * Each handler is wrapped in useCallback to prevent unnecessary re-renders
	 * and ensure referential stability for dependencies.
	 */

	/**
	 * Handles changes to dimension properties (width, height).
	 * Updates both temporary state and block attributes.
	 */
	const handleDimensionChange = useCallback(
		( property, value ) => {
			setTempDimensions( ( prev ) => ( {
				...prev,
				[ property ]: value,
			} ) );
			setAttributes( { [ property ]: value } );
		},
		[ setAttributes ]
	);

	/**
	 * Handles changes to the URL input.
	 * Updates temporary state and clears any validation messages.
	 */
	const onChangeUrl = useCallback( ( newUrl ) => {
		setTempUrl( newUrl );
		setValidationMessage( '' );
	}, [] );

	/**
	 * Handles changes to the Document ID input.
	 * Validates that the input contains only digits and updates temporary state.
	 * Sets validation message if non-digit characters are found.
	 */
	const onChangeDocumentId = useCallback( ( newId ) => {
		const hasNonDigit = /[^0-9]/.test( String( String( newId ).trim() ) );

		if ( hasNonDigit ) {
			setValidationMessage(
				__( 'Document ID can only contain digits.', 'documentcloud' )
			);
			return;
		}
		setTempDocumentId( newId );
		setValidationMessage( '' );
	}, [] );

	/**
	 * Toggles between URL and Document ID input modes.
	 * Updates the useDocumentId attribute and clears validation messages.
	 */
	const toggleInputType = useCallback( () => {
		setAttributes( { useDocumentId: ! useDocumentId } );
		setValidationMessage( '' );
	}, [ useDocumentId, setAttributes ] );

	/**
	 * Handles the embed form submission.
	 * Validates input based on the current mode (URL or Document ID).
	 * If valid, updates block attributes and hides the editor input.
	 *
	 * For URLs, it also:
	 * - Detects the URL type
	 * - Extracts attributes from HTML (if embedded code is pasted)
	 */
	const handleEmbed = useCallback(
		( event ) => {
			event.preventDefault();
			setIsLoading( null );
			try {
				if ( useDocumentId ) {
					// Document ID validation and processing
					const sanitizedId = tempDocumentId.trim();
					const validationResult = validateDocumentId( sanitizedId );
					setValidationMessage( validationResult.message );

					if ( validationResult.valid ) {
						setAttributes( {
							documentId: sanitizedId,
							url: '',
							embeddedHtml: '',
						} );
						setUrlType( 'document' );
						setShowEditorInput( false );
					}
				} else {
					// URL validation and processing
					let sanitizedUrl = tempUrl.trim();
					const validationResult = validateUrl( sanitizedUrl );
					setValidationMessage( validationResult.message );

					if ( validationResult.valid ) {
						const detectedUrlType =
							getDocumentCloudUrlType( sanitizedUrl );
						setUrlType( detectedUrlType );

						if ( detectedUrlType === 'document' ) {
							// Extract attributes from HTML if it's an embed code
							const cleanURL = extractAttributesFromHTML(
								sanitizedUrl,
								handleDimensionChange,
								setAttributes
							);

							if ( cleanURL ) {
								sanitizedUrl = cleanURL.toString();
							}
						}

						setAttributes( {
							url: sanitizedUrl,
							documentId: '',
							embeddedHtml: '',
						} );
						setShowEditorInput( false );
					}
				}
			} catch ( error ) {
				setValidationMessage(
					__(
						'An unexpected error occurred. Please try again.',
						'documentcloud'
					)
				);
			}
		},
		[
			useDocumentId,
			tempDocumentId,
			tempUrl,
			setAttributes,
			handleDimensionChange,
		]
	);

	/**
	 * Shows the editor input form to allow changing the document.
	 * Clears any validation messages.
	 */
	const displayEditorInput = useCallback( () => {
		setShowEditorInput( true );
		setValidationMessage( '' );
	}, [] );

	/**
	 * Generates the embed URL based on current attributes and settings.
	 * Determines if responsive layout should be used based on dimensions.
	 *
	 * This function is used for both preview and API fetching.
	 */
	const generateEmbedUrl = useCallback( () => {
		const responsive =
			String( tempDimensions.width ).length === 0 &&
			String( tempDimensions.height ).length === 0;

		return getEmbedUrl( {
			useDocumentId,
			documentId,
			url,
			title,
			fullscreen,
			onlyshoworg,
			pdf,
			width: tempDimensions.width,
			height: tempDimensions.height,
			responsive,
		} );
	}, [
		useDocumentId,
		documentId,
		url,
		title,
		fullscreen,
		onlyshoworg,
		pdf,
		tempDimensions,
	] );

	/**
	 * Generates the oEmbed API URL using the embed URL.
	 * Used to fetch the HTML for embedding the document.
	 */
	const generateOEmbedApiUrl = useCallback( () => {
		const documentUrl = generateEmbedUrl();
		return getOEmbedApiUrl( documentUrl, width, height );
	}, [ generateEmbedUrl, width, height ] );

	/**
	 * Effects section.
	 *
	 * These useEffect hooks manage side effects for:
	 * - Component lifecycle
	 * - Synchronizing state
	 * - Debounced operations
	 * - API fetching
	 */

	/**
	 * Component mount/unmount lifecycle effect.
	 * Sets up a ref to track mount status for preventing updates after unmount.
	 */
	useEffect( () => {
		isMounted.current = true;
		return () => {
			isMounted.current = false;
		};
	}, [] );

	/**
	 * Syncs temporary input values when editor input visibility changes.
	 * Ensures input fields show current attribute values.
	 */
	useEffect( () => {
		if ( showEditorInput ) {
			setTempUrl( url || '' );
			setTempDocumentId( documentId || '' );
		}
	}, [ showEditorInput, url, documentId ] );

	/**
	 * Updates URL type when URL changes.
	 * This affects which options are displayed in the sidebar.
	 */
	useEffect( () => {
		if ( url && isMounted.current ) {
			setUrlType( getDocumentCloudUrlType( url ) );
		}
	}, [ url ] );

	/**
	 * Syncs temporary dimensions when block attributes change.
	 * Ensures the UI reflects the current block state.
	 */
	useEffect( () => {
		if ( isMounted.current ) {
			setTempDimensions( {
				width: width || '',
				height: height || '',
			} );
		}
	}, [ width, height ] );

	/**
	 * Sets up debounced API fetching.
	 *
	 * Creates a function that waits 700ms before fetching oEmbed data.
	 * Handles loading state and errors.
	 * Only updates the embeddedHtml attribute if fetch succeeds.
	 * Properly cleans up the debounced function on unmount.
	 */
	useEffect( () => {
		debouncedFetchApi.current = debounce( async ( apiUrl ) => {
			if (
				! apiUrl ||
				showEditorInput ||
				! isValid ||
				! isMounted.current
			) {
				return;
			}

			setIsLoading( true );
			setFetchError( '' );

			const { html, error } = await fetchOEmbedData( apiUrl );

			if ( isMounted.current ) {
				if ( error ) {
					setFetchError( error );
				}

				setAttributes( { embeddedHtml: html } );
				setIsLoading( false );
			}
		}, 700 );

		return () => {
			if ( debouncedFetchApi.current ) {
				debouncedFetchApi.current.cancel();
			}
		};
	}, [ showEditorInput, isValid, setAttributes ] );

	/**
	 * Triggers API fetch when relevant dependencies change.
	 *
	 * This effect runs when:
	 * - The API URL changes (due to changed attributes)
	 * - The editor input visibility changes
	 * - The input validation state changes
	 */
	useEffect( () => {
		const apiUrl = generateOEmbedApiUrl();
		if (
			apiUrl &&
			! showEditorInput &&
			isValid &&
			debouncedFetchApi.current
		) {
			debouncedFetchApi.current( apiUrl );
		}
	}, [ generateOEmbedApiUrl, showEditorInput, isValid ] );

	/**
	 * Get block props for the main container.
	 * This adds required WordPress attributes to the block.
	 */
	const blockProps = useBlockProps();

	return (
		<>
			{ /*
			 * Inspector Controls section.
			 *
			 * This renders in the block editor sidebar and contains:
			 * - Document settings (dimensions)
			 * - Display options (conditionally rendered based on URL type)
			 */ }
			<InspectorControls>
				{ /* Document Settings Panel */ }
				<PanelBody
					title={ __( 'Document Settings', 'documentcloud' ) }
					initialOpen={ true }
				>
					{ /* Height Setting */ }
					<PanelRow>
						<TextControl
							__next40pxDefaultSize
							__nextHasNoMarginBottom
							type="number"
							label={ __( 'Height', 'documentcloud' ) }
							value={ tempDimensions.height }
							onChange={ ( value ) =>
								handleDimensionChange( 'height', value )
							}
							help={ __(
								'Set the height (Only numeric values allowed).',
								'documentcloud'
							) }
						/>
					</PanelRow>

					{ /* Width Setting */ }
					<PanelRow>
						<TextControl
							__next40pxDefaultSize
							__nextHasNoMarginBottom
							type="number"
							label={ __( 'Width', 'documentcloud' ) }
							value={ tempDimensions.width }
							onChange={ ( value ) =>
								handleDimensionChange( 'width', value )
							}
							help={ __(
								'Set the width (Only Numberic Values are allowed).',
								'documentcloud'
							) }
						/>
					</PanelRow>
				</PanelBody>

				{ /*
				 * Display Options Panel.
				 * Only shown for document URLs, not for other types.
				 */ }
				{ shouldShowDisplayOptions && (
					<PanelBody
						title={ __( 'Display Options', 'documentcloud' ) }
						initialOpen={ true }
					>
						{ /* Title Toggle */ }
						<PanelRow>
							<ToggleControl
								__next40pxDefaultSize
								__nextHasNoMarginBottom
								label={ __( 'Show Title', 'documentcloud' ) }
								checked={ title }
								onChange={ () =>
									setAttributes( { title: ! title } )
								}
								help={ __(
									'Show document title and contributor name.',
									'documentcloud'
								) }
							/>
						</PanelRow>

						{ /* Fullscreen Toggle */ }
						<PanelRow>
							<ToggleControl
								__next40pxDefaultSize
								__nextHasNoMarginBottom
								label={ __(
									'Show Fullscreen Button',
									'documentcloud'
								) }
								checked={ fullscreen }
								onChange={ () =>
									setAttributes( {
										fullscreen: ! fullscreen,
									} )
								}
								help={ __(
									'Show fullscreen control.',
									'documentcloud'
								) }
							/>
						</PanelRow>

						{ /* Only Show Organization Toggle */ }
						<PanelRow>
							<ToggleControl
								__next40pxDefaultSize
								__nextHasNoMarginBottom
								label={ __(
									'Only Show Organization',
									'documentcloud'
								) }
								checked={ onlyshoworg }
								onChange={ () =>
									setAttributes( {
										onlyshoworg: ! onlyshoworg,
									} )
								}
								help={ __(
									'Show affiliation without username.',
									'documentcloud'
								) }
							/>
						</PanelRow>

						{ /* PDF Download Toggle */ }
						<PanelRow>
							<ToggleControl
								__next40pxDefaultSize
								__nextHasNoMarginBottom
								label={ __(
									'Show PDF Download Link',
									'documentcloud'
								) }
								checked={ pdf }
								onChange={ () =>
									setAttributes( { pdf: ! pdf } )
								}
								help={ __(
									'Shows PDF download link.',
									'documentcloud'
								) }
							/>
						</PanelRow>
					</PanelBody>
				) }
			</InspectorControls>

			{ /*
			 * Main Block Content.
			 *
			 * Either displays:
			 * 1. Document Preview - when a valid document is embedded
			 * 2. Input Form - when no document is embedded or user is changing the document
			 */ }
			<div { ...blockProps }>
				{ ! showEditorInput && isValid ? (
					// Document Preview Component
					<DocumentPreview
						embeddedHtml={ embeddedHtml }
						isLoading={ isLoading }
						fetchError={ fetchError }
						urlType={ urlType }
						width={ width }
						height={ height }
						onChangeDocument={ displayEditorInput }
					/>
				) : (
					// Input Form Placeholder
					<Placeholder
						icon={ <DocumentIcon /> }
						label={ __( 'DocumentCloud', 'documentcloud' ) }
						instructions={
							useDocumentId
								? __(
										'Enter a DocumentCloud ID to embed a document.',
										'documentcloud'
								  )
								: __(
										'Enter a DocumentCloud URL to embed a document, page or note.',
										'documentcloud'
								  )
						}
					>
						{ /* Validation Error Notice */ }
						{ ! isValid && validationMessage && (
							<Notice status="error" isDismissible={ false }>
								{ validationMessage }
							</Notice>
						) }

						{ /* Embed Form */ }
						<form
							onSubmit={ handleEmbed }
							className="documentcloud-form"
						>
							<div className="documentcloud-input-wrapper">
								{ /* Toggle between URL and Document ID input */ }
								<ToggleControl
									label={ __(
										'Use Document ID',
										'documentcloud'
									) }
									checked={ useDocumentId }
									onChange={ toggleInputType }
									help={ __(
										'Toggle between URL and Document ID input.',
										'documentcloud'
									) }
								/>

								{ /* Conditional rendering of input field based on mode */ }
								<div className="documentcloud-input-row">
									{ useDocumentId ? (
										// Document ID Input
										<>
											<TextControl
												value={ tempDocumentId }
												inputMode={ 'numeric' }
												pattern="[0-9]*"
												onChange={ onChangeDocumentId }
												type={ 'text' }
												placeholder={ __(
													'123456789',
													'documentcloud'
												) }
												className={
													! isValid && tempDocumentId
														? 'has-error'
														: ''
												}
											/>
										</>
									) : (
										// URL Input
										<TextControl
											value={ tempUrl }
											onChange={ onChangeUrl }
											placeholder={ __(
												'https://www.documentcloud.org/documents/…',
												'documentcloud'
											) }
											className={
												! isValid && tempUrl
													? 'has-error'
													: ''
											}
										/>
									) }
									{ /* Embed Button */ }
									<Button variant="primary" type="submit">
										{ __( 'Embed', 'documentcloud' ) }
									</Button>
								</div>
							</div>
						</form>
					</Placeholder>
				) }
			</div>
		</>
	);
}
