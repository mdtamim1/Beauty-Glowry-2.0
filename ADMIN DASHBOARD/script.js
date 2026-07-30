import locations from './locations.js';
import products from './products.js';

// DOM Elements
const sidebarItems = document.querySelectorAll('.nav-item');
const orderModal = document.getElementById('order-modal');
const invoiceModal = document.getElementById('invoice-modal');
const addOrderBtn = document.getElementById('add-order-btn');
const closeModal = document.getElementById('close-modal');
const closeInvoice = document.getElementById('close-invoice');

// Form Elements
const orderForm = document.getElementById('order-form');
const ordersList = document.getElementById('orders-list');

// Location Selectors
const districtSelect = document.getElementById('cust-district');
const thanaSelect = document.getElementById('cust-thana');
const zoneSelect = document.getElementById('cust-zone');

// Product & Pricing Elements
const productRows = document.getElementById('product-rows');
const subtotalInput = document.getElementById('subtotal-input');
const deliveryInput = document.getElementById('delivery-input');
const discountInput = document.getElementById('discount-input');
const paidInput = document.getElementById('paid-input');
const totalInput = document.getElementById('total-input');

// State
let orders = JSON.parse(localStorage.getItem('spcl_orders')) || [];
let editingOrderId = null;
let currentFilter = 'All';
let complains = JSON.parse(localStorage.getItem('spcl_complains')) || [];
let complainStaffFilter = '';

const productData = products;

// Helper to normalize items from old/new data structure
function getOrderItems(order) {
    if (order.items && Array.isArray(order.items)) return order.items;

    // Fallback for old orders
    const legacyName = order.products ? order.products.replace('1 x ', '') : 'Product';
    return [{
        name: legacyName,
        qty: order.qty || 1,
        price: order.unitPrice || (order.subtotal || order.total || 0),
        color: '',
        size: '',
        code: 'OLD-DATA'
    }];
}

function updateDashboardStats() {
    const user = JSON.parse(localStorage.getItem('spcl_user'));
    const isAdmin = user && user.role === 'Admin';

    const counts = {
        all: orders.length,
        today: 0,
        processing: 0,
        pending: 0,
        hold: 0,
        completed: 0,
        canceled: 0
    };

    const todayStr = new Date().toISOString().split('T')[0];

    orders.forEach(order => {
        const isOwnerOrAssignee = user && (order.createdBy === user.username || order.assignedTo === user.username);
        
        // Today count is global for everyone
        if (order.date === todayStr) counts.today++;

        const status = order.status.toLowerCase();
        
        // Status counts: Admin sees global, Staff sees individual (owned/assigned)
        const shouldCountStatus = isAdmin || isOwnerOrAssignee;
        
        if (shouldCountStatus) {
            if (status === 'processing') counts.processing++;
            if (status === 'pending') counts.pending++;
            if (status === 'hold') counts.hold++;
            if (status === 'complete') counts.completed++;
            if (status === 'cancelled') counts.canceled++;
        }
    });

    if (document.getElementById('val-all')) document.getElementById('val-all').textContent = counts.all;
    if (document.getElementById('val-today')) document.getElementById('val-today').textContent = counts.today;
    if (document.getElementById('val-processing')) document.getElementById('val-processing').textContent = counts.processing;
    if (document.getElementById('val-pending')) document.getElementById('val-pending').textContent = counts.pending;
    if (document.getElementById('val-hold')) document.getElementById('val-hold').textContent = counts.hold;
    if (document.getElementById('val-completed')) document.getElementById('val-completed').textContent = counts.completed;
    if (document.getElementById('val-canceled')) document.getElementById('val-canceled').textContent = counts.canceled;
}

// Initialize
function init() {
    populateDistricts();
    setupEventListeners();
    updateDashboardStats();
    populateOnlineStaffFilter();
    renderOrders();
    updateNoteSuggestions();
    
    // Admin specific UI (Unlocked)
    // const user = JSON.parse(localStorage.getItem('spcl_user'));
    // if (user && user.role !== 'Admin') {
    //     document.querySelectorAll('.isAdmin').forEach(el => el.style.display = 'none');
    // }
    document.querySelectorAll('.isAdmin').forEach(el => {
        if (el.tagName === 'DIV' || el.tagName === 'BUTTON' || el.tagName === 'SECTION') {
             el.style.display = ''; // Use default display
        } else {
             el.style.display = 'flex'; // Default for nav-items
        }
    });

    // List Filters
    const staffDateInput = document.getElementById('staff-stats-date');
    if (staffDateInput) {
        staffDateInput.value = new Date().toISOString().split('T')[0];
        staffDateInput.addEventListener('change', renderStaffList);
    }

    // Set default active filter UI
    const allCard = document.getElementById('card-all');
    if (allCard) allCard.classList.add('active-filter');

    // Close Profile Modal
    const closeProfileBtn = document.getElementById('close-profile-modal');
    if (closeProfileBtn) {
        closeProfileBtn.onclick = () => document.getElementById('staff-profile-modal').style.display = 'none';
    }
}

// Activity Logging
function logActivity(action, details) {
    let logs = JSON.parse(localStorage.getItem('spcl_activities')) || [];
    const user = JSON.parse(localStorage.getItem('spcl_user'));
    const log = {
        user: user ? user.name : 'System',
        action: action,
        details: details,
        time: new Date().toLocaleTimeString(),
        date: new Date().toLocaleDateString()
    };
    logs.unshift(log);
    // Keep last 50
    localStorage.setItem('spcl_activities', JSON.stringify(logs.slice(0, 50)));
}

// History Logic
function addOrderHistory(orderId, action, note = '') {
    const orders = JSON.parse(localStorage.getItem('spcl_orders')) || [];
    const idx = orders.findIndex(o => o.id === orderId);
    if (idx !== -1) {
        if (!orders[idx].history) orders[idx].history = [];
        const user = JSON.parse(localStorage.getItem('spcl_user'));
        orders[idx].history.push({
            time: new Date().toLocaleString(),
            action: action,
            note: note,
            user: user ? user.name : 'System'
        });
        localStorage.setItem('spcl_orders', JSON.stringify(orders));
    }
}

window.showOrderHistory = function(orderId) {
    const orders = JSON.parse(localStorage.getItem('spcl_orders')) || [];
    const order = orders.find(o => o.id === orderId);
    if (!order) return;

    document.getElementById('hist-invoice-id').textContent = '#' + order.id;
    document.getElementById('hist-creator').textContent = order.createdBy === 'TAMIM@SHOP' ? 'Tamim' : (order.createdBy || 'System');

    const timeline = document.getElementById('order-timeline');
    const history = order.history || [];

    if (history.length === 0) {
        timeline.innerHTML = '<p style="text-align: center; color: #94a3b8; padding: 2rem;">No history found for this order.</p>';
    } else {
        timeline.innerHTML = history.slice().reverse().map(item => {
            let icon = 'fa-dot-circle';
            let tagClass = 'tag-status';
            
            if (item.action.toLowerCase().includes('created')) {
                icon = 'fa-plus-circle';
                tagClass = 'tag-create';
            } else if (item.action.toLowerCase().includes('transfer') || item.action.toLowerCase().includes('assigned')) {
                icon = 'fa-exchange-alt';
                tagClass = 'tag-transfer';
            } else if (item.action.toLowerCase().includes('updated')) {
                icon = 'fa-edit';
                tagClass = 'tag-update';
            } else if (item.action.toLowerCase().includes('status changed')) {
                icon = 'fa-sync-alt';
                tagClass = 'tag-status';
            }

            return `
                <div class="timeline-item">
                    <div class="timeline-dot">
                        <i class="fas ${icon}"></i>
                    </div>
                    <div class="timeline-content">
                        <div class="timeline-time">
                            <i class="far fa-clock"></i> ${item.time}
                        </div>
                        <div class="timeline-action">
                            <span class="status-indicator-tag ${tagClass}">${item.action}</span>
                            <span class="timeline-user-badge"><i class="fas fa-user-circle"></i> ${item.user}</span>
                        </div>
                        ${item.note ? `<div class="timeline-note">${item.note}</div>` : ''}
                    </div>
                </div>
            `;
        }).join('');
    }

    document.getElementById('history-modal').style.display = 'flex';
};

function renderActivities() {
    const logList = document.getElementById('activity-log');
    if (!logList) return;
    const logs = JSON.parse(localStorage.getItem('spcl_activities')) || [];
    
    logList.innerHTML = logs.map(l => `
        <div class="activity-item">
            <i class="fas fa-dot-circle"></i>
            <div class="content">
                <strong>${l.user}</strong> ${l.action} <span>${l.details}</span>
                <div class="time">${l.time} - ${l.date}</div>
            </div>
        </div>
    `).join('');

    renderStaffPerformance();
}

function renderStaffPerformance() {
    const performanceContainer = document.getElementById('staff-performance-chart');
    if (!performanceContainer) return;

    const staffAccounts = JSON.parse(localStorage.getItem('spcl_staff_accounts')) || [];
    const todayStr = new Date().toISOString().split('T')[0];
    
    const stats = staffAccounts.map(s => {
        const staffOrders = orders.filter(o => 
            o.date === todayStr && 
            (o.assignedTo === s.username || (!o.assignedTo && o.createdBy === s.username))
        );

        const counts = {
            total: staffOrders.length,
            success: staffOrders.filter(o => ['delivered successfull', 'complete', 'completed'].includes(o.status.toLowerCase())).length,
            canceled: staffOrders.filter(o => ['returned', 'cancelled', 'canceled'].includes(o.status.toLowerCase())).length
        };

        return { ...s, ...counts };
    }).sort((a, b) => b.total - a.total);

    if (stats.length === 0) {
        performanceContainer.innerHTML = `
            <div style="padding: 2rem; text-align: center; color: #94a3b8;">
                <i class="fas fa-user-friends fa-3x" style="margin-bottom: 1rem;"></i>
                <p>No staff accounts found</p>
            </div>`;
        return;
    }

    performanceContainer.innerHTML = stats.map(s => {
        const successRate = s.total > 0 ? ((s.success / s.total) * 100).toFixed(0) : 0;
        
        return `
            <div class="staff-perf-row" style="padding: 15px; border-bottom: 1px solid #f1f5f9;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
                    <div style="display: flex; align-items: center; gap: 10px;">
                        <img src="https://ui-avatars.com/api/?name=${s.name}&background=f1f5f9&color=64748b" style="width: 32px; height: 32px; border-radius: 50%;">
                        <div>
                            <div style="font-weight: 700; color: #1e293b; font-size: 0.9rem;">${s.name}</div>
                            <div style="font-size: 0.75rem; color: #64748b;">@${s.username}</div>
                        </div>
                    </div>
                    <div style="text-align: right;">
                        <div style="font-weight: 800; color: #4f46e5; font-size: 1rem;">${s.total}</div>
                        <div style="font-size: 0.65rem; color: #94a3b8; text-transform: uppercase; font-weight: 700;">Orders Today</div>
                    </div>
                </div>
                
                <div style="display: flex; gap: 15px; margin-bottom: 8px;">
                    <div style="flex: 1;">
                        <div style="display: flex; justify-content: space-between; font-size: 0.7rem; margin-bottom: 4px;">
                            <span style="color: #059669; font-weight: 600;">Success: ${s.success}</span>
                            <span style="color: #64748b;">${successRate}% Rate</span>
                        </div>
                        <div style="height: 6px; background: #f1f5f9; border-radius: 10px; overflow: hidden;">
                            <div style="width: ${successRate}%; height: 100%; background: #10b981;"></div>
                        </div>
                    </div>
                    <div style="width: 80px;">
                        <div style="font-size: 0.7rem; color: #ef4444; font-weight: 600; margin-bottom: 4px;">Canceled: ${s.canceled}</div>
                        <div style="height: 6px; background: #f1f5f9; border-radius: 10px; overflow: hidden;">
                            <div style="width: ${s.total > 0 ? (s.canceled / s.total * 100) : 0}%; height: 100%; background: #ef4444;"></div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

function renderStaffList() {
    const listBody = document.getElementById('staff-list');
    if (!listBody) return;
    const staff = JSON.parse(localStorage.getItem('spcl_staff_accounts')) || [];
    const targetDate = document.getElementById('staff-stats-date')?.value || new Date().toISOString().split('T')[0];
    
    listBody.innerHTML = staff.map(s => {
        // Calculate dynamic stats for this staff on target date
        const staffOrders = orders.filter(o => 
            o.date === targetDate && 
            (o.assignedTo === s.username || (!o.assignedTo && o.createdBy === s.username))
        );

        const stats = {
            processing: 0,
            pending: 0,
            hold: 0,
            canceled: 0,
            completed: 0
        };

        staffOrders.forEach(o => {
            const st = o.status.toLowerCase();
            if (st === 'processing') stats.processing++;
            else if (st === 'pending') stats.pending++;
            else if (st === 'hold') stats.hold++;
            else if (st === 'cancelled' || st === 'canceled') stats.canceled++;
            else if (st === 'complete' || st === 'completed' || st === 'delivered') stats.completed++;
        });

        const totalActive = stats.processing + stats.pending + stats.hold + stats.canceled;

        return `
            <tr>
                <td><strong>${s.name}</strong></td>
                <td>${s.username}</td>
                <td>${s.lastActive || 'Never'}</td>
                <td><span class="staff-status ${s.isOnline ? 'status-online' : 'status-offline'}"></span> ${s.isOnline ? 'Online' : 'Offline'}</td>
                <td>
                    <div class="staff-stats-breakdown" onclick="window.showStaffProfile('${s.username}')" style="cursor: pointer; transition: transform 0.2s;">
                        <div class="stat-main">Total Orders: <strong>${totalActive} <i class="fas fa-external-link-alt" style="font-size: 0.6rem; opacity: 0.5;"></i></strong></div>
                        <div class="stat-sub">
                            <span>P: <b>${stats.processing}</b></span>
                            <span>H: <b>${stats.hold}</b></span>
                            <span>W: <b>${stats.pending}</b></span>
                            <span>C: <b>${stats.canceled}</b></span>
                        </div>
                        <div class="stat-complete">
                            <span>Completed:</span>
                            <span>${stats.completed}</span>
                        </div>
                    </div>
                </td>
                <td>
                    <div style="display: flex; gap: 8px;">
                        <button class="btn btn-secondary" onclick="toggleStaffStatus('${s.username}')" style="font-size: 0.75rem; padding: 6px 12px;">
                            ${s.isOnline ? 'Force Offline' : 'Mark Online'}
                        </button>
                        <button class="btn btn-danger" onclick="deleteStaff('${s.username}')" style="font-size: 0.75rem; padding: 6px 12px; background: #ef4444;">
                            <i class="fas fa-trash-alt"></i> Delete
                        </button>
                    </div>
                </td>
            </tr>
        `;
    }).join('');
    populateOnlineStaffFilter(); // Sync filter dropdown
}

window.showStaffProfile = function(username) {
    const staff = (JSON.parse(localStorage.getItem('spcl_staff_accounts')) || []).find(s => s.username === username);
    if (!staff) return;

    const allOrders = orders.filter(o => o.assignedTo === username || (!o.assignedTo && o.createdBy === username));
    
    const stats = {
        processing: 0, pending: 0, hold: 0, canceled: 0, completed: 0,
        deliveredValue: 0, deliveredCharge: 0,
        returnedValue: 0, returnedCharge: 0,
        products: {},
        historyCount: 0
    };

    allOrders.forEach(o => {
        const status = (o.status || '').toLowerCase();
        
        // Mapping as per user request:
        // 'Active Orders' = Sent but not yet final (Delivered, Invoiced, Processing, etc.)
        if (['invoiced', 'delivered', 'processing', 'pending', 'hold'].includes(status)) {
            stats.processing++;
        } 
        
        // 'Lifetime Success' = Delivered Successfull / Complete
        else if (status === 'delivered successfull' || status === 'complete' || status === 'completed') {
            stats.completed++;
        }
        
        // 'Canceled' = Returned / Cancelled
        else if (status === 'returned' || status === 'cancelled' || status === 'canceled') {
            stats.canceled++;
        }

        // Financials tracking
        if (status === 'delivered successfull' || status === 'complete' || status === 'completed') {
            stats.deliveredValue += (o.subtotal || 0);
            stats.deliveredCharge += (o.shipping || 0);
        } else if (status === 'returned') {
            stats.returnedValue += (o.subtotal || 0);
            stats.returnedCharge += (o.shipping || 0);
        }

        // Products stats
        if (o.items) {
            o.items.forEach(item => {
                const name = item.name;
                if (!stats.products[name]) stats.products[name] = { qty: 0, rev: 0 };
                stats.products[name].qty += (item.qty || 0);
                stats.products[name].rev += (item.qty * (item.price || 0));
            });
        }

        // History count
        if (o.history) stats.historyCount += o.history.length;
    });

    // Populate Modal
    document.getElementById('prof-staff-name').textContent = staff.name;
    document.getElementById('prof-staff-user').textContent = staff.username;
    document.getElementById('prof-active-orders').textContent = stats.processing; // Now shows 'Delivered section' orders
    document.getElementById('prof-complete-orders').textContent = stats.completed; // Delivered Successfull
    document.getElementById('prof-cancel-orders').textContent = stats.canceled; // Returned + Canceled
    document.getElementById('prof-total-history').textContent = stats.historyCount;

    document.getElementById('prof-delivered-value').textContent = '৳ ' + stats.deliveredValue.toLocaleString();
    document.getElementById('prof-delivered-charge').textContent = '৳ ' + stats.deliveredCharge.toLocaleString();
    document.getElementById('prof-returned-value').textContent = '৳ ' + stats.returnedValue.toLocaleString();
    document.getElementById('prof-returned-charge').textContent = '৳ ' + stats.returnedCharge.toLocaleString();

    // Top Products
    const sortedProds = Object.entries(stats.products).sort((a, b) => b[1].rev - a[1].rev).slice(0, 5);
    const prodBody = document.getElementById('prof-top-products');
    prodBody.innerHTML = sortedProds.map(([name, p]) => `
        <tr style="border-bottom: 1px solid #f8fafc;">
            <td style="padding: 12px; font-weight: 600; color: #1e293b;">${name}</td>
            <td style="padding: 12px; text-align: center;"><span style="background: #eef2ff; color: #4338ca; padding: 2px 8px; border-radius: 4px; font-weight: 700;">${p.qty}</span></td>
            <td style="padding: 12px; text-align: right; font-weight: 700; color: #059669;">৳ ${p.rev.toLocaleString()}</td>
        </tr>
    `).join('') || '<tr><td colspan="3" style="text-align:center; padding: 20px; color: #94a3b8;">No sales data available</td></tr>';

    document.getElementById('staff-profile-modal').style.display = 'flex';
};

function populateOnlineStaffFilter() {
    const filter = document.getElementById('staff-order-filter');
    if (!filter) return;
    
    const selected = filter.value;
    const staff = JSON.parse(localStorage.getItem('spcl_staff_accounts')) || [];
    const onlineStaff = staff.filter(s => s.isOnline);
    
    filter.innerHTML = '<option value="">Filter by Online Staff</option>';
    onlineStaff.forEach(s => {
        const option = document.createElement('option');
        option.value = s.username;
        option.textContent = s.name;
        filter.appendChild(option);
    });
    
    if (onlineStaff.some(s => s.username === selected)) {
        filter.value = selected;
    }
}

window.deleteStaff = function(uname) {
    if (!confirm(`Are you sure you want to delete staff account: ${uname}? This action cannot be undone.`)) return;
    
    let staff = JSON.parse(localStorage.getItem('spcl_staff_accounts')) || [];
    staff = staff.filter(s => s.username !== uname);
    localStorage.setItem('spcl_staff_accounts', JSON.stringify(staff));
    
    logActivity('Staff Deleted', `Account ${uname} was removed by Admin`);
    renderStaffList();
};

window.toggleStaffStatus = function(uname) {
    let staff = JSON.parse(localStorage.getItem('spcl_staff_accounts')) || [];
    const idx = staff.findIndex(s => s.username === uname);
    if (idx !== -1) {
        staff[idx].isOnline = !staff[idx].isOnline;
        localStorage.setItem('spcl_staff_accounts', JSON.stringify(staff));
        renderStaffList();
    }
};

function updateNoteSuggestions() {
    const custDatalist = document.getElementById('cust-note-suggestions');
    const shopDatalist = document.getElementById('shop-note-suggestions');
    if (!custDatalist || !shopDatalist) return;

    const custFreq = {};
    const shopFreq = {};

    orders.forEach(order => {
        if (order.customerNote && order.customerNote.trim()) {
            const note = order.customerNote.trim();
            custFreq[note] = (custFreq[note] || 0) + 1;
        }
        if (order.shopNote && order.shopNote.trim()) {
            const note = order.shopNote.trim();
            shopFreq[note] = (shopFreq[note] || 0) + 1;
        }
    });

    const getTop5 = (freqMap) => {
        return Object.entries(freqMap)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5)
            .map(entry => entry[0]);
    };

    const topCust = getTop5(custFreq);
    const topShop = getTop5(shopFreq);

    custDatalist.innerHTML = topCust.map(note => `<option value="${note}">`).join('');
    shopDatalist.innerHTML = topShop.map(note => `<option value="${note}">`).join('');
}

function populateDistricts() {
    if (!districtSelect) return;
    districtSelect.innerHTML = '<option value="">Select District</option>';
    Object.keys(locations).sort().forEach(district => {
        const option = document.createElement('option');
        option.value = district;
        option.textContent = district;
        districtSelect.appendChild(option);
    });
}

function populateProducts(filter = '') {
    const prodDatalist = document.getElementById('prod-datalist');
    if (!prodDatalist) return;

    prodDatalist.innerHTML = '';

    // Only show suggestions if there is text
    if (!filter.trim()) return;

    const query = filter.toLowerCase();
    let count = 0;
    for (const name of Object.keys(productData)) {
        if (name.toLowerCase().includes(query)) {
            const option = document.createElement('option');
            option.value = name;
            prodDatalist.appendChild(option);
            count++;
            if (count >= 5) break;
        }
    }
}

function getStatusClass(status) {
    switch (status.toLowerCase()) {
        case 'processing': return 'status-processing';
        case 'shipped': return 'status-shipped';
        case 'delivered': return 'status-delivered';
        case 'canceled': return 'status-canceled';
        default: return 'status-processing';
    }
}

function cycleStatus(orderId) {
    const statuses = ['Processing', 'Shipped', 'Delivered', 'Canceled'];
    const orderIndex = orders.findIndex(o => o.id === orderId);
    if (orderIndex !== -1) {
        let currentStatus = orders[orderIndex].status;
        let nextIndex = (statuses.indexOf(currentStatus) + 1) % statuses.length;
        orders[orderIndex].status = statuses[nextIndex];
        renderOrders();
    }
}

function editOrder(orderId) {
    const order = orders.find(o => o.id === orderId);
    if (!order) return;

    editingOrderId = orderId;

    // Fill form
    document.getElementById('store-name').value = order.storeName;
    document.getElementById('inv-num-input').value = order.id;
    document.getElementById('cust-name').value = order.name;
    document.getElementById('cust-phone').value = order.phone;
    document.getElementById('cust-address').value = order.address;

    districtSelect.value = order.district;
    const event = new Event('change');
    districtSelect.dispatchEvent(event);
    thanaSelect.value = order.thana;
    thanaSelect.dispatchEvent(event);
    zoneSelect.value = order.zone;

    deliveryInput.value = order.shipping;
    discountInput.value = order.discount;
    paidInput.value = order.paid || 0;
    document.getElementById('payment-method').value = order.paymentMethod;
    document.title = 'Order Form'; // Example set
    if (document.getElementById('memo-num')) document.getElementById('memo-num').value = order.memoNum || '';
    document.getElementById('courier-service').value = order.courier;
    document.getElementById('order-date-input').value = order.date;

    // Notes
    if (document.getElementById('cust-note')) document.getElementById('cust-note').value = order.customerNote || '';
    if (document.getElementById('shop-note')) document.getElementById('shop-note').value = order.shopNote || '';

    // Reconstruct product rows
    if (productRows) {
        productRows.innerHTML = '';
        const itemsToLoad = order.items || [{ name: 'Product Name', qty: 1, price: 500, color: '', size: '', code: 'SPCL-001' }];

        itemsToLoad.forEach(item => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td><input type="text" class="table-input" value="${item.color || ''}" placeholder="Color"></td>
                <td><input type="text" class="table-input" value="${item.size || ''}" placeholder="Size"></td>
                <td><input type="text" class="table-input" value="${item.code || 'SPCL-001'}"></td>
                <td>
                    <div class="product-desc-text" style="font-size: 0.8rem; color: #64748b; line-height: 1.2;">
                        ${item.name}
                    </div>
                </td>
                <td><input type="number" class="table-input qty-input row-qty" value="${item.qty}" min="1"></td>
                <td><input type="number" class="table-input price-input row-price" value="${item.price}"></td>
                <td><button type="button" class="btn-delete-row" style="background: #fee2e2; color: #ef4444; border: none; padding: 5px; border-radius: 4px; cursor: pointer;"><i class="fas fa-trash"></i></button></td>
            `;
            productRows.appendChild(tr);

            tr.querySelector('.row-qty').addEventListener('input', updatePricing);
            tr.querySelector('.row-price').addEventListener('input', updatePricing);
            tr.querySelector('.btn-delete-row').addEventListener('click', () => {
                tr.remove();
                updatePricing();
            });
        });
    }

    updatePricing();
    const modalTitle = document.querySelector('.main-title');
    if (modalTitle) modalTitle.textContent = 'Editing: ' + order.id;
    orderModal.style.display = 'flex';
}

function renderOrders() {
    if (!ordersList) return;
    ordersList.innerHTML = '';
    
    const selectAllCheckbox = document.getElementById('select-all-checkbox');
    if (selectAllCheckbox) selectAllCheckbox.checked = false;

    const todayStr = new Date().toISOString().split('T')[0];

    const user = JSON.parse(localStorage.getItem('spcl_user'));
    const filteredOrders = orders.filter(order => {
        // Role-based visibility isolation
        if (user && user.role !== 'Admin') {
            const isOwnerOrAssignee = order.createdBy === user.username || order.assignedTo === user.username;
            // If viewing specific status sections (Processing, Pending, etc.), only show owned/assigned
            const isGlobalView = (currentFilter === 'All' || currentFilter === 'Today');
            
            // View Only Sections Restriction
            const isViewOnlySection = ['Invoiced', 'Delivered'].includes(currentFilter);
            
            if (!isGlobalView && !isOwnerOrAssignee && !isViewOnlySection) {
                return false;
            }
        }

        if (currentFilter === 'All') return true;
        if (currentFilter === 'Today') return order.date === todayStr;
        if (currentFilter === 'Processing') return order.status === 'Processing';
        if (currentFilter === 'Pending') return order.status === 'Pending';
        if (currentFilter === 'Hold') return order.status === 'Hold';
        if (currentFilter === 'Complete') return order.status === 'Complete';
        if (currentFilter === 'Cancelled') return order.status === 'Cancelled';
        if (currentFilter === 'Invoiced') return order.status === 'Invoiced';
        if (currentFilter === 'Delivered') {
            return ['Delivered', 'Returned', 'Delivered Successfull'].includes(order.status);
        }
        if (currentFilter === 'Active') {
            return ['Processing', 'Pending', 'Hold'].includes(order.status);
        }
        return true;
    }).filter(order => {
        // Staff filter - only shows if staff is marked as online
        const staffFilter = document.getElementById('staff-order-filter');
        const selectedStaff = staffFilter ? staffFilter.value : '';
        if (selectedStaff) {
            return order.assignedTo === selectedStaff || order.createdBy === selectedStaff;
        }
        return true;
    }).filter(order => {
        // Apply Search Filter
        const searchInput = document.getElementById('order-search-input');
        const query = searchInput ? searchInput.value.toLowerCase().trim() : '';
        if (!query) return true;

        return (
            order.id.toLowerCase().includes(query) ||
            order.phone.toLowerCase().includes(query)
        );
    });

    const isViewOnlyForStaff = user && user.role !== 'Admin' && ['All', 'Invoiced', 'Delivered'].includes(currentFilter);

    // Update Bulk Action Button Visibility
    const bulkDeliverBtn = document.getElementById('bulk-deliver-btn');
    if (bulkDeliverBtn) {
        bulkDeliverBtn.style.display = (currentFilter === 'Invoiced' && !isViewOnlyForStaff) ? 'inline-flex' : 'none';
    }

    // Calculate Totals for Footer
    let totalTableAmount = 0;
    const totalTableCount = filteredOrders.length;

    filteredOrders.forEach(order => {
        totalTableAmount += order.total;
        const tr = document.createElement('tr');
        const statusClass = `status-${order.status.toLowerCase().replace(' ', '-')}`;

        let actionOptions = `
            <option value="Processing">Processing</option>
            <option value="Complete">Complete</option>
            <option value="Hold">Hold</option>
            <option value="Pending">Pending</option>
            <option value="Cancelled">Cancelled</option>
        `;

        if (order.status === 'Complete') {
            actionOptions = `
                <option value="Invoiced">Invoiced</option>
                <option value="Cancelled">Cancelled</option>
                <option value="Processing">Processing</option>
            `;
        } else if (['Delivered', 'Returned', 'Delivered Successfull'].includes(order.status)) {
            actionOptions = `
                <option value="Returned">Returned</option>
                <option value="Delivered Successfull">Delivered Successfull</option>
            `;
        }

        tr.innerHTML = `
            <td><input type="checkbox" class="order-checkbox" data-id="${order.id}"></td>
            <td>
                <div class="order-id-link">${order.id}</div>
                <div class="secondary-text">${order.time || 'System'}</div>
            </td>
            <td>
                <div class="customer-name">${order.name}</div>
                <div class="secondary-text">${order.phone}</div>
                <div class="secondary-text">${order.address}</div>
                ${order.shopNote ? `<div class="shop-note-alert">Shop Note: ${order.shopNote}</div>` : ''}
            </td>
            <td>
                <div style="font-weight: 600; font-size: 0.85rem; color: #1e293b; line-height: 1.4;">
                    ${(() => {
                const items = getOrderItems(order);
                const firstTwo = items.slice(0, 2).map(i => i.name).join(', ');
                if (items.length > 2) {
                    return `${firstTwo} <span style="display: inline-block; padding: 2px 6px; background: #e0f2fe; color: #0369a1; border-radius: 4px; font-size: 0.75rem; margin-top: 4px;">+ ${items.length - 2} more</span>`;
                }
                return firstTwo;
            })()}
                </div>
                <div class="secondary-text">${getOrderItems(order).length} items</div>
            </td>
            <td class="price-text">৳ ${order.total.toFixed(2)}</td>
            <td>
                <div style="font-weight: 500;">${order.courier}</div>
            </td>
            <td class="secondary-text" style="font-size: 0.8rem;">${order.date}</td>
            <td>
                <div class="status-action-container">
                    <div class="status-badge ${statusClass} ${isViewOnlyForStaff ? '' : 'interactive'}">
                        ${order.status}
                        ${isViewOnlyForStaff ? '' : '<i class="fas fa-chevron-down"></i>'}
                    </div>
                    ${isViewOnlyForStaff ? '' : `
                    <select class="status-select-hidden" onchange="updateOrderStatus('${order.id}', this.value)">
                        <option value="" disabled selected>Update Status</option>
                        ${actionOptions}
                    </select>
                    `}
                </div>
            </td>
            <td>
                <div style="display: flex; gap: 8px; justify-content: center; align-items: center;">
                    <button class="btn-history-check" onclick="showOrderHistory('${order.id}')" title="View History">
                        <i class="fas fa-history"></i>
                    </button>
                    ${isViewOnlyForStaff ? '' : `
                    <button class="btn-history-check" style="background: #ecfdf5; color: #059669;" onclick="editOrder('${order.id}')" title="Edit Order">
                        <i class="fas fa-edit"></i>
                    </button>
                    `}
                </div>
            </td>
            <td>
                <div style="font-weight: 600; font-size: 0.8rem; color: #64748b; line-height: 1.2;">
                    ${(() => {
                        if (order.assignedBy && order.assignedToName) {
                            return `<span style="color: #4f46e5;">${order.assignedBy} assigned for you</span><br><span style="color: #1e293b;">(${order.assignedToName})</span>`;
                        }
                        return order.createdBy === 'TAMIM@SHOP' ? 'Tamim' : (order.createdBy || 'System');
                    })()}
                </div>
            </td>
        `;
        ordersList.appendChild(tr);
    });

    // Update Footer Values (IDs matched with index.html)
    const footerCount = document.getElementById('filtered-count');
    const footerAmount = document.getElementById('filtered-total-amount');
    if (footerCount) footerCount.textContent = totalTableCount;
    if (footerAmount) footerAmount.textContent = totalTableAmount.toFixed(2);
}

function updateOrderStatus(id, status) {
    if (status === 'Invoiced') {
        window.pendingInvoiceId = id;
        const confirmModal = document.getElementById('confirm-invoiced-modal');
        if (confirmModal) confirmModal.style.display = 'flex';
        return;
    }

    const idx = orders.findIndex(o => o.id === id);
        if (idx !== -1) {
            const oldStatus = orders[idx].status;
            orders[idx].status = status;
            
            // Add to history
            if (!orders[idx].history) orders[idx].history = [];
            const user = JSON.parse(localStorage.getItem('spcl_user'));
            orders[idx].history.push({
                time: new Date().toLocaleString(),
                action: `Status changed: ${oldStatus} -> ${status}`,
                note: orders[idx].shopNote || '',
                user: user ? user.name : 'System'
            });

            localStorage.setItem('spcl_orders', JSON.stringify(orders));
        updateDashboardStats();
        renderOrders();
    }
}

window.updateOrderStatus = updateOrderStatus;

// Attach these to window so they work with inline onclick
window.cycleStatus = cycleStatus;
window.editOrder = editOrder;
window.deleteOrder = (id) => {
    if (confirm('Are you sure you want to delete this order?')) {
        orders = orders.filter(o => o.id !== id);
        localStorage.setItem('spcl_orders', JSON.stringify(orders));
        updateDashboardStats();
        renderOrders();
    }
};

function updatePricing() {
    if (!subtotalInput || !totalInput || !productRows) return;

    let subtotal = 0;
    const qtyInputs = productRows.querySelectorAll('.row-qty');
    const priceInputs = productRows.querySelectorAll('.row-price');

    qtyInputs.forEach((qi, idx) => {
        const q = parseInt(qi.value) || 0;
        const p = parseFloat(priceInputs[idx].value) || 0;
        subtotal += (q * p);
    });

    const delivery = parseFloat(deliveryInput.value) || 0;
    const discount = parseFloat(discountInput.value) || 0;
    const paid = parseFloat(paidInput.value) || 0;
    const total = subtotal + delivery - discount - paid;

    subtotalInput.value = subtotal.toFixed(2);
    totalInput.value = total.toFixed(2);
}

function setupEventListeners() {
    // Modal Open
    if (addOrderBtn && orderModal) {
        addOrderBtn.addEventListener('click', () => {
            editingOrderId = null;
            orderForm.reset();
            const modalTitle = document.querySelector('.main-title');
            if (modalTitle) modalTitle.textContent = 'Create Order';

            // Random ID
            document.getElementById('inv-num-input').value = 'TR' + Math.floor(1000000 + Math.random() * 9000000);

            orderModal.style.display = 'flex';
            // Set current date
            const dateInput = document.getElementById('order-date-input');
            if (dateInput) dateInput.value = new Date().toISOString().split('T')[0];

            // Clear static rows
            productRows.innerHTML = '';
            // Clear search input
            const prodInput = document.getElementById('prod-name-input');
            if (prodInput) prodInput.value = '';

            updatePricing();
        });
    }

    const closeHistoryModal = document.getElementById('close-history-modal');
    if (closeHistoryModal) {
        closeHistoryModal.addEventListener('click', () => {
            document.getElementById('history-modal').style.display = 'none';
        });
    }

    // Product name select sync with desc display (first row)

    // Staff Filter Listener
    const staffOrderFilter = document.getElementById('staff-order-filter');
    if (staffOrderFilter) {
        staffOrderFilter.addEventListener('change', renderOrders);
    }

    // Search Input listeners
    const orderSearch = document.getElementById('order-search-input');
    if (orderSearch) {
        orderSearch.addEventListener('input', renderOrders);
    }

    const complainListSearch = document.getElementById('complain-list-search');
    if (complainListSearch) {
        complainListSearch.addEventListener('input', renderComplains);
    }
    
    const prodInput = document.getElementById('prod-name-input');
    if (prodInput) {
        prodInput.addEventListener('input', (e) => {
            populateProducts(e.target.value);
        });
    }

    // Add Row logic
    const addRowBtn = document.getElementById('add-item-row-btn');
    if (addRowBtn && productRows) {
        addRowBtn.addEventListener('click', () => {
            const prodInput = document.getElementById('prod-name-input');
            const selectedProd = prodInput ? prodInput.value.trim() : '';

            if (!selectedProd) {
                alert('Please select or type a product name first.');
                return;
            }

            const prodInfo = productData[selectedProd] || { price: 0, code: 'NEW-000' };

            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td><input type="text" class="table-input" placeholder=""></td>
                <td><input type="text" class="table-input" placeholder=""></td>
                <td><input type="text" class="table-input" value="${prodInfo.code}"></td>
                <td>
                    <div class="product-desc-text">
                        ${selectedProd}
                    </div>
                </td>
                <td><input type="number" class="table-input qty-input row-qty" value="1" min="1"></td>
                <td><input type="number" class="table-input price-input row-price" value="${prodInfo.price}"></td>
                <td><button type="button" class="btn-delete-row"><i class="fas fa-trash"></i></button></td>
            `;
            productRows.appendChild(tr);

            // Clear input after adding
            if (prodInput) prodInput.value = '';

            // Listeners
            tr.querySelector('.row-qty').addEventListener('input', updatePricing);
            tr.querySelector('.row-price').addEventListener('input', updatePricing);
            tr.querySelector('.btn-delete-row').addEventListener('click', () => {
                tr.remove();
                updatePricing();
            });

            updatePricing();
        });
    }

    // Modal Close
    if (closeModal) {
        closeModal.addEventListener('click', () => {
            orderModal.style.display = 'none';
        });
    }

    if (closeInvoice) {
        closeInvoice.addEventListener('click', () => {
            invoiceModal.style.display = 'none';
        });
    }

    // Profile Dropdown Toggle
    const profileTrigger = document.getElementById('user-profile-trigger');
    const profileDropdown = document.querySelector('.profile-dropdown');
    if (profileTrigger && profileDropdown) {
        profileTrigger.addEventListener('click', (e) => {
            e.stopPropagation();
            profileDropdown.classList.toggle('show');
        });

        window.addEventListener('click', () => {
            profileDropdown.classList.remove('show');
        });
    }

    window.addEventListener('click', (e) => {
        if (e.target === orderModal) orderModal.style.display = 'none';
        if (e.target === invoiceModal) invoiceModal.style.display = 'none';
        if (e.target === document.getElementById('confirm-invoiced-modal')) {
            document.getElementById('confirm-invoiced-modal').style.display = 'none';
        }
    });

    // Search Input Event
    const searchInput = document.getElementById('order-search-input');
    if (searchInput) {
        searchInput.addEventListener('input', () => {
            renderOrders();
        });
    }

    // Confirmation Modal Events
    const btnSentParcel = document.getElementById('btn-confirm-sent-parcel');
    const btnCloseConfirm = document.getElementById('btn-close-confirm');
    const confirmModal = document.getElementById('confirm-invoiced-modal');

    if (btnSentParcel) {
        btnSentParcel.addEventListener('click', () => {
            if (window.pendingInvoiceId) {
                const idx = orders.findIndex(o => o.id === window.pendingInvoiceId);
                if (idx !== -1) {
                    orders[idx].status = 'Invoiced';
                    localStorage.setItem('spcl_orders', JSON.stringify(orders));
                    updateDashboardStats();
                    renderOrders();

                    // Show Invoiced view automatically
                    currentFilter = 'Invoiced';
                    const pageTitle = document.getElementById('page-title');
                    if (pageTitle) pageTitle.textContent = 'Invoiced Orders';
                    renderOrders();
                }
                confirmModal.style.display = 'none';
                window.pendingInvoiceId = null;
            }
        });
    }

    if (btnCloseConfirm) {
        btnCloseConfirm.addEventListener('click', () => {
            confirmModal.style.display = 'none';
            window.pendingInvoiceId = null;
        });
    }

    // Select All Checkbox Event
    const selectAllCheckbox = document.getElementById('select-all-checkbox');
    if (selectAllCheckbox) {
        selectAllCheckbox.addEventListener('change', (e) => {
            const checkboxes = document.querySelectorAll('.order-checkbox');
            checkboxes.forEach(cb => {
                cb.checked = e.target.checked;
            });
        });
    }

    // Bulk Deliver Button Event
    const bulkDeliverBtn = document.getElementById('bulk-deliver-btn');
    if (bulkDeliverBtn) {
        bulkDeliverBtn.addEventListener('click', () => {
            const selectedCheckboxes = document.querySelectorAll('.order-checkbox:checked');
            if (selectedCheckboxes.length === 0) {
                alert('Please select at least one order.');
                return;
            }

            if (confirm(`Move ${selectedCheckboxes.length} orders to Delivered?`)) {
                selectedCheckboxes.forEach(cb => {
                    const id = cb.getAttribute('data-id');
                    const idx = orders.findIndex(o => o.id === id);
                    if (idx !== -1) {
                        orders[idx].status = 'Delivered';
                    }
                });

                localStorage.setItem('spcl_orders', JSON.stringify(orders));
                updateDashboardStats();

                // Switch to Delivered view
                currentFilter = 'Delivered';
                const pageTitle = document.getElementById('page-title');
                if (pageTitle) pageTitle.textContent = 'Delivered Orders';
                renderOrders();
            }
        });
    }

    // Dashboard Stat Card Filtering
    const statCards = {
        'card-all': 'All',
        'card-today': 'Today',
        'card-processing': 'Processing',
        'card-pending': 'Pending',
        'card-hold': 'Hold',
        'card-completed': 'Complete',
        'card-canceled': 'Cancelled'
    };

    Object.keys(statCards).forEach(id => {
        const card = document.getElementById(id);
        if (card) {
            card.addEventListener('click', () => {
                // Update filter
                currentFilter = statCards[id];

                // UI feedback: remove active class from all, add to clicked
                Object.keys(statCards).forEach(cId => {
                    const c = document.getElementById(cId);
                    if (c) c.classList.remove('active-filter');
                });
                card.classList.add('active-filter');

                // Update Table
                renderOrders();

                // Change page title to reflect filter
                const pageTitle = document.getElementById('page-title');
                if (pageTitle) pageTitle.textContent = currentFilter + ' Orders';
            });
        }
    });

    // Sidebar Navigation
    sidebarItems.forEach(item => {
        item.addEventListener('click', () => {
            const user = JSON.parse(localStorage.getItem('spcl_user'));
            if (item.classList.contains('isAdmin') && user?.role !== 'Admin') return;

            sidebarItems.forEach(i => i.classList.remove('active'));
            item.classList.add('active');
            
            const target = item.getAttribute('data-target');
            const pageTitle = document.getElementById('page-title');
            
            // Hide all views
            const views = ['dashboard-view', 'complain-view', 'activities-view', 'staff-section-view', 'order-summary-view'];
            views.forEach(v => {
                const el = document.getElementById(v);
                if (el) el.style.display = 'none';
            });

            if (target && pageTitle) {
                pageTitle.textContent = target.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');

                if (target === 'order-summary') {
                    document.getElementById('order-summary-view').style.display = 'block';
                    renderOrderSummary();
                } else if (target === 'activities') {
                    document.getElementById('activities-view').style.display = 'block';
                    renderActivities();
                } else if (target === 'staff-section') {
                    document.getElementById('staff-section-view').style.display = 'block';
                    renderStaffList();
                } else if (target === 'complain-box') {
                    document.getElementById('complain-view').style.display = 'block';
                    renderComplains();
                } else {
                    document.getElementById('dashboard-view').style.display = 'block';
                    // Filter logic
                    if (target === 'invoiced') {
                        currentFilter = 'Invoiced';
                    } else if (target === 'delivered') {
                        currentFilter = 'Delivered';
                    } else if (target === 'orders') {
                        currentFilter = 'Active';
                        pageTitle.textContent = 'Active Orders';
                    } else if (target === 'dashboard') {
                        currentFilter = 'All';
                    }
                    renderOrders();
                }
            }
        });
    });

    // District -> Thana
    if (districtSelect && thanaSelect) {
        districtSelect.addEventListener('change', () => {
            const district = districtSelect.value;
            thanaSelect.innerHTML = '<option value="">Select Thana</option>';
            if (zoneSelect) zoneSelect.innerHTML = '<option value="">Select Area</option>';

            if (district && locations[district]) {
                Object.keys(locations[district]).forEach(thana => {
                    const option = document.createElement('option');
                    option.value = thana;
                    option.textContent = thana;
                    thanaSelect.appendChild(option);
                });
            }
        });
    }

    // Thana -> Area
    if (thanaSelect && zoneSelect) {
        thanaSelect.addEventListener('change', () => {
            const district = districtSelect.value;
            const thana = thanaSelect.value;
            zoneSelect.innerHTML = '<option value="">Select Area</option>';

            if (district && thana && locations[district][thana]) {
                locations[district][thana].forEach(area => {
                    const option = document.createElement('option');
                    option.value = area;
                    option.textContent = area;
                    zoneSelect.appendChild(option);
                });
            }
        });
    }

    // Pricing Inputs
    [deliveryInput, discountInput, paidInput].forEach(el => {
        if (el) el.addEventListener('input', updatePricing);
    });

    orderForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const user = JSON.parse(localStorage.getItem('spcl_user'));

        const itemsRows = productRows.querySelectorAll('tr');
        const items = Array.from(itemsRows).map(row => ({
            name: row.querySelector('.product-desc-text').textContent.trim(),
            color: row.querySelector('td:nth-child(1) input').value,
            size: row.querySelector('td:nth-child(2) input').value,
            code: row.querySelector('td:nth-child(3) input').value,
            qty: parseInt(row.querySelector('.row-qty').value) || 0,
            price: parseFloat(row.querySelector('.row-price').value) || 0
        }));

        const now = new Date();
        const currentTime = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });

        const orderData = {
            storeName: document.getElementById('store-name').value,
            id: document.getElementById('inv-num-input').value,
            time: editingOrderId ? orders.find(o => o.id === editingOrderId).time : currentTime,
            name: document.getElementById('cust-name').value,
            phone: document.getElementById('cust-phone').value,
            address: document.getElementById('cust-address').value,
            district: districtSelect.value,
            thana: thanaSelect.value,
            zone: zoneSelect.value,
            items: items,
            total: parseFloat(totalInput.value),
            subtotal: parseFloat(subtotalInput.value),
            shipping: parseFloat(deliveryInput.value),
            discount: parseFloat(discountInput.value),
            paid: parseFloat(paidInput.value) || 0,
            paymentMethod: document.getElementById('payment-method').value,
            memoNum: document.getElementById('memo-num').value,
            courier: document.getElementById('courier-service').value,
            date: document.getElementById('order-date-input').value,
            customerNote: document.getElementById('cust-note').value,
            shopNote: document.getElementById('shop-note').value,
            status: editingOrderId ? orders.find(o => o.id === editingOrderId).status : 'Processing',
            createdBy: editingOrderId ? (orders.find(o => o.id === editingOrderId).createdBy || 'System') : (user ? user.username : 'System'),
            assignedTo: editingOrderId ? (orders.find(o => o.id === editingOrderId).assignedTo || '') : ''
        };

        if (editingOrderId) {
            const index = orders.findIndex(o => o.id === editingOrderId);
            const oldOrder = orders[index];
            orders[index] = orderData;
            
            // History for update
            if (!orders[index].history) orders[index].history = oldOrder.history || [];
            orders[index].history.push({
                time: new Date().toLocaleString(),
                action: 'Order details updated',
                note: orderData.shopNote || '',
                user: user ? user.name : 'System'
            });
        } else {
            // New order history
            orderData.history = [{
                time: new Date().toLocaleString(),
                action: 'Order Created',
                note: orderData.shopNote || '',
                user: user ? user.name : 'System'
            }];
            orders.unshift(orderData);
        }

        localStorage.setItem('spcl_orders', JSON.stringify(orders));
        updateDashboardStats();
        renderOrders();
        updateNoteSuggestions();
        orderModal.style.display = 'none';
        if (!editingOrderId) {
            showInvoice(orderData);
            // Suggest printing after the invoice modal is clearly visible
            setTimeout(() => {
                if (confirm('Order confirmed and saved! Would you like to print the invoice now?')) {
                    window.print();
                }
            }, 800);
        } else {
            alert('Order updated successfully!');
        }

        orderForm.reset();
        editingOrderId = null;
    });
}

function showInvoice(order) {
    if (!invoiceModal) return;

    // Brand & Meta
    document.getElementById('inv-store-name').textContent = order.storeName;
    document.getElementById('inv-id').textContent = '#' + order.id;
    document.getElementById('inv-date').textContent = order.date;

    // Info Cards
    document.getElementById('inv-cust-name').textContent = order.name;
    document.getElementById('inv-cust-phone').textContent = order.phone;
    document.getElementById('inv-cust-addr').textContent = `${order.address}, ${order.thana}, ${order.district}`;
    document.getElementById('inv-payment').textContent = order.paymentMethod;
    document.getElementById('inv-courier').textContent = order.courier;

    // Product Table Items (Dynamic)
    const invItemsBody = document.querySelector('.premium-invoice-table tbody');
    if (invItemsBody) {
        invItemsBody.innerHTML = '';
        getOrderItems(order).forEach(item => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td style="font-weight: 600;">${item.name} <br><small style="color: #64748b;">${item.color || ''} | ${item.size || ''}</small></td>
                <td style="text-align: center;">${item.qty}</td>
                <td style="text-align: right;">৳ ${item.price.toFixed(2)}</td>
                <td style="text-align: right; font-weight: 700;">৳ ${(item.qty * item.price).toFixed(2)}</td>
            `;
            invItemsBody.appendChild(tr);
        });
    }

    // Financials
    document.getElementById('inv-subtotal').textContent = '৳ ' + (order.subtotal || 0).toFixed(2);
    document.getElementById('inv-discount').textContent = '- ৳ ' + (order.discount || 0).toFixed(2);
    document.getElementById('inv-shipping').textContent = '৳ ' + (order.shipping || 0).toFixed(2);
    if (document.getElementById('inv-paid')) {
        document.getElementById('inv-paid').textContent = '৳ ' + (order.paid || 0).toFixed(2);
    }
    document.getElementById('inv-final-total').textContent = '৳ ' + (order.total || 0).toFixed(2);

    // Notes Display in Invoice
    const notesContainer = document.getElementById('inv-notes-container');
    const custNoteText = document.getElementById('inv-cust-note-text');
    const shopNoteText = document.getElementById('inv-shop-note-text');

    if (notesContainer && (order.customerNote || order.shopNote)) {
        notesContainer.style.display = 'block';
        custNoteText.textContent = order.customerNote || 'N/A';
        shopNoteText.textContent = order.shopNote || 'N/A';

        // Hide individual rows if empty
        custNoteText.parentElement.style.display = order.customerNote ? 'block' : 'none';
        shopNoteText.parentElement.style.display = order.shopNote ? 'block' : 'none';
    } else if (notesContainer) {
        notesContainer.style.display = 'none';
    }

    invoiceModal.style.display = 'flex';
}

// --- COMPLAIN BOX LOGIC ---
const complainView = document.getElementById('complain-view');
const complainModal = document.getElementById('complain-modal');
const addComplainBtn = document.getElementById('add-complain-btn');
const closeComplainModal = document.getElementById('close-complain-modal');
const searchOrderComplainBtn = document.getElementById('search-order-complain');
const saveComplainBtn = document.getElementById('save-complain-btn');
const complainsList = document.getElementById('complains-list');

let foundOrderForComplain = null;

function renderComplains() {
    if (!complainsList) return;
    complainsList.innerHTML = '';
    const user = JSON.parse(localStorage.getItem('spcl_user'));
    const isAdmin = user && user.role === 'Admin';
    const searchQuery = document.getElementById('complain-list-search')?.value.toLowerCase() || '';

    // Admin Stats Calculation
    const staffComplainCounts = {};
    complains.forEach(c => {
        const creator = c.createdBy || 'System';
        staffComplainCounts[creator] = (staffComplainCounts[creator] || 0) + 1;
    });

    if (isAdmin) {
        if (document.getElementById('complain-admin-stats')) document.getElementById('complain-admin-stats').style.display = 'block';
        if (document.getElementById('complain-total-count')) {
            const totalBtn = document.getElementById('complain-total-count').parentElement;
            totalBtn.style.cursor = 'pointer';
            totalBtn.onclick = () => {
                complainStaffFilter = '';
                renderComplains();
            };
            document.getElementById('complain-total-count').textContent = complains.length;
        }
        const badgeContainer = document.getElementById('staff-complain-badges');
        if (badgeContainer) {
            badgeContainer.innerHTML = Object.entries(staffComplainCounts).map(([name, count]) => `
                <div class="staff-complain-badge ${complainStaffFilter === name ? 'active' : ''}" 
                     style="background: ${complainStaffFilter === name ? '#ef4444' : 'white'}; 
                            color: ${complainStaffFilter === name ? 'white' : '#1e293b'}; 
                            border: 1px solid #fee2e2; padding: 4px 12px; border-radius: 8px; font-size: 0.75rem; font-weight: 700; cursor: pointer; transition: all 0.2s;"
                     onclick="window.setComplainStaffFilter('${name}')">
                    <i class="fas fa-user-circle" style="color: ${complainStaffFilter === name ? 'white' : '#ef4444'}; margin-right: 5px;"></i> ${name}: <span>${count}</span>
                </div>
            `).join('');
        }
    }

    // Filtering logic
    const filteredComplains = complains.filter(c => {
        const matchesSearch = c.orderId.toLowerCase().includes(searchQuery) || c.customerPhone.includes(searchQuery);
        const matchesStaff = !complainStaffFilter || (c.createdBy === complainStaffFilter);
        return matchesSearch && matchesStaff;
    });

    filteredComplains.forEach((complain, index) => {
        const actualIndex = complains.findIndex(c => c === complain);

        // Permission check: Admin or Order Owner/Assignee
        const canAction = isAdmin || (user && (complain.createdBy === user.username || complain.assignedTo === user.username));
        const ownerName = complain.createdBy || 'System';

        const tr = document.createElement('tr');
        let statusClass = 'status-pending';
        if (complain.status === 'Solved') statusClass = 'status-completed';
        if (complain.status === 'Justifying') statusClass = 'status-justifying';

        tr.innerHTML = `
            <td>
                <div class="order-id-link">${complain.orderId}</div>
                <div style="font-size: 0.7rem; color: #64748b; margin-top: 5px;">Created: ${new Date().toLocaleDateString()}</div>
            </td>
            <td>
                <div class="customer-name">${complain.customerName}</div>
                <div class="secondary-text">${complain.customerPhone}</div>
                ${complain.shopNote ? `<div class="shop-note-alert" style="padding: 2px 6px; font-size: 0.65rem;">Shop Note: ${complain.shopNote}</div>` : ''}
            </td>
            <td>
                <div style="font-weight: 700; color: #1e293b; font-size: 0.85rem;">${ownerName}</div>
                <div style="font-size: 0.65rem; color: #4f46e5; text-transform: uppercase; font-weight: 800; margin-top: 3px;">Main Creator</div>
                ${complain.assignedTo ? `<div style="font-size: 0.7rem; color: #6366f1; margin-top: 5px; background: #eef2ff; padding: 2px 6px; border-radius: 4px;">Assigned to: ${complain.assignedTo}</div>` : ''}
            </td>
            <td>
                <div style="font-size: 0.85rem; color: #475569; border-left: 2px solid #ef4444; padding-left: 10px;">${complain.note}</div>
                <div style="font-size: 0.75rem; color: #b91c1c; font-weight: 800; margin-top: 8px; font-style: italic;">
                    <i class="fas fa-bullhorn"></i> Please solve this complain, ${ownerName}
                </div>
            </td>
            <td><span class="status-badge ${statusClass}">${complain.status}</span></td>
            <td>
                    <div class="action-group" style="display: flex; flex-direction: column; gap: 5px; align-items: center;">
                    ${canAction ? `
                        <button class="btn btn-primary" style="width: 100%; padding: 6px 12px; font-size: 0.7rem; justify-content: center;" onclick="updateComplainStatus(${actualIndex}, 'Solved')">
                            <i class="fas fa-check-double"></i> Solved
                        </button>
                        <button class="btn btn-orange" style="width: 100%; padding: 6px 12px; font-size: 0.7rem; background: #8b5cf6; justify-content: center;" onclick="updateComplainStatus(${actualIndex}, 'Justifying')">
                            <i class="fas fa-search-plus"></i> Justifying
                        </button>
                    ` : `
                        <span style="font-size: 0.7rem; color: #94a3b8; text-align: center; line-height: 1.2;">
                            <i class="fas fa-lock"></i> Only ${ownerName} can update status
                        </span>
                    `}
                </div>
            </td>
        `;
        complainsList.appendChild(tr);
    });
}

window.setComplainStaffFilter = function(name) {
    if (complainStaffFilter === name) {
        complainStaffFilter = ''; // Toggle off
    } else {
        complainStaffFilter = name;
    }
    renderComplains();
};

function updateComplainStatus(index, status) {
    complains[index].status = status;
    localStorage.setItem('spcl_complains', JSON.stringify(complains));
    renderComplains();
}
window.updateComplainStatus = updateComplainStatus;

// Complain Modal Logic
if (addComplainBtn) {
    addComplainBtn.addEventListener('click', () => {
        complainModal.style.display = 'flex';
        document.getElementById('complain-search-input').value = '';
        document.getElementById('complain-order-preview').style.display = 'none';
        document.getElementById('complain-note-input').value = '';
        foundOrderForComplain = null;
    });
}

if (closeComplainModal) {
    closeComplainModal.addEventListener('click', () => complainModal.style.display = 'none');
}

if (searchOrderComplainBtn) {
    searchOrderComplainBtn.addEventListener('click', () => {
        const query = document.getElementById('complain-search-input').value.trim().toLowerCase();
        if (!query) return alert('Please enter Invoice ID or Phone');

        const order = orders.find(o => o.id.toLowerCase() === query || o.phone.includes(query));
        if (order) {
            foundOrderForComplain = order;
            const preview = document.getElementById('complain-order-preview');
            const details = document.getElementById('found-order-details');
            preview.style.display = 'block';
            details.innerHTML = `
                <strong>Invoice:</strong> ${order.id}<br>
                <strong>Customer:</strong> ${order.name}<br>
                <strong>Phone:</strong> ${order.phone}<br>
                <strong>Products:</strong> ${getOrderItems(order).map(i => i.name).join(', ')}<br>
                ${order.shopNote ? `<strong style="color: #ef4444;">Shop Note:</strong> ${order.shopNote}` : ''}
            `;
        } else {
            alert('Order not found!');
        }
    });
}

if (saveComplainBtn) {
    saveComplainBtn.addEventListener('click', () => {
        if (!foundOrderForComplain) return alert('Please search and find an order first');
        const note = document.getElementById('complain-note-input').value.trim();
        if (!note) return alert('Please enter a complain note');

        const newComplain = {
            orderId: foundOrderForComplain.id,
            customerName: foundOrderForComplain.name,
            customerPhone: foundOrderForComplain.phone,
            shopNote: foundOrderForComplain.shopNote || '',
            products: getOrderItems(foundOrderForComplain).map(i => i.name).join(', '),
            note: note,
            status: 'Pending',
            createdBy: foundOrderForComplain.createdBy,
            assignedTo: foundOrderForComplain.assignedTo
        };

        complains.unshift(newComplain);
        localStorage.setItem('spcl_complains', JSON.stringify(complains));
        complainModal.style.display = 'none';
        renderComplains();
    });
}

init();

// --- AUTH & SYSTEM LOGIC ---
const REQUIRED_OTP = "16247";
let tempSignupData = null;

// UI Switchers
document.getElementById('show-signup')?.addEventListener('click', () => {
    document.getElementById('login-form').style.display = 'none';
    document.getElementById('signup-form').style.display = 'block';
});

document.getElementById('show-login')?.addEventListener('click', () => {
    document.getElementById('signup-form').style.display = 'none';
    document.getElementById('login-form').style.display = 'block';
});

// Signup Request
document.getElementById('signup-form')?.addEventListener('submit', (e) => {
    e.preventDefault();
    tempSignupData = {
        name: document.getElementById('signup-name').value.trim(),
        username: document.getElementById('signup-username').value.trim(),
        pass: document.getElementById('signup-password').value.trim(),
        role: 'Staff'
    };
    
    document.getElementById('signup-form').style.display = 'none';
    document.getElementById('otp-wrapper').style.display = 'block';
    logActivity('requested signup', tempSignupData.username);
});

// OTP Verification
document.getElementById('verify-otp-btn')?.addEventListener('click', () => {
    const digits = Array.from(document.querySelectorAll('.otp-digit')).map(i => i.value).join('');
    if (digits === REQUIRED_OTP) {
        let staff = JSON.parse(localStorage.getItem('spcl_staff_accounts')) || [];
        staff.push({
            ...tempSignupData,
            isOnline: false,
            lastActive: new Date().toLocaleDateString(),
            assignedCount: 0
        });
        localStorage.setItem('spcl_staff_accounts', JSON.stringify(staff));
        
        alert('Account activated! You can now login.');
        document.getElementById('otp-wrapper').style.display = 'none';
        document.getElementById('login-form').style.display = 'block';
        logActivity('activated account', tempSignupData.username);
    } else {
        document.getElementById('otp-error').style.display = 'block';
    }
});

// Auto-focus OTP
document.querySelectorAll('.otp-digit').forEach((input, idx) => {
    input.addEventListener('input', (e) => {
        if (e.target.value.length === 1 && idx < 4) {
            document.querySelectorAll('.otp-digit')[idx + 1].focus();
        }
    });
});

// Login Logic
document.getElementById('login-form')?.addEventListener('submit', (e) => {
    e.preventDefault();
    const user = document.getElementById('login-username').value.trim();
    const pass = document.getElementById('login-password').value.trim();

    // Default Admin
    if (user === 'TAMIM@SHOP' && pass === 'TAMIM56456') {
        const adminUser = { name: 'Tamim', username: user, role: 'Admin' };
        localStorage.setItem('spcl_user', JSON.stringify(adminUser));
        localStorage.setItem('spcl_is_logged_in', 'true');
        location.reload();
        return;
    }

    // Check Staff
    const staff = JSON.parse(localStorage.getItem('spcl_staff_accounts')) || [];
    const acc = staff.find(s => s.username === user && s.pass === pass);
    
    if (acc) {
        acc.isOnline = true;
        acc.lastActive = new Date().toLocaleString();
        localStorage.setItem('spcl_staff_accounts', JSON.stringify(staff));
        localStorage.setItem('spcl_user', JSON.stringify(acc));
        localStorage.setItem('spcl_is_logged_in', 'true');
        logActivity('logged in', '');
        location.reload();
    } else {
        document.getElementById('login-error').style.display = 'block';
    }
});

// Order Assignment Logic
const assignModal = document.getElementById('assign-modal');
const showAssignBtn = document.getElementById('assign-order-btn-trigger');
let selectedOrderIds = [];

showAssignBtn?.addEventListener('click', () => {
    const boxes = document.querySelectorAll('.order-checkbox:checked');
    if (boxes.length === 0) return alert('Select orders to assign first!');
    
    selectedOrderIds = Array.from(boxes).map(b => b.getAttribute('data-id'));
    const staff = JSON.parse(localStorage.getItem('spcl_staff_accounts')) || [];
    const onlineStaff = staff.filter(s => s.isOnline);
    
    const staffListDiv = document.getElementById('assign-staff-list');
    if (onlineStaff.length === 0) {
        staffListDiv.innerHTML = '<p style="text-align:center; padding: 1rem; color: #ef4444;">No active staff online!</p>';
    } else {
        staffListDiv.innerHTML = onlineStaff.map(s => `
            <div class="staff-assign-card" onclick="selectStaffForAssign('${s.username}', this)">
                <div class="staff-info-box">
                    <img src="https://ui-avatars.com/api/?name=${s.name}&background=4f46e5&color=fff">
                    <div class="staff-details">
                        <span class="name">${s.name}</span>
                        <span class="load">${s.assignedCount || 0} active loads</span>
                    </div>
                </div>
                <i class="fas fa-chevron-right"></i>
            </div>
        `).join('');
    }
    assignModal.style.display = 'flex';
});

let targetStaffUname = null;
window.selectStaffForAssign = function(uname, el) {
    document.querySelectorAll('.staff-assign-card').forEach(c => c.classList.remove('selected'));
    el.classList.add('selected');
    targetStaffUname = uname;
};

document.getElementById('confirm-assign-btn')?.addEventListener('click', () => {
    if (!targetStaffUname) return alert('Select a staff member!');
    
    const staff = JSON.parse(localStorage.getItem('spcl_staff_accounts')) || [];
    const targetStaff = staff.find(s => s.username === targetStaffUname);
    const displayName = targetStaff ? targetStaff.name : targetStaffUname;

    // Update orders
    selectedOrderIds.forEach(id => {
        const idx = orders.findIndex(o => o.id === id);
        if (idx !== -1) {
            const adminUser = JSON.parse(localStorage.getItem('spcl_user'));
            const oldCreator = orders[idx].createdBy;
            orders[idx].createdBy = targetStaffUname;
            orders[idx].assignedTo = targetStaffUname;
            orders[idx].assignedBy = adminUser ? adminUser.name : 'Admin';
            orders[idx].assignedToName = displayName;

            // Add history
            if (!orders[idx].history) orders[idx].history = [];
            orders[idx].history.push({
                time: new Date().toLocaleString(),
                action: `Admin Transfer: ${oldCreator} -> ${targetStaffUname}`,
                note: `Assigned to ${displayName}`,
                user: adminUser ? adminUser.name : 'Admin'
            });
        }
    });
    
    // Update staff count
    const sIdx = staff.findIndex(s => s.username === targetStaffUname);
    if (sIdx !== -1) staff[sIdx].assignedCount = (staff[sIdx].assignedCount || 0) + selectedOrderIds.length;
    
    localStorage.setItem('spcl_orders', JSON.stringify(orders));
    localStorage.setItem('spcl_staff_accounts', JSON.stringify(staff));
    
    logActivity('assigned orders', `${selectedOrderIds.length} orders -> ${targetStaffUname}`);
    alert('Orders assigned successfully!');
    assignModal.style.display = 'none';
    renderOrders();
});

document.getElementById('close-assign-modal')?.addEventListener('click', () => assignModal.style.display = 'none');

// Session Check
function renderOrderSummary() {
    const summaryProdBody = document.getElementById('summary-product-body');
    const prodValueEl = document.getElementById('summary-prod-value');
    const deliveryValueEl = document.getElementById('summary-delivery-value');
    const netTotalEl = document.getElementById('summary-net-total');
    
    if (!summaryProdBody) return;

    let totalProdValue = 0;
    let totalDelivery = 0;
    const productStats = {};

    const todayStr = new Date().toISOString().split('T')[0];

    orders.forEach(order => {
        // Only count orders from TODAY to ensure it resets after midnight
        if (order.date !== todayStr) return;
        
        // We calculate for all orders except cancelled
        if (order.status === 'Cancelled') return;

        totalDelivery += (order.shipping || 0);
        
        const items = getOrderItems(order);
        items.forEach(item => {
            const val = (item.qty || 0) * (item.price || 0);
            totalProdValue += val;

            if (!productStats[item.name]) {
                productStats[item.name] = { qty: 0, revenue: 0 };
            }
            productStats[item.name].qty += (item.qty || 0);
            productStats[item.name].revenue += val;
        });
    });

    // Update Top Cards
    if (prodValueEl) prodValueEl.textContent = '৳ ' + totalProdValue.toLocaleString();
    if (deliveryValueEl) deliveryValueEl.textContent = '৳ ' + totalDelivery.toLocaleString();
    if (netTotalEl) netTotalEl.textContent = '৳ ' + (totalProdValue + totalDelivery).toLocaleString();

    // Sort products by revenue
    const sortedProducts = Object.entries(productStats).sort((a, b) => b[1].revenue - a[1].revenue);
    const maxRevenue = sortedProducts.length > 0 ? sortedProducts[0][1].revenue : 1;

    summaryProdBody.innerHTML = sortedProducts.map(([name, stats], index) => {
        const share = ((stats.revenue / maxRevenue) * 100).toFixed(0);
        const rankClass = index < 3 ? `rank-badge-${index + 1}` : '';
        
        return `
            <tr>
                <td><div class="product-rank ${rankClass}">${index + 1}</div></td>
                <td>
                    <div style="font-weight: 700; color: #1e293b;">${name}</div>
                    <div style="font-size: 0.75rem; color: #64748b;">Premium Selection</div>
                </td>
                <td style="text-align: center;">
                    <span style="display: inline-block; padding: 4px 10px; background: #eef2ff; color: #4f46e5; border-radius: 20px; font-weight: 700;">
                        ${stats.qty} units
                    </span>
                </td>
                <td style="text-align: right; font-weight: 800; color: #1e293b;">৳ ${stats.revenue.toLocaleString()}</td>
                <td>
                    <div style="display: flex; flex-direction: column; align-items: flex-end;">
                        <span style="font-size: 0.7rem; font-weight: 700; color: #64748b;">${share}% Share</span>
                        <div class="progress-bar-mini" style="width: 100px;">
                            <div class="progress-fill" style="width: ${share}%"></div>
                        </div>
                    </div>
                </td>
            </tr>
        `;
    }).join('');
}

// Consolidate triggers and remove redundant ones
window.renderOrderSummary = renderOrderSummary;

function checkLogin() {
    // Force bypass login (Unlocked)
    document.getElementById('login-overlay').style.display = 'none';
    document.getElementById('main-app-container').style.display = 'block';
    
    // Set a dummy admin user if not exists to prevent errors
    if (!localStorage.getItem('spcl_user')) {
        localStorage.setItem('spcl_user', JSON.stringify({ name: 'Unlocked User', username: 'admin', role: 'Admin' }));
    }
}

window.logout = function() {
    const user = JSON.parse(localStorage.getItem('spcl_user'));
    if (user && user.role !== 'Admin') {
        let staff = JSON.parse(localStorage.getItem('spcl_staff_accounts')) || [];
        const acc = staff.find(s => s.username === user.username);
        if (acc) acc.isOnline = false;
        localStorage.setItem('spcl_staff_accounts', JSON.stringify(staff));
    }
    localStorage.removeItem('spcl_is_logged_in');
    localStorage.removeItem('spcl_user');
    location.reload();
};

checkLogin();
