jQuery(document).ready(function($) {
    // Kiểm tra xem dữ liệu đã được load chưa
    if (typeof fpdPricingData === 'undefined') {
        console.error('fpdPricingData is not defined');
        return;
    }

    // Toggle rules visibility
    $(document).on('click', '.show-group', function(e) {
        e.preventDefault();
        $(this).closest('.pricing-group').find('.group-rules').toggle();
    });
    
    // Open duplicate modal
    $(document).on('click', '.duplicate-group', function(e) {
        e.preventDefault();
        const groupIndex = $(this).closest('.pricing-group').data('index');
        
        if (typeof fpdPricingData.imageGroups[groupIndex] === 'undefined') {
            console.error('Group data not found at index:', groupIndex);
            return;
        }
        
        const groupData = fpdPricingData.imageGroups[groupIndex];
        
        $('#modal-title').text('Duplicate Group');
        $('#is-duplicate').val('1');
        $('#original-group-index').val(groupIndex);
        $('#element-name').val('');
        
        // Populate rules
        $('#rules-container').empty();
        if (groupData.data.rules && Array.isArray(groupData.data.rules)) {
            groupData.data.rules.forEach((rule) => {
                addRuleToModal(
                    rule.operator || '>',
                    rule.value?.width || '',
                    rule.value?.height || '',
                    rule.price || ''
                );
            });
        }
        
        $('#group-modal').show();
    });

    // Add New Group button
    $('#add-new-group').on('click', function(e) {
        e.preventDefault();
        const modalTitle = 'Add New Group';
        $('#modal-title').text(modalTitle);
        $('#is-duplicate').val('0');
        $('#original-group-index').val('');
        $('#element-name').val('');
        $('#rules-container').empty();
        addRuleToModal('>', '', '', ''); // Thêm rule mẫu
        $('#group-modal').show();
    });

    $(document).on('click', '.edit-group', function() {
        const groupIndex = $(this).closest('.pricing-group').data('index');
        const groupData = fpdPricingData.imageGroups[groupIndex];
        const elementName = groupData.data.target.elements.replace("#","");
        const modalTitle = 'Edit Group: ' + groupData.name;
        $('#modal-title').text(modalTitle);
        $('#is-duplicate').val('0');
        $('#original-group-index').val(groupIndex);
        $('#element-name').val(elementName);
        
        // Hiển thị elements selector (với #)
        $('#elements-selector').val(groupData.data.target.elements).parent().show();
        
        // Populate rules
        $('#rules-container').empty();
        groupData.data.rules.forEach((rule) => {
            addRuleToModal(
                rule.operator,
                rule.value.width,
                rule.value.height || "",
                rule.price
            );
        });
        
        $('#group-modal').show();
    });
    // Close modal
    $('.fpd-modal-close').click(function() {
        $('#group-modal').hide();
    });
    
    // Add rule in modal
    $('#add-rule-in-modal').click(function() {
        addRuleToModal('>', '', '', '');
    });
    
    // Save/Update group (add to list, not to DB yet)
    $('#group-form').submit(function(e) {
        e.preventDefault();
    
        const elementName = $('#element-name').val().trim();
        if (!elementName) {
            alert('Please enter a group name');
            return;
        }
        
        // Tạo elements selector từ name (thêm # nếu chưa có)
        let elements = elementName;
        if (!elements.startsWith('#')) {
            elements = '#' + elements;
        }
        groupName = "Motif - " + elementName;
        // Loại bỏ ký tự đặc biệt không hợp lệ trong selector
        // elements = elements.replace(/[^a-zA-Z0-9-_#]/g, '');
        
        // Collect rules
        const rules = [];
        $('.rule-item').each(function() {
            const operator = $(this).find('.rule-operator').val();
            const width = $(this).find('.rule-width').val();
            const height = $(this).find('.rule-height').val();
            const price = $(this).find('.rule-price').val();
            
            if (operator && width && price) {
                rules.push({
                    operator: operator,
                    value: {
                        width: width,
                        height: height
                    },
                    price: parseFloat(price)
                });
            }
        });
        
        if (rules.length === 0) {
            alert('Please add at least one rule');
            return;
        }

        const groupIndex = $('#original-group-index').val();
        const isDuplicate = $('#is-duplicate').val() === '1';

        // Create new group object
        const updatedGroup = {
            name: groupName,
            data: {
                property: 'imageSizeScaled',
                target: {
                    views: -1,
                    elements: elements
                },
                type: 'any',
                rules: rules
            }
        };

        
        let tempType = "Add New";
        // Add to temporary list
        if (isDuplicate || groupIndex === '') {
            // Thêm mới
            if (!window.tempGroups) window.tempGroups = [];
            window.tempGroups.push(updatedGroup);
        } else {
            // Cập nhật group hiện có
            fpdPricingData.imageGroups[groupIndex] = updatedGroup;
            tempType = "Update"
        }

        const newGroupHtml = `
            <div class="pricing-group temporary-item" data-temp-id="temp-${Date.now()}">
                <div class="group-header">
                    <h3>${groupName} <span class="temp-badge">(Pending Save - ${tempType})</span></h3>
                    <!--
                    <div class="group-actions">
                        <button class="button edit-group">Edit Rules</button>
                        <button class="button remove-temp-group">Remove</button>
                    </div>
                    -->   
                </div>
                <!--
                <div class="group-rules" style="display: none;">
                     Hiển thị rules tương tự như group thông thường 
                </div>
                -->
            </div>
        `;
        // Thêm vào đầu danh sách
        $('#pricing-groups-list').prepend(newGroupHtml);
        // Refresh list display
        refreshGroupsList();
        
        // Close modal and enable save button
        $('#group-modal').hide();
        $('#save-all-groups').prop('disabled', false);
    });
    
    // Save all groups to DB
    $('#save-all-groups').click(function() {
        // Lấy dữ liệu hiện tại
        $('#save-all-groups').prop('disabled', true);
        let allGroups = [...fpdPricingData.imageGroups];
        
        // Xóa các group đã marked
        if (window.groupsToDelete && window.groupsToDelete.length > 0) {
            allGroups = allGroups.filter((_, index) => !window.groupsToDelete.includes(index));
        }
        
        // Thêm các group tạm
        if (window.tempGroups && window.tempGroups.length > 0) {
            allGroups = [...allGroups, ...window.tempGroups];
        }
        
        // Send to server via AJAX
        $.ajax({
            url: fpdPricing.ajaxurl,
            type: 'POST',
            data: {
                action: 'fpd_save_pricing_groups',
                nonce: fpdPricing.nonce,
                groups: JSON.stringify(allGroups)
            },
            success: function(response) {
                if (response.success) {
                    // Reset các biến tạm
                    window.tempGroups = [];
                    window.groupsToDelete = [];
                    hasUnsavedChanges = false;
                    
                    alert('Groups saved successfully');
                    window.location.reload();
                } else {
                    alert('Error saving groups: ' + response.data);
                }
            }
        });
    });
    // Delete group
    $(document).on('click', '.delete-group', function() {
        if (!confirm('Are you sure you want to delete this group?')) return;
        
        const $group = $(this).closest('.pricing-group');
        const groupIndex = $group.data('index');
        
        if ($group.hasClass('temporary-item')) {
            // Xóa group tạm
            window.tempGroups = window.tempGroups.filter((_, i) => i != groupIndex);
        } else {
            // Đánh dấu group cần xóa
            if (!window.groupsToDelete) window.groupsToDelete = [];
            window.groupsToDelete.push(groupIndex);
            $group.hide();
        }
        
        $('#save-all-groups').prop('disabled', false);
    });
    
    function addRuleToModal(operator, width, height, price) {
        const ruleId = 'rule-' + Date.now();
        const ruleHtml = `
            <div class="rule-item" id="${ruleId}">
                <select class="rule-operator">
                    <option value=">" ${operator === '>' ? 'selected' : ''}>></option>
                    <option value="<" ${operator === '<' ? 'selected' : ''}><</option>
                    <option value="=" ${operator === '=' ? 'selected' : ''}>=</option>
                    <option value="<=" ${operator === '<=' ? 'selected' : ''}><=</option>
                    <option value=">=" ${operator === '>=' ? 'selected' : ''}>>=</option>
                </select>
                <input type="number" class="rule-width" placeholder="Width" value="${width || ''}">
                <input type="number" class="rule-height" placeholder="Height (optional)" value="${height || ''}">
                <input type="number" step="0.01" class="rule-price" placeholder="Price" value="${price || ''}">
                <button type="button" class="button remove-rule">Remove</button>
            </div>
        `;
        $('#rules-container').append(ruleHtml);
    }
    
    // Helper function to refresh groups list display
    function refreshGroupsList() {
        // This would update the UI with both original and new groups
        // Implementation depends on how you want to display the temporary groups
    }
    
    // Remove rule
    $(document).on('click', '.remove-rule', function() {
        $(this).closest('.rule-item').remove();
    });

    // Kiểm tra thay đổi trước khi rời trang
    let hasUnsavedChanges = false;

    $(document).on('click', '#add-new-group, .duplicate-group, .remove-temp-group, #save-all-groups', function() {
        hasUnsavedChanges = true;
    });

    $(document).on('click', 'a:not(#save-all-groups)', function(e) {
        if (hasUnsavedChanges) {
            e.preventDefault();
            const confirmLeave = confirm('You have unsaved changes. Are you sure you want to leave this page?');
            if (confirmLeave) {
                window.location.href = $(this).attr('href');
            }
        }
    });

    window.addEventListener('beforeunload', function(e) {
        if (hasUnsavedChanges) {
            e.preventDefault();
            e.returnValue = 'You have unsaved changes. Are you sure you want to leave?';
            return e.returnValue;
        }
    });

    // Reset trạng thái khi save thành công
    $(document).ajaxSuccess(function(event, xhr, settings) {
        if (settings.data && settings.data.includes('action=fpd_save_pricing_groups')) {
            hasUnsavedChanges = false;
        }
    });
});

