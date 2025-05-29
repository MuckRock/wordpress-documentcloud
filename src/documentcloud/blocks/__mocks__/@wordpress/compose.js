export const debounce = jest.fn( ( fn ) => {
	const debouncedFn = ( ...args ) => fn( ...args );
	debouncedFn.cancel = jest.fn();
	return debouncedFn;
} );
