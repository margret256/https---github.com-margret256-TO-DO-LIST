// SAFE INITIALIZATION
(function () {
  // Wrap everything so we can safely use DOMContentLoaded
  function init() {
    try {
      // Data
      window.tasks = JSON.parse(localStorage.getItem("tasks") || "[]");
      window.orders = JSON.parse(localStorage.getItem("orders") || "[]");

      // Save helpers
      window.saveTasks = function () { localStorage.setItem("tasks", JSON.stringify(window.tasks)); };
      window.saveOrders = function () { localStorage.setItem("orders", JSON.stringify(window.orders)); };

      // DOM elements (may be null if HTML changed)
      const ordersSection = document.getElementById('orders');
      const addOrderBtn = ordersSection ? ordersSection.querySelector('.add-order-form button') : null;
      const orderInput = document.getElementById('orderInput');
      const orderPrice = document.getElementById('orderPrice');
      const orderQuantity = document.getElementById('orderQuantity');

      // Attach listener to Add Order button (more robust than only inline onclick)
      if (addOrderBtn) {
        addOrderBtn.addEventListener('click', (e) => {
          e.preventDefault();
          addOrder();
        });
      } else {
        console.warn('Add Order button not found (.add-order-form button). Inline onclick will still work if present.');
      }

      // Expose showSection, logout for inline calls (if not present)
      if (!window.showSection) {
        window.showSection = function (id) {
          const sections = ['dashboard','orders','inventory','categories','settings','help'];
          sections.forEach(sec => {
            const el = document.getElementById(sec);
            if (el) el.style.display = 'none';
          });
          const target = document.getElementById(id);
          if (target) target.style.display = 'block';
        };
      }

      if (!window.logout) {
  window.logout = function () {
    // Optional: clear any session or local storage if needed
    // localStorage.clear();

    // Redirect to landing page
    window.location.href = "index.html"; // replace with your landing page filename
  };
}


      // Render initial UI
      displayTasks();
      displayOrders();
      updateDashboardCounters();

      console.log('script.js initialized successfully');
    } catch (err) {
      console.error('Initialization error in script.js:', err);
    }
  }

  // Run when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})(); // end IIFE


// TASK FUNCTIONS 
function addTask() {
  try {
    const taskInput = document.getElementById("taskInput");
    if (!taskInput) { console.error('taskInput element not found'); return; }

    let text = taskInput.value.trim();
    if (!text) {
      taskInput.classList.add("is-invalid");
      return;
    }
    taskInput.classList.remove("is-invalid");

    window.tasks.push({ text: text, done: false });
    taskInput.value = "";

    window.saveTasks();
    displayTasks();
    console.log('Task added:', text);
  } catch (err) {
    console.error('addTask error:', err);
  }
}

function toggleTaskDone(index) {
  try {
    if (!window.tasks || !window.tasks[index]) return;
    window.tasks[index].done = !window.tasks[index].done;
    window.saveTasks();
    displayTasks();
  } catch (err) {
    console.error('toggleTaskDone error:', err);
  }
}

function deleteTask(index) {
  try {
    if (!window.tasks) return;
    window.tasks.splice(index, 1);
    window.saveTasks();
    displayTasks();
  } catch (err) {
    console.error('deleteTask error:', err);
  }
}

function displayTasks() {
  try {
    const pendingList = document.getElementById("tasksList");
    const completedList = document.getElementById("completedTasksList");
    if (!pendingList || !completedList) {
      console.warn('Task lists not found (tasksList/completedTasksList)');
      return;
    }

    pendingList.innerHTML = "";
    completedList.innerHTML = "";

    (window.tasks || []).forEach((task, i) => {
      const li = document.createElement("li");
      li.className = "task-item " + (task.done ? "completed" : "");
      li.innerHTML = `
        <span>${escapeHtml(task.text)}</span>
        <span>
          <button class="complete-btn action-btn" onclick="toggleTaskDone(${i})">✔</button>
          <button class="delete-btn action-btn" onclick="deleteTask(${i})">🗑</button>
        </span>
      `;
      task.done ? completedList.appendChild(li) : pendingList.appendChild(li);
    });

    updateDashboardCounters();
  } catch (err) {
    console.error('displayTasks error:', err);
  }
}


// ORDER FUNCTIONS 
function addOrder() {
  try {
    const nameEl = document.getElementById('orderInput');
    const priceEl = document.getElementById('orderPrice');
    const qtyEl = document.getElementById('orderQuantity');

    if (!nameEl || !priceEl || !qtyEl) {
      console.error('Order inputs not found:', { nameEl, priceEl, qtyEl });
      alert('Order form elements are missing from the page. Check HTML ids: orderInput, orderPrice, orderQuantity');
      return;
    }

    const name = nameEl.value.trim();
    const price = parseFloat(priceEl.value);
    const quantity = parseInt(qtyEl.value);

    // Detailed validation with console feedback
    if (!name) {
      nameEl.classList.add('is-invalid');
      alert('Please enter order name');
      return;
    } else {
      nameEl.classList.remove('is-invalid');
    }

    if (isNaN(price) || price <= 0) {
      priceEl.classList.add('is-invalid');
      alert('Please enter a valid price greater than 0');
      return;
    } else {
      priceEl.classList.remove('is-invalid');
    }

    if (isNaN(quantity) || quantity <= 0) {
      qtyEl.classList.add('is-invalid');
      alert('Please enter a valid quantity greater than 0');
      return;
    } else {
      qtyEl.classList.remove('is-invalid');
    }

    // push and save
    window.orders.push({ text: name, price: price, quantity: quantity, done: false });
    window.saveOrders();

    // clear fields
    nameEl.value = '';
    priceEl.value = '';
    qtyEl.value = '';

    // re-render
    displayOrders();
    updateDashboardCounters();

    console.log('Order added:', { name, price, quantity });
  } catch (err) {
    console.error('addOrder error:', err);
  }
}

function toggleOrderDone(index) {
  try {
    if (!window.orders || !window.orders[index]) return;
    window.orders[index].done = !window.orders[index].done;
    window.saveOrders();
    displayOrders();
  } catch (err) {
    console.error('toggleOrderDone error:', err);
  }
}

function editOrder(index) {
  try {
    if (!window.orders || !window.orders[index]) return;
    let o = window.orders[index];

    let newName = prompt("Edit order name", o.text);
    let newPrice = parseFloat(prompt("Edit price", o.price));
    let newQuantity = parseInt(prompt("Edit quantity", o.quantity));

    if (!newName || isNaN(newPrice) || isNaN(newQuantity) || newPrice <= 0 || newQuantity <= 0) {
      alert('Invalid edit values. Edit cancelled.');
      return;
    }

    window.orders[index] = { text: newName, price: newPrice, quantity: newQuantity, done: o.done };
    window.saveOrders();
    displayOrders();
  } catch (err) {
    console.error('editOrder error:', err);
  }
}

function deleteOrder(index) {
  try {
    if (!window.orders) return;
    window.orders.splice(index, 1);
    window.saveOrders();
    displayOrders();
    updateDashboardCounters();
  } catch (err) {
    console.error('deleteOrder error:', err);
  }
}

function displayOrders() {
  try {
    const pendingList = document.getElementById('ordersList');
    const completedList = document.getElementById('completedOrdersList');

    if (!pendingList || !completedList) {
      console.warn('Order lists not found (ordersList/completedOrdersList)');
      return;
    }

    pendingList.innerHTML = '';
    completedList.innerHTML = '';

    (window.orders || []).forEach((o, i) => {
      const li = document.createElement('li');
      li.className = o.done ? 'completed-order' : '';

      // Use buttons with clear classes (these CSS classes are defined in your CSS)
      li.innerHTML = `
        <div style="flex:1">
          <strong>${escapeHtml(o.text)}</strong> — $${Number(o.price).toFixed(2)} x ${o.quantity}
        </div>
        <div>
          <button class="complete-btn action-btn" onclick="toggleOrderDone(${i})">✔</button>
          <button class="edit-btn action-btn" onclick="editOrder(${i})">✎</button>
          <button class="delete-btn action-btn" onclick="deleteOrder(${i})">🗑</button>
        </div>
      `;

      o.done ? completedList.appendChild(li) : pendingList.appendChild(li);
    });

    updateDashboardCounters();
  } catch (err) {
    console.error('displayOrders error:', err);
  }
}


// DASHBOARD COUNTERS
function updateDashboardCounters() {
  try {
    const totalTasks = (window.tasks || []).length;
    const completedTasks = (window.tasks || []).filter(t => t.done).length;
    const pendingTasks = totalTasks - completedTasks;

    const totalOrders = (window.orders || []).length;
    const completedOrders = (window.orders || []).filter(o => o.done).length;
    const pendingOrders = totalOrders - completedOrders;

    setText('tasksTotal', totalTasks);
    setText('tasksCompleted', completedTasks);
    setText('tasksPending', pendingTasks);

    setText('ordersTotal', totalOrders);
    setText('ordersCompleted', completedOrders);
    setText('ordersPending', pendingOrders);

    // section counts (if present)
    setText('sectionOrdersTotal', totalOrders);
    setText('sectionOrdersCompleted', completedOrders);
    setText('sectionOrdersPending', pendingOrders);
  } catch (err) {
    console.error('updateDashboardCounters error:', err);
  }
}

function setText(id, value) {
  const el = document.getElementById(id);
  if (el) el.textContent = value;
}

// UTIL 
function escapeHtml(unsafe) {
  return String(unsafe)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}


// ================= INVENTORY FUNCTIONS =================

// Display inventory dynamically
function displayInventory() {
  try {
    const tableBody = document.querySelector('#inventoryTable tbody');
    if (!tableBody) return;

    tableBody.innerHTML = ''; // clear previous rows

    (window.orders || []).forEach((item, index) => {
      const totalValue = (item.price * item.quantity).toFixed(2);

      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td contenteditable="true" onblur="updateInventoryItem(${index}, 'text', this.textContent)">${escapeHtml(item.text)}</td>
        <td contenteditable="true" onblur="updateInventoryItem(${index}, 'price', this.textContent)">$${Number(item.price).toFixed(2)}</td>
        <td contenteditable="true" onblur="updateInventoryItem(${index}, 'quantity', this.textContent)">${item.quantity}</td>
        <td>$${totalValue}</td>
        <td>
          <button class="delete-btn action-btn" onclick="deleteInventoryItem(${index})">🗑 Delete</button>
        </td>
      `;
      tableBody.appendChild(tr);
    });
  } catch (err) {
    console.error('displayInventory error:', err);
  }
}

// Update inventory item after inline edit
function updateInventoryItem(index, field, value) {
  try {
    if (!window.orders || !window.orders[index]) return;

    if (field === 'text') {
      window.orders[index].text = value.trim();
    } else if (field === 'price') {
      let num = parseFloat(value.replace('$',''));
      if (!isNaN(num) && num > 0) window.orders[index].price = num;
    } else if (field === 'quantity') {
      let num = parseInt(value);
      if (!isNaN(num) && num >= 0) window.orders[index].quantity = num;
    }

    window.saveOrders();
    displayOrders();       // update Orders section
    displayInventory();    // refresh Inventory table
    updateDashboardCounters();
  } catch (err) {
    console.error('updateInventoryItem error:', err);
  }
}

// Delete inventory item
function deleteInventoryItem(index) {
  try {
    if (!window.orders || !window.orders[index]) return;
    window.orders.splice(index, 1);
    window.saveOrders();
    displayOrders();
    displayInventory();
    updateDashboardCounters();
  } catch (err) {
    console.error('deleteInventoryItem error:', err);
  }
}

// Ensure inventory displays on initialization
document.addEventListener('DOMContentLoaded', () => {
  displayInventory();
});
