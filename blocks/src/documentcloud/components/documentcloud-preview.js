/**
 * WordPress dependencies.
 */
import { __ } from '@wordpress/i18n';
import { Button, Notice, Spinner } from '@wordpress/components';
import { useRef, useMemo } from '@wordpress/element';
import { useBlockProps } from '@wordpress/block-editor';

/**
 * Document Preview Component.
 *
 * @param {Object}   props                  - Component properties.
 * @param {string}   props.embeddedHtml     - The HTML to embed.
 * @param {boolean}  props.isLoading        - Whether the document is loading.
 * @param {string}   props.fetchError       - Error message if fetch failed.
 * @param {Function} props.onChangeDocument - Callback when user wants to change document.
 */
export default function DocumentPreview( {
	embeddedHtml,
	isLoading,
	fetchError,
	onChangeDocument,
} ) {
	const containerRef = useRef( null );

	const blockProps = useBlockProps();

	// Check if the block is selected
	const isSelected = useMemo( () => {
		return blockProps.className?.includes( 'is-selected' );
	}, [ blockProps.className ] );

	if ( isLoading === null || isLoading ) {
		return (
			<div className="documentcloud-loading">
				<Spinner />
				<p>{ __( 'Loading document…', 'documentcloud' ) }</p>
			</div>
		);
	}

	if ( fetchError ) {
		return (
			<div className="documentcloud-error-container">
				<Notice status="error" isDismissible={ false }>
					{ fetchError }
				</Notice>
				<DocumentPreviewFooter onChangeDocument={ onChangeDocument } />
			</div>
		);
	}

	// For response containing IFrame directly set in a div.
	if ( embeddedHtml ) {
		return (
			<div className="documentcloud-preview" ref={ containerRef }>
				<div
					className="documentcloud-embed documentcloud-oembed"
					// We do not need to sanitize innerHTML since it is an oEmbed response.
					dangerouslySetInnerHTML={ { __html: embeddedHtml } }
				/>
				{ /* only load the overlay if the block is not selected */ }
				{ isSelected ? null : (
					<div className="documentcloud-overlay" />
				) }
				<DocumentPreviewFooter onChangeDocument={ onChangeDocument } />
			</div>
		);
	}

	// If none of the above conditions are suitable we need to return the document preview.
	return (
		<div className="documentcloud-preview" ref={ containerRef }>
			<div className="documentcloud-placeholder">
				<p>
					{ __( 'Document preview not available.', 'documentcloud' ) }
				</p>
			</div>
			<DocumentPreviewFooter onChangeDocument={ onChangeDocument } />
		</div>
	);
}

/**
 * Footer component for the document preview with action buttons. It is an inner component for private code reusability.
 *
 * @param {Object}   props                  - Component properties.
 * @param {Function} props.onChangeDocument - Callback when user wants to change document.
 */
function DocumentPreviewFooter( { onChangeDocument } ) {
	return (
		<div className="documentcloud-preview-footer">
			<Button
				variant="secondary"
				onClick={ onChangeDocument }
				className="documentcloud-clear-button"
			>
				{ __( 'Change Document', 'documentcloud' ) }
			</Button>
		</div>
	);
}
