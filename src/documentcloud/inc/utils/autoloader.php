<?php
/**
 * Class autoloader implementation.
 *
 * @package DocumentCloud
 */

namespace DocumentCloud\Inc\Utils;

/**
 * Handles automatic class loading based on namespaces.
 *
 * @param string $class_name Fully qualified class name to load.
 * @return void
 */
function class_loader( $class_name ) {

	// Define the base namespace for this plugin.
	$base_namespace = 'DocumentCloud\\';

	// Check if the class belongs to our plugin.
	if ( 0 !== strpos( $class_name, $base_namespace ) ) {
		return; // Not our class, let other autoloaders handle it.
	}

	// Remove base namespace and get relative class path.
	$relative_class = substr( $class_name, strlen( $base_namespace ) );

	// Bail if empty class name.
	if ( empty( $relative_class ) ) {
		return;
	}

	// Convert namespace separators to directory separators.
	$parts = explode( '\\', $relative_class );

	// Convert class name format to file name format.
	if ( count( $parts ) < 2 ) {
		return; // We need at least a group and a class name.
	}

	// Extract namespace parts.
	$top_level      = $parts[0]; // 'Inc'.
	$component_type = $parts[1]; // 'Traits', 'Classes', 'Blocks', etc.
	$class_name     = ! empty( $parts[2] ) ? $parts[2] : ''; // The actual class name if present.

	// Lowercase for filesystem paths.
	$component_type_lower = strtolower( $component_type );
	$class_name_kebab     = kebab_case( $class_name );

	$file_path = '';

	if ( 'Inc' === $top_level ) {
		switch ( $component_type ) {
			case 'Traits':
				$file_path = DOCUMENTCLOUD_PATH . 'inc/traits/trait-' . $class_name_kebab . '.php';
				break;

			case 'Utils':
				$file_path = DOCUMENTCLOUD_PATH . 'inc/utils/' . $class_name_kebab . '.php';
				break;

			case 'Classes':
				$file_path = DOCUMENTCLOUD_PATH . 'inc/classes/class-' . $class_name_kebab . '.php';
				break;

			case 'Blocks':
				// For classes in the DocumentCloud\Inc\Blocks namespace.
				$file_path = DOCUMENTCLOUD_PATH . 'inc/classes/blocks/class-' . $class_name_kebab . '.php';
				break;

			default:
				// Try a default path that follows WordPress conventions.
				$file_path = DOCUMENTCLOUD_PATH . 'inc/' . $component_type_lower . '/class-' . $class_name_kebab . '.php';
				break;
		}
	}

	// Only include valid and existing files.
	if ( ! empty( $file_path ) && file_exists( $file_path ) && is_readable( $file_path ) ) {
		require_once $file_path;
	}
}

/**
 * Convert everything to kebab-case.
 *
 * @param string $input String to convert.
 * @return string Kebab-cased string.
 */
function kebab_case( $input ) {
	if ( empty( $input ) ) {
		return '';
	}

	// Replace underscores with hyphens.
	$output = str_replace( '_', '-', $input );

	// Convert StudlyCaps to kebab-case.
	$output = preg_replace( '/([a-zA-Z])(?=[A-Z])/', '$1-', $output );

	// Return lowercase version.
	return strtolower( $output );
}

// Register the autoloader.
spl_autoload_register( '\DocumentCloud\Inc\Utils\class_loader' );
