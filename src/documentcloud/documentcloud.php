<?php
/***
 * Plugin Name: DocumentCloud
 * Plugin URI: https://www.documentcloud.org/
 * Description: Embed DocumentCloud resources in WordPress content.
 * Version: 0.6.0
 * Authors: Chris Amico, Justin Reese, Dylan Freedman
 * Text Domain: documentcloud
 * License: GPLv2
 * Requires at least: 5.0
 * Tested up to: 6.8
 *
 * @package DocumentCloud
 */

/**
	Copyright 2011 National Public Radio, Inc.
	Copyright 2015 DocumentCloud, Investigative Reporters & Editors
	Copyright 2021 MuckRock Foundation, Inc.

	This program is free software; you can redistribute it and/or modify
	it under the terms of the GNU General Public License, version 2, as
	published by the Free Software Foundation.

	This program is distributed in the hope that it will be useful,
	but WITHOUT ANY WARRANTY; without even the implied warranty of
	MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
	GNU General Public License for more details.

	You should have received a copy of the GNU General Public License
	along with this program; if not, write to the Free Software
	Foundation, Inc., 51 Franklin St, Fifth Floor, Boston, MA  02110-1301  USA
 */

define( 'DOCUMENTCLOUD_BUILD_PATH', trailingslashit( plugin_dir_path( __FILE__ ) ) . 'blocks/build/' );
define( 'DOCUMENTCLOUD_PATH', trailingslashit( plugin_dir_path( __FILE__ ) ) );
define( 'DOCUMENTCLOUD_URL', trailingslashit( plugin_dir_url( __FILE__ ) ) );

require_once DOCUMENTCLOUD_PATH . 'inc/utils/autoloader.php';

use DocumentCloud\Inc\Classes\Blocks;

/**
 * This class is the primary Plugin Entrypoint.
 */
class WP_DocumentCloud {

	// Plugin constants.
	const   CACHING_ENABLED             = true,
			DEFAULT_EMBED_FULL_WIDTH    = 940,
			OEMBED_RESOURCE_DOMAIN      = 'www.documentcloud.org',
			OEMBED_PROVIDER             = 'https://www.documentcloud.org/api/oembed.{format}',
			DOCUMENT_PATTERN            = '^(?P<protocol>https?):\/\/(?P<dc_host>.*documentcloud\.org)\/documents\/(?P<document_slug>[0-9]+-[\p{L}\p{N}%-]+)',
			CONTAINER_TEMPLATE_START    = '<div class="embed-documentcloud">',
			CONTAINER_TEMPLATE_END      = '</div>',
			BETA_ID_CUTOFF              = 20000000,
			BETA_OEMBED_RESOURCE_DOMAIN = 'beta.documentcloud.org',
			BETA_OEMBED_DOMAIN_MATCH    = '#https?://(www\.)?(beta|embed).documentcloud.org/.*#i',
			BETA_OEMBED_PROVIDER        = 'https://api.beta.documentcloud.org/api/oembed';
	/**
	 * Constructor.
	 */
	public function __construct() {
		// Check for conflicts with other DocumentCloud plugins.
		// Not needed on WordPress VIP since no other DocumentCloud plugins exist.
		if ( ! defined( 'WPCOM_IS_VIP_ENV' ) || ! WPCOM_IS_VIP_ENV ) {
			add_action( 'admin_init', array( $this, 'check_dc_plugin_conflict' ) );
		}

		// Register the oEmbed provider.
		add_action( 'init', array( $this, 'register_dc_oembed_provider' ) );

		// Set the textdomain for the plugin so it is translation compatible.
		add_action( 'init', array( $this, 'load_plugin_textdomain' ) );

		// Only called when `[documentcloud]` shortcode is used.
		add_shortcode( 'documentcloud', array( $this, 'process_dc_shortcode' ) );

		// Called just before oEmbed endpoint is hit.
		add_filter( 'oembed_fetch_url', array( $this, 'prepare_oembed_fetch' ), 10, 3 );

		// Setup the settings page.
		add_action( 'admin_menu', array( $this, 'add_options_page' ) );
		add_action( 'admin_init', array( $this, 'settings_init' ) );

		add_action( 'admin_enqueue_scripts', array( $this, 'enqueue_admin_styles' ) );

		Blocks::instance();
	}

	/**
	 * Load plugin textdomain.
	 */
	public function load_plugin_textdomain(): void {
		load_plugin_textdomain( 'documentcloud' );
	}

	/**
	 * Check for conflicts with the Navis DocumentCloud plugin.
	 */
	public function check_dc_plugin_conflict() {
		if ( is_plugin_active( 'navis-documentcloud/navis-documentcloud.php' ) ) {
			add_action( 'admin_notices', array( $this, 'dc_conflict_admin_notice' ) );
		}
	}

	/**
	 * Create an admin notice when conflicts exist with Navis DocumentCloud.
	 */
	public function dc_conflict_admin_notice() {
		?>
		<div class="error">
			<p><?php echo wp_kses_post( __( '<b>Warning!</b> You have two conflicting DocumentCloud plugins activated. Please deactivate Navis DocumentCloud, which has been replaced by <a target="_blank" href="https://wordpress.org/plugins/documentcloud/">DocumentCloud</a>.', 'documentcloud' ) ); ?></p>
		</div>
		<?php
	}

	/**
	 * Register ourselves as an oEmbed provider. WordPress does NOT cURL the
	 * resource to inspect it for an oEmbed link tag; we have to tell it what
	 * our oEmbed endpoint looks like.
	 */
	public function register_dc_oembed_provider() {
		/*
			Hello developer. If you wish to test this plugin against your
			local installation of DocumentCloud (with its own testing
			domain), set the OEMBED_PROVIDER and OEMBED_RESOURCE_DOMAIN
			constants above to your local testing domain. You'll also want
			to add the following line to your theme to let WordPress connect to local
			domains:

			add_filter( 'http_request_host_is_external', '__return_true');
		*/

		$oembed_resource_domain = apply_filters( 'documentcloud_oembed_resource_domain', self::OEMBED_RESOURCE_DOMAIN );
		$oembed_provider        = apply_filters( 'documentcloud_oembed_provider', self::OEMBED_PROVIDER );

		wp_oembed_add_provider( 'http://' . $oembed_resource_domain . '/documents/*', $oembed_provider );
		wp_oembed_add_provider( 'https://' . $oembed_resource_domain . '/documents/*', $oembed_provider );

		// Add oembed provider for the DocumentCloud beta.
		wp_oembed_add_provider(
			self::BETA_OEMBED_DOMAIN_MATCH,
			self::BETA_OEMBED_PROVIDER,
			true
		);
	}

	/**
	 * Get the default sizes for DocumentCloud.
	 *
	 * @return array
	 */
	public function get_default_sizes() {
		$wp_embed_defaults = wp_embed_defaults();

		$height     = intval( get_option( 'documentcloud_default_height', $wp_embed_defaults['height'] ) );
		$width      = intval( get_option( 'documentcloud_default_width', $wp_embed_defaults['width'] ) );
		$full_width = intval( get_option( 'documentcloud_full_width', self::DEFAULT_EMBED_FULL_WIDTH ) );

		return array(
			'height'     => $height,
			'width'      => $width,
			'full_width' => $full_width,
		);
	}

	/**
	 * Get the attribute defaults for the shortcode.
	 *
	 * @return array
	 */
	public function get_default_atts() {
		$default_sizes = $this->get_default_sizes();

		return array(
			'url'               => null,
			'container'         => null,
			'notes'             => null,
			'responsive_offset' => null,
			'page'              => null,
			'note'              => null,
			'zoom'              => null,
			'search'            => null,
			'responsive'        => null,
			'sidebar'           => null,
			'text'              => null,
			'pdf'               => 0,
			'onlyshoworg'       => 0,
			'title'             => null,
			'fullscreen'        => 1,
			// The following defaults match the existing plugin, except
			// `height/width` are prefixed `max*` per the oEmbed spec.
			// You can still use `height/width` for backwards
			// compatibility, but they'll be mapped to `max*`.
			// Precedence (lower number == higher priority):
			// 1. `width` on shortcode.
			// 2. `maxwidth` on shortcode.
			// 3. Settings > DocumentCloud > "Default embed width".
			// 4. `wp_embed_defaults()['width']`.
			'maxheight'         => $default_sizes['height'],
			'maxwidth'          => $default_sizes['width'],
			'format'            => 'normal',
			'style'             => null,
		);
	}

	/**
	 * Prepare the oEmbed fetch URL.
	 *
	 * @param string $provider The oEmbed URL Provider.
	 * @param string $url The URL of the Embed.
	 * @param array  $args The arguments to be passed to the endpoint.
	 * @return string
	 */
	public function prepare_oembed_fetch( $provider, $url, $args ) {
		// Merge actual args with default attributes so that defaults are always sent to oEmbed endpoint.
		$default_atts = $this->get_default_atts();

		// Parse the Embed URL and extract the query parameters.
		$raw_query_args = wp_parse_url( $url, PHP_URL_QUERY );
		if ( ! empty( $raw_query_args ) ) {
			$url_args = array();
			wp_parse_str( $raw_query_args, $url_args );

			// Add the query parameters to allow whitelisting them in URL for Embed.
			$args = array_merge( $args, $url_args );

			// Set the width to maxwidth so that it can be added to the oEmbed endpoint instead of the actual URL.
			if ( isset( $url_args['width'] ) ) {
				$args['maxwidth'] = $url_args['width'];
			}

			// Set the height to maxheight so that it can be added to the oEmbed endpoint instead of the actual URL.
			if ( isset( $url_args['height'] ) ) {
				$args['maxheight'] = $url_args['height'];
			}

			// If the width is set from url we should set the responsive to false just like how the shortcode works.
			if ( isset( $url_args['width'] ) && ! array_key_exists( 'responsive', $url_args ) ) {
				$args['responsive'] = 0;
			}
		}

		$atts = wp_parse_args( $args, $default_atts );

		// Some resources (like notes) have multiple possible
		// user-facing URLs. We recompose them into a single form.
		$url = $this->clean_dc_url( $url );

		// Send these to the oEmbed endpoint itself.
		$oembed_config_keys = array( 'maxheight', 'maxwidth' );

		// Specifically *don't* include these on the embed config itself.
		$excluded_embed_config_keys = array( 'url', 'format', 'height', 'width', 'maxheight', 'maxwidth', 'discover' );

		// Clean and prepare arguments.
		foreach ( $atts as $key => $value ) {
			if ( in_array( $key, $oembed_config_keys, true ) ) {
				$provider = add_query_arg( $key, $value, $provider );
			}
			if ( ! in_array( $key, $excluded_embed_config_keys, true ) ) {
				/**
				 * Without this check, `add_query_arg()` will treat values
				 * that are actually ID selectors, like `container=#foo`,
				 * as URL fragments and throw them at the end of the URL.
				 */
				if ( 0 === strpos( $value, '#' ) ) {
					$value = rawurlencode( $value );
				}
				$url = add_query_arg( $key, $value, $url );
			}
		}

		$provider = add_query_arg( 'url', rawurlencode( $url ), $provider );

		return $provider;
	}

	/**
	 * Create the DocumentCloud embed output from the shortcode.
	 *
	 * @param array $atts Shortcode attributes.
	 * @return string
	 */
	public function process_dc_shortcode( $atts ) {
		$default_sizes = $this->get_default_sizes();
		$default_atts  = $this->get_default_atts();

		// Smooshes together passed-in shortcode attrs with defaults
		// and filters to only those we accept.
		$filtered_atts = shortcode_atts( $default_atts, $atts );

		// Either the `url` or `id` attributes are required, but `id`
		// is only supported for backwards compatibility. If it's used,
		// we force this to embed a document. I.e., `id` can't be used
		// for embedding notes, pages, or other non-document resources.
		if ( empty( $atts['url'] ) ) {
			if ( empty( $atts['id'] ) ) {
				return '';
				// Determine which URL on the basis of the DocumentCloud ID.
			} elseif ( intval( $atts['id'] ) >= self::BETA_ID_CUTOFF ) {
				// Populate beta URL.
				// TODO: use only one URL after the switch.
				$url                  = 'https://' . self::BETA_OEMBED_RESOURCE_DOMAIN . "/documents/{$atts['id']}.html";
				$filtered_atts['url'] = $url;
			} else {
				// Populate legacy URL.
				$url                  = 'https://' . self::OEMBED_RESOURCE_DOMAIN . "/documents/{$atts['id']}.html";
				$filtered_atts['url'] = $url;
			}
		}

		// `height/width` beat `maxheight/maxwidth`; see full precedence list in `get_default_atts()`.
		if ( isset( $atts['height'] ) ) {
			$filtered_atts['maxheight'] = $atts['height'];
		}
		if ( isset( $atts['width'] ) ) {
			$filtered_atts['maxwidth'] = $atts['width'];
		}

		// `responsive` defaults true, but our responsive layout
		// ignores width declarations. If a user indicates a width and
		// hasn't otherwise specifically indicated `responsive='true'`,
		// it's safe to assume they expect us to respect the width, so
		// we disable the responsive flag.
		if ( ( isset( $atts['width'] ) || isset( $atts['maxwidth'] ) ) && ( ! array_key_exists( 'responsive', $atts ) || 'true' !== $atts['responsive'] ) ) {
			$filtered_atts['responsive'] = 'false';
		}

		// If the format is set to wide, it blows away all other width
		// settings.
		if ( 'wide' === $filtered_atts['format'] ) {
			$filtered_atts['maxwidth'] = $default_sizes['full_width'];
		}

		// For the benefit of some templates, notify template that
		// we're requesting an asset wider than the default size.
		global $post;
		$is_wide = intval( $filtered_atts['maxwidth'] ) > $default_sizes['width'];

		if ( apply_filters( 'documentcloud_caching_enabled', self::CACHING_ENABLED ) ) {
			// This lets WordPress cache the result of the oEmbed call.
			// Thanks to http://bit.ly/1HykA0U for this pattern.
			global $wp_embed;
			$filtered_atts['url'] = $this->clean_dc_url( $filtered_atts['url'] );
			$url                  = $filtered_atts['url'];
			return self::CONTAINER_TEMPLATE_START . $wp_embed->shortcode( $filtered_atts, $url ) . self::CONTAINER_TEMPLATE_END;
		} else {
			return self::CONTAINER_TEMPLATE_START . wp_oembed_get( $filtered_atts['url'], $filtered_atts ) . self::CONTAINER_TEMPLATE_END;
		}
	}

	/**
	 * Parse the DocumentCloud URL into its components.
	 *
	 * @param string $url URL.
	 * @return array
	 */
	public function parse_dc_url( $url ) {
		$patterns = array(
			// Document.
			'{' . self::DOCUMENT_PATTERN . '(\.html)?$}',
			// Pages and page variants.
			'{' . self::DOCUMENT_PATTERN . '(\.html)?#document\/p(?P<page_number>[0-9]+)$}',
			'{' . self::DOCUMENT_PATTERN . '\/pages\/(?P<page_number>[0-9]+)\.(html|js)$}',
			// Notes and note variants.
			'{' . self::DOCUMENT_PATTERN . '\/annotations\/(?P<note_id>[0-9]+)\.(html|js)$}',
			'{' . self::DOCUMENT_PATTERN . '(\.html)?#document\/p([0-9]+)/a(?P<note_id>[0-9]+)$}',
			'{' . self::DOCUMENT_PATTERN . '(\.html)?#annotation\/a(?P<note_id>[0-9]+)(\.[a-z]+)?$}',
		);

		$elements = array();
		foreach ( $patterns as $pattern ) {
			$perfect_match = preg_match( $pattern, $url, $elements );
			if ( $perfect_match ) {
				break;
			}
		}

		return $elements;
	}

	/**
	 * Clean the DocumentCloud URL.
	 *
	 * @param string $url URL.
	 * @return string
	 */
	public function clean_dc_url( $url ) {
		$elements = $this->parse_dc_url( $url );
		if ( isset( $elements['document_slug'] ) ) {
			$url = "{$elements['protocol']}://{$elements['dc_host']}/documents/{$elements['document_slug']}";
			if ( isset( $elements['page_number'] ) ) {
				$url .= "/pages/{$elements['page_number']}";
			} elseif ( isset( $elements['note_id'] ) ) {
				$url .= "/annotations/{$elements['note_id']}";
			}
			$url .= '.html';
		}
		return $url;
	}

	/**
	 * Add the DocumentCloud options page.
	 */
	public function add_options_page() {
		if ( current_user_can( 'manage_options' ) ) {
			add_options_page( 'DocumentCloud', 'DocumentCloud', 'manage_options', 'documentcloud', array( $this, 'render_options_page' ) );
		}
	}

	/**
	 * Render the DocumentCloud options page.
	 */
	public function render_options_page() {
		// TODO: remove the responsive warning after the switch.
		?>
		<h2><?php esc_html_e( 'DocumentCloud Options', 'documentcloud' ); ?></h2>
		<p><b><?php esc_html_e( 'Note', 'documentcloud' ); ?></b> - <?php esc_html_e( 'These settings will only work for the ShortCode and Embed Block.', 'documentcloud' ); ?></p>
		<form action="options.php" method="post">

			<p><?php echo wp_kses_post( __( 'Any widths set here will only take effect on non-beta DocumentCloud embeds if you set <code>responsive="false"</code> on an embed.', 'documentcloud' ) ); ?></p>

			<?php settings_fields( 'documentcloud' ); ?>
			<?php do_settings_sections( 'documentcloud' ); ?>

			<p><input class="button-primary" name="<?php esc_attr_e( 'Submit', 'documentcloud' ); ?>" type="submit" value="<?php esc_attr_e( 'Save Changes', 'documentcloud' ); ?>" /></p>
		</form>
		<?php
	}

	/**
	 * Initialize settings for the DocumentCloud options page.
	 */
	public function settings_init() {
		if ( current_user_can( 'manage_options' ) ) {
			add_settings_section(
				'documentcloud',
				'',
				'__return_null',
				'documentcloud'
			);

			add_settings_field(
				'documentcloud_default_height',
				__( 'Default embed height (px)', 'documentcloud' ),
				array( $this, 'default_height_field' ),
				'documentcloud',
				'documentcloud'
			);
			register_setting(
				'documentcloud',
				'documentcloud_default_height',
				array(
					'show_in_rest'      => true,
					'sanitize_callback' => 'sanitize_text_field',
				)
			);

			add_settings_field(
				'documentcloud_default_width',
				__( 'Default embed width (px)', 'documentcloud' ),
				array( $this, 'default_width_field' ),
				'documentcloud',
				'documentcloud'
			);
			register_setting(
				'documentcloud',
				'documentcloud_default_width',
				array(
					'show_in_rest'      => true,
					'sanitize_callback' => 'sanitize_text_field',
				)
			);

			add_settings_field(
				'documentcloud_full_width',
				__( 'Full-width embed width (px)', 'documentcloud' ),
				array( $this, 'full_width_field' ),
				'documentcloud',
				'documentcloud'
			);
			register_setting(
				'documentcloud',
				'documentcloud_full_width',
				array(
					'show_in_rest'      => true,
					'sanitize_callback' => 'sanitize_text_field',
				)
			);
		}
	}

	/**
	 * Render the default height field.
	 */
	public function default_height_field() {
		$default_sizes = $this->get_default_sizes();
		echo '<input type="number" value="' . esc_attr( $default_sizes['height'] ) . '" name="documentcloud_default_height" />';
	}

	/**
	 * Render the default width field.
	 */
	public function default_width_field() {
		$default_sizes = $this->get_default_sizes();
		echo '<input type="number" value="' . esc_attr( $default_sizes['width'] ) . '" name="documentcloud_default_width" />';
	}

	/**
	 * Render the full width field.
	 */
	public function full_width_field() {
		$default_sizes = $this->get_default_sizes();
		echo '<input type="number" value="' . esc_attr( $default_sizes['full_width'] ) . '" name="documentcloud_full_width" />';
	}

	/**
	 * This function adds the admin styles for the plugin.
	 *
	 * @param string $hook The current admin page hook name.
	 *
	 * @return void
	 */
	public function enqueue_admin_styles( string $hook ) {

		if ( 'settings_page_documentcloud' === $hook ) {

			wp_register_style(
				'documentcloud-admin-styles',
				DOCUMENTCLOUD_URL . 'assets/css/settings-documentcloud.css',
				array(),
				'1.0.0'
			);

			wp_enqueue_style( 'documentcloud-admin-styles' );
		}
	}
}

new WP_DocumentCloud();
