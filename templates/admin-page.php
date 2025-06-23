<?php
// Kiểm tra và khởi tạo biến nếu chưa có
$image_groups = isset($image_groups) && is_array($image_groups) ? $image_groups : array();
?>
<div class="wrap">
    <h1>FPD Pricing Groups Manager</h1>
    <!-- Tab navigation -->
    <h2 class="nav-tab-wrapper">
        <a href="#existing-groups" class="nav-tab nav-tab-active">Existing Groups</a>
        <a href="#create-from-category" class="nav-tab">Create from Category</a>
        <a href="#duplicate-elements" class="nav-tab">Duplicate Elements</a>
    </h2>
    <div id="existing-groups" class="tab-content">
        <div class="category-filter">
            <strong>Filter by Category:</strong>
            <a href="#" class="category-filter-item" data-category="">All</a>
            <a href="#" class="category-filter-item" data-category="Uncategorized">Uncategorized</a>
            <?php foreach ($available_categories as $cat): ?>
            <a href="#" class="category-filter-item" data-category="<?php echo esc_attr($cat); ?>">
                <?php echo esc_html($cat); ?>
            </a>
            <?php endforeach; ?>
        </div>
        <div class="fpd-pricing-container">
            <div class="fpd-pricing-header">
                <h2>Image Size Pricing Groups</h2>
                <button id="add-new-group" class="button button-primary">Add New Group</button>
                <button id="save-all-groups" class="button button-primary" disabled>Save All Changes</button>
            </div>
            <div id="pricing-groups-list">
                <?php if (!empty($image_groups)): ?>
                <?php foreach ($image_groups as $index => $group): ?>
                <?php if (isset($group['data']['property']) && $group['data']['property'] === 'imageSizeScaled'): ?>
                <div class="pricing-group" data-index="<?php echo esc_attr($index); ?>"
                    data-category="<?php echo esc_attr($group['category'] ?? 'Uncategorized'); ?>">
                    <div class="group-header">
                        <div class="group-details">
                            <p><?php echo esc_html($index + 1); ?>
                            </p>
                        </div>
                        <h3><?php echo esc_html($group['name']); ?></h3>
                        <div class="group-details">
                            <p>Element: <?php echo esc_html($group['data']['target']['elements'] ?? ''); ?>
                            </p>
                        </div>
                        <div class="group-meta">
                            <span class="group-category">Category:
                                <?php echo esc_html($group['category'] ?? 'Uncategorized'); ?></span>
                        </div>
                        <div class="group-actions">
                            <button class="button duplicate-group">Duplicate</button>
                            <button class="button show-group">Show</button>
                            <button class="button edit-group">Edit</button>
                            <button class="button delete-group">Delete</button>
                        </div>
                    </div>

                    <div class="group-rules" style="display: none;">
                        <table class="wp-list-table widefat fixed striped">
                            <thead>
                                <tr>
                                    <th>Operator</th>
                                    <th>Width</th>
                                    <th>Height</th>
                                    <th>Price</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                <?php if (isset($group['data']['rules']) && is_array($group['data']['rules'])): ?>
                                <?php foreach ($group['data']['rules'] as $rule_index => $rule): ?>
                                <tr>
                                    <td><?php echo esc_html($rule['operator'] ?? ''); ?></td>
                                    <td><?php echo esc_html($rule['value']['width'] ?? ''); ?></td>
                                    <td><?php echo esc_html($rule['value']['height'] ?? ''); ?></td>
                                    <td><?php echo esc_html($rule['price'] ?? ''); ?></td>
                                    <td>
                                        <button class="button edit-rule">Edit</button>
                                        <button class="button delete-rule">Delete</button>
                                    </td>
                                </tr>
                                <?php endforeach; ?>
                                <?php endif; ?>
                            </tbody>
                        </table>
                        <button class="button add-rule">Add New Rule</button>
                    </div>
                </div>
                <?php endif; ?>
                <?php endforeach; ?>
                <?php else: ?>
                <p>No image pricing groups found.</p>
                <?php endif; ?>
            </div>
        </div>
    </div>

    <div id="create-from-category" class="tab-content" style="display: none;">
        <div id="images-list-container">
            <div class="form-group">
                <label for="category-select">Select Category:</label>
                <select id="category-select" class="regular-text">
                    <option value="">-- Select Category --</option>
                    <?php foreach ($categories as $category): ?>
                    <option value="<?php echo esc_attr($category->ID); ?>">
                        <?php echo esc_html($category->title); ?>
                    </option>
                    <?php endforeach; ?>
                </select>
            </div>

            <div class="form-group">
                <label>
                    <input type="checkbox" id="select-all-images"> Select All Images
                </label>
                <button id="select-images-btn" class="button" disabled>Select Images</button>
            </div>
        </div>
        <div id="selected-images-container" style="display: none;">
            <h3>Selected Images</h3>
            <div id="selected-images-list"></div>
        </div>

        <div id="pricing-rules-section">
            <h3>Pricing Rules</h3>
            <div id="category-rules-container">
                <!-- Rules sẽ được thêm ở đây -->
            </div>
            <button type="button" id="add-category-rule" class="button">Add Rule</button>
        </div>

        <button type="button" id="save-category-groups" class="button button-primary">Create Groups</button>
    </div>
    <div id="duplicate-elements" class="tab-content" style="display: none;">
        <div class="duplicate-groups-container">
            <div class="fpd-pricing-header">
                <h2>Groups with Duplicate Elements</h2>
                <button id="save-all-duplicate-fix" class="button button-primary" disabled>Save All Changes</button>
            </div>
            <div id="duplicate-groups-list">
                <div class="loading-duplicates">Loading duplicate groups...</div>
            </div>
        </div>
    </div>
    <!-- Modal chọn ảnh -->
    <div id="images-modal" class="fpd-modal" style="display: none;">
        <div class="fpd-modal-content">
            <span class="fpd-modal-close">&times;</span>
            <h2>Select Images</h2>
            <div id="images-list" style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px;"></div>
            <button type="button" id="confirm-images-selection" class="button button-primary">Confirm Selection</button>
        </div>
    </div>
    <!-- Modal for duplicate/edit group -->
    <div id="group-modal" class="fpd-modal" style="display: none;">
        <div class="fpd-modal-content">
            <span class="fpd-modal-close">&times;</span>
            <h2 id="modal-title">Duplicate Group</h2>

            <form id="group-form">
                <input type="hidden" id="original-group-index" value="">
                <input type="hidden" id="is-duplicate" value="1">

                <div class="form-group">
                    <label for="element-name">Element Name</label>
                    <input type="text" id="element-name" class="regular-text" required>
                    <p class="description">This will be used as the element selector (automatically prefixed with #)</p>
                </div>
                <div class="form-group">
                    <label for="category-name">Category Name</label>
                    <input type="text" id="category-name" class="regular-text"
                        placeholder="Enter category name (optional)">
                    <p class="description">Default is Uncategory (created by manually add new) OR the category you chose
                        (created using Category tab)</p>
                </div>
                <!-- Hidden field for storing the element selector, used internally for group identification -->
                <input type="hidden" id="elements-selector" value="">

                <div id="rules-container">
                    <!-- Rules will be added here dynamically -->
                </div>

                <button type="button" id="add-rule-in-modal" class="button">Add Rule</button>
                <button type="submit" id="save-group" class="button button-primary">Save Group</button>
            </form>
        </div>
    </div>

    <div id="fpd-loading-screen" style="display: none;">
        <div class="fpd-loading-content">
            <div class="fpd-loading-spinner"></div>
            <div class="fpd-loading-text">Processing...</div>
        </div>
    </div>
</div>