<?php
use Yoast\PHPUnitPolyfills\TestCases\TestCase;

/**
 * Test cases for the WP_DocumentCloud class.
 */
class Test_WP_DocumentCloud extends TestCase {

	/**
	 * Instance of the WP_DocumentCloud class.
	 *
	 * @var WP_DocumentCloud
	 */
	protected $dc;

	/**
	 * Set up the test environment.
	 */
	public function set_up(): void {
		parent::set_up();
		$this->dc = new WP_DocumentCloud();
	}

	/**
	 * Test the get_default_sizes method.
	 *
	 * Ensures the method returns an array with the correct keys and values.
	 */
	public function test_get_default_sizes() {
		// Set options to test.
		update_option( 'documentcloud_default_height', 500 );
		update_option( 'documentcloud_default_width', 800 );
		update_option( 'documentcloud_full_width', 1200 );

		// Call the method.
		$sizes = $this->dc->get_default_sizes();

		// Assert the keys exist.
		$this->assertArrayHasKey( 'height', $sizes );
		$this->assertArrayHasKey( 'width', $sizes );
		$this->assertArrayHasKey( 'full_width', $sizes );

		// Assert the values are correct.
		$this->assertEquals( 500, $sizes['height'] );
		$this->assertEquals( 800, $sizes['width'] );
		$this->assertEquals( 1200, $sizes['full_width'] );
	}

	/**
	 * Test the process_dc_shortcode method with no URL or ID.
	 *
	 * Ensures the method returns an empty string when no URL or ID is provided.
	 */
	public function test_process_dc_shortcode_no_url_or_id() {
		$atts   = array(); // No URL or ID provided.
		$result = $this->dc->process_dc_shortcode( $atts );

		// Assert that the result is an empty string.
		$this->assertEquals( '', $result );
	}

	/**
	 * Test the process_dc_shortcode method with a valid URL.
	 *
	 * Ensures the method generates the correct embed code.
	 */
	public function test_process_dc_shortcode_with_url() {
		$atts = array(
			'url'    => 'https://www.documentcloud.org/documents/24475232-2024-03-08-rcfp-letter-to-nj-leg-re-sb-2930',
			'width'  => 800,
			'height' => 600,
		);

		$result = $this->dc->process_dc_shortcode( $atts );

		// Assert that the result contains the expected embed code.
		$this->assertStringContainsString( 'embed.documentcloud.org/documents/24475232-2024-03-08-rcfp-letter-to-nj-leg-re-sb-2930', $result );
	}

	/**
	 * Test the process_dc_shortcode method with a valid ID.
	 *
	 * Ensures the method generates the correct embed code.
	 */
	public function test_process_dc_shortcode_with_id() {
		$atts = array(
			'id'     => '24475232',
			'width'  => 800,
			'height' => 600,
		);

		$result = $this->dc->process_dc_shortcode( $atts );

		// Assert that the result contains the expected embed code.
		$this->assertStringContainsString( 'embed.documentcloud.org/documents/24475232-2024-03-08-rcfp-letter-to-nj-leg-re-sb-2930', $result );
	}


	/**
	 * Test the add_options_page method.
	 *
	 * Ensures the options page is added to the admin menu.
	 */
	public function test_add_options_page() {
		// Mock current_user_can to return true.
		add_filter(
			'user_has_cap',
			function ( $allcaps ) {
				$allcaps['manage_options'] = true;
				return $allcaps;
			}
		);

		// Call the method.
		$this->dc->add_options_page();

		// Assert that the options page is registered.
		global $submenu;
		$submenu_keys = array_column( $submenu['options-general.php'], 0 );
		$this->assertContains( 'DocumentCloud', $submenu_keys );
	}

	/**
	 * Test the check_dc_plugin_conflict method.
	 *
	 * Ensures the conflict check works as expected.
	 */
	public function test_check_dc_plugin_conflict() {
		// Mock is_plugin_active to return true.
		add_filter(
			'pre_option_active_plugins',
			function () {
				return array( 'navis-documentcloud/navis-documentcloud.php' );
			}
		);

		// Call the method.
		$this->dc->check_dc_plugin_conflict();

		// Assert that the admin notice is added.
		$this->expectOutputRegex( '/You have two conflicting DocumentCloud plugins activated/' );
		do_action( 'admin_notices' );
	}

	/**
	 * Test the process_dc_shortcode method with various attributes.
	 *
	 * Ensures the shortcode processes attributes correctly.
	 */
	public function test_process_dc_shortcode_with_attributes() {
		// Test with a valid URL and custom attributes.
		$atts = array(
			'url'        => 'https://www.documentcloud.org/documents/24475232-2024-03-08-rcfp-letter-to-nj-leg-re-sb-2930/',
			'page'       => 2,
			'zoom'       => 150,
			'responsive' => 'true',
			'sidebar'    => 'false',
			'width'      => 1000,
			'height'     => 700,
		);

		$result = $this->dc->process_dc_shortcode( $atts );

		// Assert that the result contains the expected embed code.
		$this->assertStringContainsString( 'embed.documentcloud.org/documents/24475232-2024-03-08-rcfp-letter-to-nj-leg-re-sb-2930', $result );
		$this->assertStringContainsString( 'page=2', $result );
		$this->assertStringContainsString( 'zoom=150', $result );
		$this->assertStringContainsString( 'responsive=true', $result );
		$this->assertStringContainsString( 'sidebar=false', $result );
		$this->assertStringContainsString( 'width="1000"', $result );
		$this->assertStringContainsString( 'height="700"', $result );
	}

	/**
	 * Test the settings_init method.
	 *
	 * Ensures the settings for the DocumentCloud options page are registered correctly.
	 */
	public function test_settings_init() {
		// Mock the current_user_can function to return true.
		add_filter(
			'user_has_cap',
			function ( $allcaps ) {
				$allcaps['manage_options'] = true;
				return $allcaps;
			}
		);

		// Call the settings_init method.
		$this->dc->settings_init();

		// Assert that the settings section is registered.
		global $wp_settings_sections;
		$this->assertArrayHasKey( 'documentcloud', $wp_settings_sections );
		$this->assertArrayHasKey( 'documentcloud', $wp_settings_sections['documentcloud'] );

		// Assert that the settings fields are registered.
		global $wp_settings_fields;
		$this->assertArrayHasKey( 'documentcloud', $wp_settings_fields );
		$this->assertArrayHasKey( 'documentcloud', $wp_settings_fields['documentcloud'] );

		// Assert that the specific fields are registered.
		$fields = $wp_settings_fields['documentcloud']['documentcloud'];
		$this->assertArrayHasKey( 'documentcloud_default_height', $fields );
		$this->assertArrayHasKey( 'documentcloud_default_width', $fields );
		$this->assertArrayHasKey( 'documentcloud_full_width', $fields );

		// Assert that the field callbacks are correct.
		$this->assertEquals( array( $this->dc, 'default_height_field' ), $fields['documentcloud_default_height']['callback'] );
		$this->assertEquals( array( $this->dc, 'default_width_field' ), $fields['documentcloud_default_width']['callback'] );
		$this->assertEquals( array( $this->dc, 'full_width_field' ), $fields['documentcloud_full_width']['callback'] );
	}

	/**
	 * Test the parse_dc_url method.
	 *
	 * Ensures the method correctly parses a DocumentCloud URL into its components.
	 */
	public function test_parse_dc_url() {
		// Define the test URL.
		$url = 'https://www.documentcloud.org/documents/24475232-2024-03-08-rcfp-letter-to-nj-leg-re-sb-2930';

		// Call the method.
		$result = $this->dc->parse_dc_url( $url );
		// Assert that the result contains the expected components.
		$this->assertArrayHasKey( 'protocol', $result );
		$this->assertArrayHasKey( 'dc_host', $result );
		$this->assertArrayHasKey( 'document_slug', $result );

		// Assert the values of the components.
		$this->assertEquals( 'https', $result['protocol'] );
		$this->assertEquals( 'www.documentcloud.org', $result['dc_host'] );
		$this->assertEquals( '24475232-2024-03-08-rcfp-letter-to-nj-leg-re-sb-2930', $result['document_slug'] );
	}
}
