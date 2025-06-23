<?php

/**
 * Plugin Name: FPD Pricing Manager
 * Description: Manage FPD pricing groups
 * Version: 1.2
 * Author: Neotiq HN
 * Text Domain: fpd-pricing-manager
 */

defined('ABSPATH') || exit;

// Define plugin constants
define('FPD_PRICING_MANAGER_VERSION', '1.0');
define('FPD_PRICING_MANAGER_PATH', plugin_dir_path(__FILE__));
define('FPD_PRICING_MANAGER_URL', plugin_dir_url(__FILE__));
define('FPD_PRICING_MANAGER_BASENAME', plugin_basename(__FILE__));

// Include the main plugin class
require_once FPD_PRICING_MANAGER_PATH . 'includes/class-fpd-pricing-manager.php';

// Initialize the plugin
function fpd_pricing_manager_init()
{
    new FPDPricingManager();
}
add_action('plugins_loaded', 'fpd_pricing_manager_init');
