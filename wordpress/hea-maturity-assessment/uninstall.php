<?php
// Runs when the plugin is deleted in WordPress: removes its saved settings.
// The responses sheet in Google is not touched.
if ( ! defined( 'WP_UNINSTALL_PLUGIN' ) ) {
	exit;
}
delete_option( 'hea_ma_settings' );
