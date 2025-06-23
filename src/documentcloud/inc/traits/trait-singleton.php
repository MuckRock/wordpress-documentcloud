<?php
/**
 * Simple Singleton implementation trait.
 *
 * @package DocumentCloud
 * @subpackage Inc\Traits
 */

namespace DocumentCloud\Inc\Traits;

/**
 * Singleton pattern implementation.
 *
 * This trait provides a standardized implementation of the singleton pattern
 * that can be used across multiple classes within the plugin.
 *
 * @since 1.0.0
 */
trait Singleton {

	/**
	 * Class instance registry.
	 *
	 * @since 1.0.0
	 * @var array
	 */
	private static $registry = array();

	/**
	 * Get or create singleton instance.
	 *
	 * @since 1.0.0
	 *
	 * @return static The singleton instance.
	 */
	public static function instance() {
		$class = static::class;

		if ( ! array_key_exists( $class, self::$registry ) ) {
			self::$registry[ $class ] = new static();

			/**
			 * Action fired when singleton is initialized.
			 *
			 * @since 1.0.0
			 *
			 * @param object $instance The singleton instance that was initialized.
			 */
			do_action( "documentcloud_{$class}_initialized", self::$registry[ $class ] );
		}

		return self::$registry[ $class ];
	}

	/**
	 * Protected constructor to enforce singleton pattern.
	 *
	 * Classes using this trait should override this with a protected constructor.
	 *
	 * @since 1.0.0
	 *
	 * @return void
	 */
	protected function __construct() {
		// Initialization logic can be added in classes using this trait.
	}

	/**
	 * Prevent object cloning.
	 *
	 * @since 1.0.0
	 *
	 * @return void
	 */
	private function __clone() {
		// This method intentionally left empty to prevent cloning.
	}

	/**
	 * Prevent unserializing.
	 *
	 * @since 1.0.0
	 *
	 * @return void
	 */
	public function __wakeup() {
		_doing_it_wrong(
			__FUNCTION__,
			esc_html__( 'Unserializing instances of this class is forbidden.', 'documentcloud' ),
			'1.0.0'
		);
	}
}
