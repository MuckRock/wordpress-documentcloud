export const useBlockProps = jest.fn( () => ( {} ) ); // Default behavior for `edit.js`

useBlockProps.save = jest.fn( () => ( {
	className: 'wp-block-documentcloud',
} ) );

export const InspectorControls = ( { children } ) => <div>{ children }</div>;
