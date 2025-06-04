<?php
if (!defined('ABSPATH')) exit;

class FPDPricingManager
{

    private $option_name = 'fpd_pr_groups';

    public function __construct()
    {
        // Register hooks
        add_action('admin_menu', array($this, 'add_admin_menu'));
        add_action('admin_enqueue_scripts', array($this, 'enqueue_admin_scripts'));
        add_action('wp_ajax_fpd_save_pricing_groups', array($this, 'save_pricing_groups'));
    }

    public function add_admin_menu()
    {
        add_menu_page(
            'FPD Pricing Groups',
            'FPD Pricing',
            'manage_options',
            'fpd-pricing-manager',
            array($this, 'render_admin_page'),
            'dashicons-money-alt'
        );
    }

    public function enqueue_admin_scripts($hook)
    {
        if ($hook !== 'toplevel_page_fpd-pricing-manager') return;

        // CSS
        wp_enqueue_style(
            'fpd-pricing-admin',
            FPD_PRICING_MANAGER_URL . 'assets/css/admin.css',
            array(),
            filemtime(FPD_PRICING_MANAGER_PATH . 'assets/css/admin.css')
        );

        // JS
        wp_enqueue_script(
            'fpd-pricing-admin',
            FPD_PRICING_MANAGER_URL . 'assets/js/admin.js',
            array('jquery'),
            filemtime(FPD_PRICING_MANAGER_PATH . 'assets/js/admin.js'),
            true
        );

        // Localize script data
        $this->localize_script_data();
    }

    private function localize_script_data()
    {
        $data = get_option($this->option_name, '[]');
        $pricing_groups = json_decode($data, true);

        if (json_last_error() !== JSON_ERROR_NONE) {
            $pricing_groups = array();
        }

        // Filter only imageSizeScaled groups
        $image_groups = array_filter($pricing_groups, function ($group) {
            return isset($group['data']['property']) && $group['data']['property'] === 'imageSizeScaled';
        });

        wp_localize_script('fpd-pricing-admin', 'fpdPricing', array(
            'ajaxurl' => admin_url('admin-ajax.php'),
            'nonce' => wp_create_nonce('fpd_pricing_nonce')
        ));

        wp_localize_script('fpd-pricing-admin', 'fpdPricingData', array(
            'imageGroups' => array_values($image_groups)
        ));
    }

    public function render_admin_page()
    {
        $data = get_option($this->option_name, '[]');
        error_log('FPD Pricing Data: ' . print_r($data, true)); // Kiểm tra trong debug.log

        $pricing_groups = json_decode($data, true);
        error_log('Decoded Data: ' . print_r($pricing_groups, true));

        if (json_last_error() !== JSON_ERROR_NONE) {
            error_log('JSON Decode Error: ' . json_last_error_msg());
        }
        // Nếu không có dữ liệu, tạo mẫu
        if (empty($pricing_groups) || json_last_error() !== JSON_ERROR_NONE) {
            $sample_name = "sample-element";
            $pricing_groups = [
                [
                    "name" => $sample_name,
                    "data" => [
                        "property" => "imageSizeScaled",
                        "target" => [
                            "views" => -1,
                            "elements" => "#" . $sample_name // Đảm bảo có dấu #
                        ],
                        "type" => "any",
                        "rules" => [
                            [
                                "operator" => ">",
                                "value" => ["width" => 100, "height" => ""],
                                "price" => 10
                            ]
                        ]
                    ]
                ]
            ];
            update_option($this->option_name, json_encode($pricing_groups));
        }

        // Filter only imageSizeScaled groups
        $image_groups = array_filter($pricing_groups, function ($group) {
            return isset($group['data']['property']) && $group['data']['property'] === 'imageSizeScaled';
        });

        // Reset array keys
        $image_groups = array_values($image_groups);

        // Pass data to template
        include FPD_PRICING_MANAGER_PATH . 'templates/admin-page.php';
    }

    public function save_pricing_groups()
    {
        check_ajax_referer('fpd_pricing_nonce', 'nonce');

        if (!current_user_can('manage_options')) {
            wp_send_json_error('Unauthorized');
        }

        $image_groups = json_decode(stripslashes($_POST['groups']), true);

        if (json_last_error() !== JSON_ERROR_NONE) {
            wp_send_json_error('Invalid JSON data');
        }
        // Validate và chuẩn hóa dữ liệu
        // foreach ($image_groups as &$group) {
        //     if (isset($group['name']) && isset($group['data']['target']['elements'])) {
        //         // Đảm bảo elements bắt đầu bằng #
        //         if (!str_starts_with($group['data']['target']['elements'], '#')) {
        //             $group['data']['target']['elements'] = '#' . $group['data']['target']['elements'];
        //         }

        //         // Loại bỏ ký tự đặc biệt
        //         $group['data']['target']['elements'] = preg_replace('/[^a-zA-Z0-9-_#]/', '', $group['data']['target']['elements']);
        //     }
        // }


        // Lấy toàn bộ dữ liệu hiện có
        $current_data = get_option($this->option_name, '[]');
        $all_groups = json_decode($current_data, true);

        // Lọc ra các group không phải imageSizeScaled
        $other_groups = array_filter($all_groups, function ($group) {
            return !isset($group['data']['property']) || $group['data']['property'] !== 'imageSizeScaled';
        });

        // Kết hợp với các image groups mới
        $updated_data = array_merge($other_groups, $image_groups);

        // Lưu vào database
        // update_option($this->option_name, json_encode($updated_data));
        // Lưu với JSON_UNESCAPED_UNICODE để giữ nguyên ký tự đặc biệt
        update_option($this->option_name, json_encode($updated_data, JSON_UNESCAPED_UNICODE));

        wp_send_json_success('Groups saved successfully');
    }
}
