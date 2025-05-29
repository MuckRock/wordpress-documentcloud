<?php
/**
 * DocumentCloud Gutenberg block functionality.
 *
 * @package DocumentCloud
 * @subpackage Inc\Blocks
 */

namespace DocumentCloud\Inc\Blocks;

use DocumentCloud\Inc\Traits\Singleton;

/**
 * Class DocumentCloud
 *
 * Handles the  DocumentCloud Gutenberg block.
 *
 * @since 1.0.0
 */
class DocumentCloud {

	use Singleton;

	/**
	 * Block name identifier.
	 *
	 * @since 1.0.0
	 * @var string
	 */
	const BLOCK_NAME = 'documentcloud';
}
