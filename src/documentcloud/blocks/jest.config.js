module.exports = {
	preset: '@wordpress/jest-preset-default',
	moduleNameMapper: {
		'\\.svg$': '__mocks__/svgMock.js',
	},
};
