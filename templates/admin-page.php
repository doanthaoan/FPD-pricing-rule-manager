<?php
// Kiểm tra và khởi tạo biến nếu chưa có
$image_groups = isset($image_groups) ? $image_groups : array();
?>
<div class="wrap">
    <h1>FPD Pricing Groups Manager</h1>

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
                        <div class="pricing-group" data-index="<?php echo esc_attr($index); ?>">
                            <div class="group-header">
                                <h3><?php echo esc_html($group['name']); ?></h3>
                                <div class="group-details">
                                    <p>Element:</> <?php echo esc_html($group['data']['target']['elements'] ?? ''); ?>
                                    </p>
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

                <!-- Ẩn trường elements-selector -->
                <input type="hidden" id="elements-selector" value="">

                <div id="rules-container">
                    <!-- Rules will be added here dynamically -->
                </div>

                <button type="button" id="add-rule-in-modal" class="button">Add Rule</button>
                <button type="submit" id="save-group" class="button button-primary">Save Group</button>
            </form>
        </div>
    </div>
</div>