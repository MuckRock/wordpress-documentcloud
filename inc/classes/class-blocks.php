<?php
/**
 * Registers all custom Gutenberg blocks.
 *
 * @package DocumentCloud
 * @subpackage Inc
 */

namespace DocumentCloud\Inc\Classes;

use DocumentCloud\Inc\Blocks\DocumentCloud;
use DocumentCloud\Inc\Traits\Singleton;


/**
 * Class Blocks
 *
 * Responsible for registering and initializing all custom Gutenberg blocks.
 *
 * @since 1.0.0
 */
class Blocks {

	use Singleton;

	/**
	 * An array of the static blocks.
	 *
	 * @since 1.0.0
	 * @var array
	 */
	private $static_blocks;

	/**
	 * Constructor method.
	 *
	 * Initializes block instances and sets up WordPress hooks.
	 *
	 * @since 1.0.0
	 *
	 * @return void
	 */
	protected function __construct() {
		// Initialize blocks.
		$this->static_blocks = array(
			DocumentCloud::BLOCK_NAME => DocumentCloud::instance(),
		);

		$this->setup_hooks();
	}

	/**
	 * Setup WordPress action and filter hooks.
	 *
	 * @since 1.0.0
	 *
	 * @return void
	 */
	public function setup_hooks() {
		add_action( 'init', array( $this, 'register_blocks' ) );
	}

	/**
	 * Register all custom Gutenberg blocks.
	 *
	 * Iterates through the dynamic_blocks array and registers each block.
	 *
	 * @since 1.0.0
	 *
	 * @return void
	 */
	public function register_blocks() {

		// Register Static Blocks.
		foreach ( $this->static_blocks as $block_key => $block_instance ) {
			register_block_type(
				trailingslashit( DOCUMENTCLOUD_BUILD_PATH ) . $block_key
			);
		}
	}
}
