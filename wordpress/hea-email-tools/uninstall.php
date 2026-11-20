<?php
// Removes the plugin's one setting when the plugin is deleted.
if ( ! defined( 'WP_UNINSTALL_PLUGIN' ) ) {
	exit;
}
delete_option( 'hea_et_settings' );
