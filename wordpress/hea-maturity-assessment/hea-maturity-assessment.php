<?php
/**
 * Plugin Name:       HEA Email Maturity Assessment
 * Description:       The Holistic Email Academy email maturity assessment. Add the shortcode [hea_maturity_assessment] to any page. Settings → Maturity assessment connects the response sheet.
 * Version:           1.0.1
 * Requires at least: 6.3
 * Requires PHP:      7.4
 * Author:            Holistic Email Academy
 * Text Domain:       hea-maturity-assessment
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

const HEA_MA_VERSION = '1.0.1';
const HEA_MA_OPTION  = 'hea_ma_settings';

/**
 * Saved settings, with defaults.
 *
 * collector_url: the Google Apps Script web app (/exec) that saves responses
 *                and emails results. Empty = nothing is saved and the
 *                "email my result" form is hidden.
 * privacy_url:   linked from the intro and the email form. Empty = the
 *                site's privacy policy page (Settings → Privacy).
 */
function hea_ma_settings() {
	$saved = get_option( HEA_MA_OPTION, array() );
	return wp_parse_args(
		is_array( $saved ) ? $saved : array(),
		array(
			'collector_url' => '',
			'privacy_url'   => '',
		)
	);
}

// ---- Front end ----------------------------------------------------------------

add_action( 'init', 'hea_ma_register_assets' );
function hea_ma_register_assets() {
	$base = plugin_dir_url( __FILE__ ) . 'assets/';
	$dir  = plugin_dir_path( __FILE__ ) . 'assets/';
	// File modification times as versions, so browsers fetch new files
	// as soon as a new plugin version is uploaded.
	$ver = function ( $file ) use ( $dir ) {
		$time = @filemtime( $dir . $file );
		return HEA_MA_VERSION . ( $time ? '.' . $time : '' );
	};

	wp_register_style( 'hea-ma', $base . 'assessment.css', array(), $ver( 'assessment.css' ) );

	$footer = array( 'in_footer' => true );
	wp_register_script( 'hea-ma-data', $base . 'js/data.js', array(), $ver( 'js/data.js' ), $footer );
	wp_register_script( 'hea-ma-engine', $base . 'js/engine.js', array(), $ver( 'js/engine.js' ), $footer );
	wp_register_script( 'hea-ma-advice', $base . 'js/advice.js', array(), $ver( 'js/advice.js' ), $footer );
	wp_register_script( 'hea-ma-courses', $base . 'js/courses.js', array(), $ver( 'js/courses.js' ), $footer );
	wp_register_script(
		'hea-ma-app',
		$base . 'js/app.js',
		array( 'hea-ma-data', 'hea-ma-engine', 'hea-ma-advice', 'hea-ma-courses' ),
		$ver( 'js/app.js' ),
		$footer
	);
}

add_shortcode( 'hea_maturity_assessment', 'hea_ma_shortcode' );
function hea_ma_shortcode() {
	// The page content can be rendered more than once per request (for
	// example by plugins building previews), so the markup is always
	// returned and the settings script is only added once. Use one
	// assessment per page: a second copy on the same page would not start.
	static $configured = false;
	if ( ! $configured ) {
		$configured = true;
		$settings   = hea_ma_settings();
		$privacy    = $settings['privacy_url'] ? $settings['privacy_url'] : get_privacy_policy_url();
		$config     = array(
			'submitUrl'  => hea_ma_valid_collector( $settings['collector_url'] ) ? $settings['collector_url'] : '',
			'privacyUrl' => $privacy ? esc_url_raw( $privacy ) : '',
		);
		wp_add_inline_script( 'hea-ma-app', 'window.HEA_CONFIG=' . wp_json_encode( $config ) . ';', 'before' );
	}

	wp_enqueue_style( 'hea-ma' );
	wp_enqueue_script( 'hea-ma-app' );

	return '<div id="hea-ma" class="hea-ma"><div id="hea-ma-app" class="hea-ma-app">'
		. '<noscript><p>This assessment needs JavaScript. Please switch it on, or open this page in another browser.</p></noscript>'
		. '</div></div>';
}

/**
 * Only Google Apps Script web app URLs are accepted, in either form:
 * https://script.google.com/macros/s/<id>/exec
 * https://script.google.com/a/macros/<domain>/s/<id>/exec (Google Workspace)
 */
function hea_ma_valid_collector( $url ) {
	return is_string( $url )
		&& (bool) preg_match( '#^https://script\.google\.com/(a/macros/[A-Za-z0-9.-]+|macros)/s/[A-Za-z0-9_-]{20,}/exec$#', $url );
}

// ---- Settings → Maturity assessment -------------------------------------------

add_action( 'admin_menu', 'hea_ma_admin_menu' );
function hea_ma_admin_menu() {
	add_options_page( 'Maturity assessment', 'Maturity assessment', 'manage_options', 'hea-maturity-assessment', 'hea_ma_settings_page' );
}

add_filter( 'plugin_action_links_' . plugin_basename( __FILE__ ), 'hea_ma_action_links' );
function hea_ma_action_links( $links ) {
	array_unshift( $links, '<a href="' . esc_url( admin_url( 'options-general.php?page=hea-maturity-assessment' ) ) . '">Settings</a>' );
	return $links;
}

add_action( 'admin_init', 'hea_ma_admin_init' );
function hea_ma_admin_init() {
	register_setting(
		'hea_ma',
		HEA_MA_OPTION,
		array(
			'type'              => 'array',
			'sanitize_callback' => 'hea_ma_sanitize',
			'default'           => array(),
		)
	);
}

function hea_ma_sanitize( $input ) {
	$old = hea_ma_settings();
	$out = array();

	$collector = isset( $input['collector_url'] ) ? trim( (string) $input['collector_url'] ) : '';
	if ( '' === $collector || hea_ma_valid_collector( $collector ) ) {
		$out['collector_url'] = $collector;
	} else {
		$out['collector_url'] = $old['collector_url'];
		add_settings_error( HEA_MA_OPTION, 'collector', 'The collector URL was not saved: it must be a Google Apps Script web app URL ending in /exec.' );
	}

	$privacy            = isset( $input['privacy_url'] ) ? trim( (string) $input['privacy_url'] ) : '';
	$out['privacy_url'] = $privacy ? esc_url_raw( $privacy, array( 'https', 'http' ) ) : '';

	return $out;
}

function hea_ma_settings_page() {
	if ( ! current_user_can( 'manage_options' ) ) {
		return;
	}
	$s              = hea_ma_settings();
	$default_policy = get_privacy_policy_url();
	?>
	<div class="wrap">
		<h1>Email maturity assessment</h1>
		<p>Put <code>[hea_maturity_assessment]</code> in a Shortcode block on any page to show the assessment.</p>
		<form method="post" action="options.php">
			<?php settings_fields( 'hea_ma' ); ?>
			<table class="form-table" role="presentation">
				<tr>
					<th scope="row"><label for="hea-ma-collector">Collector URL</label></th>
					<td>
						<input type="url" class="large-text code" id="hea-ma-collector" name="<?php echo esc_attr( HEA_MA_OPTION ); ?>[collector_url]" value="<?php echo esc_attr( $s['collector_url'] ); ?>" placeholder="https://script.google.com/.../exec">
						<p class="description">The Google Apps Script web app URL (ends in <code>/exec</code>). It saves each completed assessment to the responses sheet and sends the result emails. Leave it empty to switch saving and the "email my result" form off.</p>
					</td>
				</tr>
				<tr>
					<th scope="row"><label for="hea-ma-privacy">Privacy policy URL</label></th>
					<td>
						<input type="url" class="large-text" id="hea-ma-privacy" name="<?php echo esc_attr( HEA_MA_OPTION ); ?>[privacy_url]" value="<?php echo esc_attr( $s['privacy_url'] ); ?>" placeholder="<?php echo esc_attr( $default_policy ); ?>">
						<p class="description">Linked from the intro and the email form. Leave it empty to use the site's privacy policy page<?php echo $default_policy ? ' (' . esc_html( $default_policy ) . ')' : ''; ?>.</p>
					</td>
				</tr>
			</table>
			<?php submit_button(); ?>
		</form>
	</div>
	<?php
}
