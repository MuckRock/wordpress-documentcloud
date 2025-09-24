export const PanelBody = ( { children } ) => <div>{ children }</div>;
export const PanelRow = ( { children } ) => <div>{ children }</div>;
export const TextControl = ( {
	label,
	value,
	onChange,
	placeholder,
	help,
} ) => {
	const id = label
		? `text-control-${ label.replace( /\s+/g, '-' ).toLowerCase() }`
		: 'text-control-undefined';
	return (
		<div>
			{ label && <label htmlFor={ id }>{ label }</label> }
			<input
				id={ id }
				placeholder={ placeholder || '' }
				value={ value || '' }
				onChange={ ( e ) => onChange( e.target.value ) }
				type="text"
			/>
			{ help && (
				<p className="components-base-control__help">{ help }</p>
			) }
		</div>
	);
};
export const ToggleControl = ( { label, checked, onChange } ) => {
	const id = `toggle-control-${ label.replace( /\s+/g, '-' ).toLowerCase() }`;
	return (
		<div>
			<label htmlFor={ id }>{ label }</label>
			<input
				id={ id }
				type="checkbox"
				checked={ checked }
				onChange={ ( e ) => onChange( e.target.checked ) }
			/>
		</div>
	);
};
export const SelectControl = ( { label, value, options, onChange, help } ) => {
	const id = label
		? `select-control-${ label.replace( /\s+/g, '-' ).toLowerCase() }`
		: 'select-control-undefined';
	return (
		<div>
			{ label && <label htmlFor={ id }>{ label }</label> }
			<select
				id={ id }
				value={ value || '' }
				onChange={ ( e ) => onChange( e.target.value ) }
			>
				{ options &&
					options.map( ( option ) => (
						<option key={ option.value } value={ option.value }>
							{ option.label }
						</option>
					) ) }
			</select>
			{ help && (
				<p className="components-base-control__help">{ help }</p>
			) }
		</div>
	);
};
export const Placeholder = ( { children, instructions } ) => (
	<div>
		{ instructions && <p>{ instructions }</p> }
		{ children }
	</div>
);
export const Button = ( { children, onClick } ) => (
	<button onClick={ onClick }>{ children }</button>
);
export const Notice = ( { children } ) => <div>{ children }</div>;
export const Spinner = () => <div>Loading...</div>;
