/**
 * WordPress dependencies.
 */
import { useBlockProps } from '@wordpress/block-editor';

/**
 * Save component for the DocumentCloud block.
 *
 * @param {Object} props            Block props.
 * @param {Object} props.attributes Block attributes.
 * @return {JSX.Element} Block save element.
 */
export default function Save( { attributes } ) {
	const { embeddedHtml } = attributes;

	// Get block props
	const blockProps = useBlockProps.save();

	// If there's no embedded HTML yet, return empty container
	if ( ! embeddedHtml ) {
		return <div { ...blockProps }></div>;
	}

	/**
	 * The embedded HTML is trusted code from the oEmbed endpoint so we can directly set it dangerously in the innerHTML.
	 * This allows the oEmbed code to directly embed in page from server and prevent nesting it inside an iframe.
	 */
	return (
		<div { ...blockProps }>
			<div
				className="documentcloud-embed"
				dangerouslySetInnerHTML={ { __html: embeddedHtml } }
			></div>
		</div>
	);
}
