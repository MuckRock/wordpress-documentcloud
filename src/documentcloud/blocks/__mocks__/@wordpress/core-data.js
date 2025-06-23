export const store = 'core';

export const getEntityRecord = jest.fn( ( kind, name ) => {
	if ( kind === 'root' && name === 'site' ) {
		return {
			documentcloud_default_height: '600',
			documentcloud_default_width: '800',
			documentcloud_full_width: '1200',
		};
	}
	return null;
} );
