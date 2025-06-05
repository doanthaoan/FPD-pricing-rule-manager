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
        add_action('wp_ajax_fpd_get_category_images', array($this, 'get_category_images'));
        add_action('wp_ajax_fpd_create_category_groups', array($this, 'create_category_groups'));
        add_action('wp_ajax_fpd_get_pricing_groups', array($this, 'get_pricing_groups'));
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

    public function get_pricing_groups()
    {
        check_ajax_referer('fpd_pricing_nonce', 'nonce');

        $data = get_option($this->option_name, '[]');
        $pricing_groups = json_decode($data, true);

        $image_groups = array_values(array_filter($pricing_groups, function ($group) {
            return isset($group['data']['property']) && $group['data']['property'] === 'imageSizeScaled';
        }));

        wp_send_json_success($image_groups);
    }

    private function localize_script_data()
    {
        $data = get_option($this->option_name, '[]');
        $pricing_groups = json_decode($data, true);

        if (json_last_error() !== JSON_ERROR_NONE) {
            $pricing_groups = array();
        }

        // Filter only imageSizeScaled groups
        $image_groups = array_values(array_filter($pricing_groups, function ($group) {
            return isset($group['data']['property']) && $group['data']['property'] === 'imageSizeScaled';
        }));

        wp_localize_script('fpd-pricing-admin', 'fpdPricing', array(
            'ajaxurl' => admin_url('admin-ajax.php'),
            'nonce' => wp_create_nonce('fpd_pricing_nonce')
        ));

        wp_localize_script('fpd-pricing-admin', 'fpdPricingData', array(
            'imageGroups' => $image_groups
        ));
    }
    public function render_admin_page()
    {
        global $wpdb;

        // Lấy dữ liệu từ database
        $data = get_option($this->option_name, '[]');
        $pricing_groups = json_decode($data, true);

        // Debug log
        error_log('FPD Pricing Data: ' . print_r($data, true));
        error_log('Decoded Data: ' . print_r($pricing_groups, true));

        if (json_last_error() !== JSON_ERROR_NONE) {
            error_log('JSON Decode Error: ' . json_last_error_msg());
            $pricing_groups = []; // Reset nếu có lỗi decode
        }

        // Tạo dữ liệu mẫu nếu không có dữ liệu
        if (empty($pricing_groups)) {
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
            update_option($this->option_name, json_encode($pricing_groups, JSON_UNESCAPED_UNICODE));
        }

        // Lọc các group imageSizeScaled
        $image_groups = array_values(array_filter($pricing_groups, function ($group) {
            return isset($group['data']['property']) && $group['data']['property'] === 'imageSizeScaled';
        }));

        // Lấy danh sách categories có sẵn
        $available_categories = array_unique(array_filter(array_map(function ($group) {
            return $group['category'] ?? null;
        }, $image_groups)));

        sort($available_categories);

        // Lấy danh sách tất cả categories từ bảng designs
        $categories = $wpdb->get_results(
            "SELECT ID, title FROM {$wpdb->prefix}fpd_designs ORDER BY title"
        );

        // Truyền dữ liệu vào template
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
        // Lưu với JSON_UNESCAPED_UNICODE để giữ nguyên ký tự đặc biệt
        update_option($this->option_name, json_encode($updated_data, JSON_UNESCAPED_UNICODE));

        wp_send_json_success('Groups saved successfully');
    }
    public function get_category_images()
    {
        check_ajax_referer('fpd_pricing_nonce', 'nonce');

        if (!current_user_can('manage_options')) {
            wp_send_json_error('Unauthorized');
        }

        global $wpdb;
        $category_id = intval($_POST['category_id']);

        $category = $wpdb->get_row($wpdb->prepare(
            "SELECT * FROM {$wpdb->prefix}fpd_designs WHERE ID = %d",
            $category_id
        ));

        if (!$category) {
            wp_send_json_error('Category not found');
        }

        $designs = json_decode($category->designs, true);
        if (json_last_error() !== JSON_ERROR_NONE) {
            wp_send_json_error('Invalid designs data');
        }

        wp_send_json_success(array(
            'images' => array_map(function ($design) {
                return array(
                    'ID' => $design['ID'],
                    'title' => $design['title'],
                    'thumbnail' => $design['thumbnail'],
                    'image' => $design['image']
                );
            }, $designs)
        ));
    }
    public function create_category_groups()
    {
        check_ajax_referer('fpd_pricing_nonce', 'nonce');

        if (!current_user_can('manage_options')) {
            wp_send_json_error('Unauthorized');
        }

        $category_id = intval($_POST['category_id']);
        $select_all = intval($_POST['select_all']) === 1;
        $rules = json_decode(stripslashes($_POST['rules']), true);

        global $wpdb;

        // Lấy thông tin category
        $category = $wpdb->get_row($wpdb->prepare(
            "SELECT title FROM {$wpdb->prefix}fpd_designs WHERE ID = %d",
            $category_id
        ));

        if (!$category) {
            wp_send_json_error('Category not found');
        }

        $category_title = $category->title;

        // Lấy danh sách ảnh
        $images = array();

        if ($select_all) {
            // Lấy tất cả ảnh từ category
            $category_data = $wpdb->get_row($wpdb->prepare(
                "SELECT designs FROM {$wpdb->prefix}fpd_designs WHERE ID = %d",
                $category_id
            ));

            $designs = json_decode($category_data->designs, true);
            if (json_last_error() === JSON_ERROR_NONE) {
                $images = array_map(function ($design) {
                    return [
                        'id' => $design['ID'],
                        'title' => $design['title']
                    ];
                }, $designs);
            }
        } else {
            // Lấy từ danh sách đã chọn
            $selected_images = json_decode(stripslashes($_POST['selected_images']), true);
            if (json_last_error() === JSON_ERROR_NONE) {
                $images = $selected_images;
            }
        }

        // Tạo các groups
        $new_groups = array();
        foreach ($images as $image) {
            $new_groups[] = [
                'name' => 'Motif - ' . $image['title'],
                'category' => $category_title,
                'data' => [
                    'property' => 'imageSizeScaled',
                    'target' => [
                        'views' => -1,
                        'elements' => '#' . $image['title']
                    ],
                    'type' => 'any',
                    'rules' => $rules
                ]
            ];
        }

        // Lưu vào database
        $current_data = get_option($this->option_name, '[]');
        $current_groups = json_decode($current_data, true);
        $updated_groups = array_merge($current_groups, $new_groups);

        update_option($this->option_name, json_encode($updated_groups, JSON_UNESCAPED_UNICODE));

        wp_send_json_success([
            'message' => sprintf('%d groups created successfully!', count($new_groups))
        ]);
    }
}
