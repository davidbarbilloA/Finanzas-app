// --- 1. CONFIGURACIÓN Y ESTADO INICIAL ---
const DB_KEY_USERS = 'finpro_users';
const DB_KEY_MOVES = 'finpro_moves';
const DB_KEY_SESSION = 'finpro_session';

let currentUser = null;
let userChart = null;
let adminChart = null;

// Modales via Bootstrap API
let moveModal, budgetModal, categoryModal;

// --- 2. INICIALIZACIÓN (SEED) ---
function initDB() {
    if (!localStorage.getItem(DB_KEY_USERS)) {
        const users = [
            { id: 1, name: 'Admin Financiero', user: 'admin', pass: '123', role: 'admin', budget: 0, categories: [] },
            { 
                id: 2, name: 'Usuario Demo', user: 'demo', pass: '123', role: 'user', 
                budget: 2500, 
                categories: ['Comida', 'Transporte', 'Renta', 'Sueldo', 'Varios'] 
            }
        ];
        localStorage.setItem(DB_KEY_USERS, JSON.stringify(users));
    }
    if (!localStorage.getItem(DB_KEY_MOVES)) {
        const moves = [
            { id: 1, userId: 2, type: 'income', amount: 3000, category: 'Sueldo', desc: 'Pago nómina febrero', date: new Date().toISOString() },
            { id: 2, userId: 2, type: 'expense', amount: 800, category: 'Renta', desc: 'Apartamento', date: new Date().toISOString() },
            { id: 3, userId: 2, type: 'expense', amount: 200, category: 'Comida', desc: 'Supermercado', date: new Date().toISOString() }
        ];
        localStorage.setItem(DB_KEY_MOVES, JSON.stringify(moves));
    }
}

// --- 3. HELPERS DE PERSISTENCIA ---
const getLS = (k) => JSON.parse(localStorage.getItem(k) || '[]');
const setLS = (k, v) => localStorage.setItem(k, JSON.stringify(v));
const formatMoney = (val) => new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(val);

const showAlert = (msg, type = 'success') => {
    const el = document.getElementById('alert-box');
    el.className = `alert alert-${type} active-view`;
    el.innerHTML = `<i class="bi bi-${type === 'success' ? 'check-circle' : 'exclamation-triangle'} me-2"></i> ${msg}`;
    el.classList.remove('d-none');
    setTimeout(() => {
        el.classList.add('d-none');
        el.classList.remove('active-view');
    }, 4000);
};

// --- 4. AUTENTICACIÓN ---
function switchAuth(type) {
    const loginForm = document.getElementById('form-login');
    const registerForm = document.getElementById('form-register');
    const links = document.querySelectorAll('#pills-tab .nav-link');

    if (type === 'login') {
        loginForm.classList.remove('d-none');
        registerForm.classList.add('d-none');
        links[0].classList.add('active');
        links[1].classList.remove('active');
    } else {
        loginForm.classList.add('d-none');
        registerForm.classList.remove('d-none');
        links[0].classList.remove('active');
        links[1].classList.add('active');
    }
}

document.getElementById('form-login').addEventListener('submit', (e) => {
    e.preventDefault();
    const u = document.getElementById('login-user').value;
    const p = document.getElementById('login-pass').value;
    const users = getLS(DB_KEY_USERS);
    const found = users.find(x => x.user === u && x.pass === p);

    if (found) {
        sessionStorage.setItem(DB_KEY_SESSION, JSON.stringify(found));
        currentUser = found;
        showAlert(`Bienvenido, ${found.name}`);
        updateUI();
    } else {
        showAlert('Usuario o contraseña incorrectos', 'danger');
    }
});

document.getElementById('form-register').addEventListener('submit', (e) => {
    e.preventDefault();
    const users = getLS(DB_KEY_USERS);
    const user = document.getElementById('reg-user').value;
    
    if (users.find(x => x.user === user)) return showAlert('El usuario ya existe', 'danger');

    const newUser = {
        id: Date.now(),
        name: document.getElementById('reg-name').value,
        user: user,
        pass: document.getElementById('reg-pass').value,
        budget: parseFloat(document.getElementById('reg-budget').value),
        role: 'user',
        categories: ['Varios', 'Comida', 'Transporte', 'Salud', 'Sueldo']
    };

    users.push(newUser);
    setLS(DB_KEY_USERS, users);
    showAlert('Cuenta creada exitosamente. Ahora puedes ingresar.');
    switchAuth('login');
    e.target.reset();
});

function logout() {
    sessionStorage.removeItem(DB_KEY_SESSION);
    currentUser = null;
    location.reload();
}

// --- 5. LÓGICA DE UI CENTRAL ---
function updateUI() {
    const authView = document.getElementById('view-auth');
    const userView = document.getElementById('view-user');
    const adminView = document.getElementById('view-admin');
    const navContent = document.getElementById('nav-content');

    // Reset views
    [authView, userView, adminView].forEach(v => v.classList.remove('active-view'));

    if (!currentUser) {
        authView.classList.add('active-view');
        navContent.innerHTML = '';
    } else {
        navContent.innerHTML = `
            <li class="nav-item">
                <span class="nav-link text-dark fw-semibold me-3">
                    <i class="bi bi-person-circle me-1"></i> ${currentUser.name}
                    <span class="badge ${currentUser.role === 'admin' ? 'bg-danger' : 'bg-primary'} ms-1">${currentUser.role}</span>
                </span>
            </li>
            <li class="nav-item">
                <button class="btn btn-outline-danger btn-sm rounded-pill px-4" onclick="logout()">
                    Cerrar Sesión <i class="bi bi-box-arrow-right ms-1"></i>
                </button>
            </li>
        `;

        if (currentUser.role === 'admin') {
            adminView.classList.add('active-view');
            renderAdminDashboard();
        } else {
            userView.classList.add('active-view');
            renderUserDashboard();
        }
    }
}

// --- 6. DASHBOARD USUARIO ---
function renderUserDashboard() {
    const allMoves = getLS(DB_KEY_MOVES);
    const myMoves = allMoves.filter(m => m.userId === currentUser.id);
    const filter = document.getElementById('filter-cat').value;
    
    // Cálculos
    const displayMoves = filter === 'all' ? myMoves : myMoves.filter(m => m.category === filter);
    const totalIncome = myMoves.filter(m => m.type === 'income').reduce((s, m) => s + m.amount, 0);
    const totalExpense = myMoves.filter(m => m.type === 'expense').reduce((s, m) => s + m.amount, 0);
    const balance = totalIncome - totalExpense;

    // Actualizar Cards
    document.getElementById('u-balance').innerText = formatMoney(balance);
    document.getElementById('u-income').innerText = formatMoney(totalIncome);
    document.getElementById('u-expense').innerText = formatMoney(totalExpense);

    // Presupuesto
    const budget = currentUser.budget || 0;
    const budgetPercent = budget > 0 ? (totalExpense / budget) * 100 : 0;
    const budgetBar = document.getElementById('budget-bar');
    const budgetText = document.getElementById('budget-text');
    const budgetPercText = document.getElementById('budget-percentage');
    const budgetMsg = document.getElementById('budget-msg');

    budgetBar.style.width = `${Math.min(budgetPercent, 100)}%`;
    budgetBar.className = `progress-bar ${budgetPercent > 100 ? 'bg-danger' : (budgetPercent > 80 ? 'bg-warning' : 'bg-primary')}`;
    budgetText.innerText = `Gastado: ${formatMoney(totalExpense)} / Presupuesto: ${formatMoney(budget)}`;
    budgetPercText.innerText = `${budgetPercent.toFixed(1)}%`;
    
    if (budgetPercent > 100) {
        budgetMsg.innerHTML = `<span class="text-danger fw-bold"><i class="bi bi-exclamation-octagon"></i> ¡Has excedido tu presupuesto por ${formatMoney(totalExpense - budget)}!</span>`;
    } else {
        budgetMsg.innerHTML = `<span class="text-muted">Te quedan ${formatMoney(budget - totalExpense)} por gastar este mes.</span>`;
    }

    // Filtro de categorías (Dropdown)
    const filterSelect = document.getElementById('filter-cat');
    const currentFilter = filterSelect.value;
    filterSelect.innerHTML = '<option value="all">Todas las categorías</option>';
    currentUser.categories.forEach(cat => {
        filterSelect.innerHTML += `<option value="${cat}" ${cat === currentFilter ? 'selected' : ''}>${cat}</option>`;
    });

    // Tabla de movimientos
    const tableBody = document.getElementById('user-moves-table');
    const noMovesMsg = document.getElementById('no-moves-msg');
    
    if (displayMoves.length === 0) {
        tableBody.innerHTML = '';
        noMovesMsg.classList.remove('d-none');
    } else {
        noMovesMsg.classList.add('d-none');
        // Ordenar por fecha descending
        displayMoves.sort((a,b) => new Date(b.date) - new Date(a.date));
        
        tableBody.innerHTML = displayMoves.map(m => `
            <tr>
                <td class="small text-muted">${new Date(m.date).toLocaleDateString()}</td>
                <td>
                    <div class="fw-bold text-dark">${m.desc}</div>
                </td>
                <td><span class="badge border text-dark fw-normal">${m.category}</span></td>
                <td class="text-end fw-bold ${m.type === 'income' ? 'text-success' : 'text-danger'}">
                    ${m.type === 'income' ? '+' : '-'}${formatMoney(m.amount)}
                </td>
                <td class="text-center">
                    <button class="btn btn-sm text-danger opacity-75" onclick="deleteMove(${m.id})">
                        <i class="bi bi-trash3"></i>
                    </button>
                </td>
            </tr>
        `).join('');
    }

    // Gráfico de Categorías y Resumen Lateral
    renderUserCharts(myMoves);
}

function renderUserCharts(moves) {
    const expenses = moves.filter(m => m.type === 'expense');
    const catData = {};
    expenses.forEach(m => {
        catData[m.category] = (catData[m.category] || 0) + m.amount;
    });

    const labels = Object.keys(catData);
    const data = Object.values(catData);

    const ctx = document.getElementById('userChart').getContext('2d');
    if (userChart) userChart.destroy();

    userChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: labels,
            datasets: [{
                data: data,
                backgroundColor: ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'],
                borderWidth: 0
            }]
        },
        options: {
            maintainAspectRatio: false,
            plugins: {
                legend: { position: 'bottom', labels: { usePointStyle: true, font: { size: 10 } } }
            },
            cutout: '70%'
        }
    });

    // Update Category Summary text list
    const summaryEl = document.getElementById('categories-summary');
    if (labels.length === 0) {
        summaryEl.innerHTML = '<p class="text-muted small text-center my-3">Sin gastos registrados</p>';
    } else {
        summaryEl.innerHTML = labels.map((cat, idx) => `
            <div class="d-flex justify-content-between align-items-center mb-2 small">
                <span><i class="bi bi-circle-fill me-2" style="color: ${userChart.data.datasets[0].backgroundColor[idx % 6]}"></i> ${cat}</span>
                <span class="fw-bold">${formatMoney(catData[cat])}</span>
            </div>
        `).join('');
    }
}

// --- 7. DASHBOARD ADMIN ---
function renderAdminDashboard() {
    const users = getLS(DB_KEY_USERS).filter(u => u.role !== 'admin');
    const allMoves = getLS(DB_KEY_MOVES);

    // KPIs
    let totalLiquidity = 0;
    let overBudgetCount = 0;
    let monthlyIncome = 0;
    let monthlyExpense = 0;

    const tbody = document.getElementById('admin-users-table');
    tbody.innerHTML = '';

    users.forEach(u => {
        const uMoves = allMoves.filter(m => m.userId === u.id);
        const uInc = uMoves.filter(m => m.type === 'income').reduce((s, m) => s + m.amount, 0);
        const uExp = uMoves.filter(m => m.type === 'expense').reduce((s, m) => s + m.amount, 0);
        const uBalance = uInc - uExp;
        const isOver = u.budget > 0 && uExp > u.budget;

        totalLiquidity += uBalance;
        if (isOver) overBudgetCount++;
        
        monthlyIncome += uInc;
        monthlyExpense += uExp;

        tbody.innerHTML += `
            <tr>
                <td>
                    <div class="d-flex align-items-center">
                        <div class="bg-light rounded-circle p-2 me-3"><i class="bi bi-person text-secondary"></i></div>
                        <div>
                            <div class="fw-bold">${u.name}</div>
                            <div class="small text-muted">@${u.user}</div>
                        </div>
                    </div>
                </td>
                <td>${formatMoney(u.budget)}</td>
                <td class="${isOver ? 'text-danger fw-bold' : ''}">${formatMoney(uExp)}</td>
                <td>
                    ${isOver ? '<span class="badge bg-danger bg-opacity-10 text-danger rounded-pill px-3">En Exceso</span>' : '<span class="badge bg-success bg-opacity-10 text-success rounded-pill px-3">Dentro del presupuesto</span>'}
                </td>
                <td class="text-end fw-bold ${uBalance >= 0 ? 'text-success' : 'text-danger'}">${formatMoney(uBalance)}</td>
            </tr>
        `;
    });

    document.getElementById('adm-total-users').innerText = users.length;
    document.getElementById('adm-system-balance').innerText = formatMoney(totalLiquidity);
    document.getElementById('adm-over-budget').innerText = overBudgetCount;
    document.getElementById('adm-monthly-flow').innerText = `${monthlyIncome >= monthlyExpense ? '+' : ''}${formatMoney(monthlyIncome - monthlyExpense)}`;
    document.getElementById('adm-monthly-flow').className = `fw-bold mb-0 ${monthlyIncome >= monthlyExpense ? 'text-success' : 'text-danger'}`;

    // Admin Chart
    const ctx = document.getElementById('adminChart').getContext('2d');
    if (adminChart) adminChart.destroy();
    
    adminChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: ['Ingresos Totales', 'Gastos Totales'],
            datasets: [{
                label: 'Sistema Financiero',
                data: [monthlyIncome, monthlyExpense],
                backgroundColor: ['#10b981', '#ef4444'],
                borderRadius: 10
            }]
        },
        options: {
            maintainAspectRatio: false,
            scales: { y: { beginAtZero: true, display: false }, x: { grid: { display: false } } },
            plugins: { legend: { display: false } }
        }
    });
}

// --- 8. FUNCIONES CRUD MOVIMIENTOS ---
window.showMoveModal = () => {
    // Inject Categories into select
    const select = document.getElementById('move-cat');
    select.innerHTML = currentUser.categories.map(c => `<option value="${c}">${c}</option>`).join('');
    moveModal.show();
};

document.getElementById('form-move').addEventListener('submit', (e) => {
    e.preventDefault();
    const type = document.querySelector('input[name="move-type"]:checked').value;
    const amount = parseFloat(document.getElementById('move-amount').value);
    const category = document.getElementById('move-cat').value;
    const desc = document.getElementById('move-desc').value;

    const moves = getLS(DB_KEY_MOVES);
    
    // Alerta presupuesto si es gasto
    if (type === 'expense') {
        const totalExp = moves.filter(m => m.userId === currentUser.id && m.type === 'expense').reduce((s,m) => s + m.amount, 0);
        if (totalExp + amount > currentUser.budget) {
            if (!confirm('Este gasto excederá tu presupuesto definido. ¿Continuar?')) return;
        }
    }

    const newMove = {
        id: Date.now(),
        userId: currentUser.id,
        type,
        amount,
        category,
        desc,
        date: new Date().toISOString()
    };

    moves.push(newMove);
    setLS(DB_KEY_MOVES, moves);
    
    showAlert('Movimiento registrado con éxito');
    moveModal.hide();
    e.target.reset();
    renderUserDashboard();
});

window.deleteMove = (id) => {
    if (confirm('¿Estás seguro de eliminar este registro?')) {
        const moves = getLS(DB_KEY_MOVES).filter(m => m.id !== id);
        setLS(DB_KEY_MOVES, moves);
        renderUserDashboard();
    }
};

// --- 9. CATEGORÍAS Y PRESUPUESTO ---
window.showBudgetModal = () => {
    document.getElementById('new-budget-val').value = currentUser.budget;
    budgetModal.show();
};

document.getElementById('form-budget').addEventListener('submit', (e) => {
    e.preventDefault();
    const newVal = parseFloat(document.getElementById('new-budget-val').value);
    
    // Update in users DB
    const users = getLS(DB_KEY_USERS);
    const idx = users.findIndex(u => u.id === currentUser.id);
    users[idx].budget = newVal;
    setLS(DB_KEY_USERS, users);
    
    // Update local session
    currentUser.budget = newVal;
    sessionStorage.setItem(DB_KEY_SESSION, JSON.stringify(currentUser));
    
    budgetModal.hide();
    showAlert('Presupuesto actualizado');
    renderUserDashboard();
});

window.showCategoryModal = () => {
    renderCategoryManagement();
    categoryModal.show();
};

function renderCategoryManagement() {
    const list = document.getElementById('category-list-manage');
    list.innerHTML = currentUser.categories.map(cat => `
        <div class="list-group-item d-flex justify-content-between align-items-center">
            <span>${cat}</span>
            <button class="btn btn-sm btn-link text-danger p-0" onclick="removeCategory('${cat}')">
                <i class="bi bi-x-circle"></i>
            </button>
        </div>
    `).join('');
}

document.getElementById('form-cat-add').addEventListener('submit', (e) => {
    e.preventDefault();
    const name = document.getElementById('new-cat-name').value.trim();
    if (!name) return;
    if (currentUser.categories.includes(name)) return showAlert('La categoría ya existe', 'warning');

    currentUser.categories.push(name);
    
    // Persist
    const users = getLS(DB_KEY_USERS);
    const idx = users.findIndex(u => u.id === currentUser.id);
    users[idx].categories = currentUser.categories;
    setLS(DB_KEY_USERS, users);
    sessionStorage.setItem(DB_KEY_SESSION, JSON.stringify(currentUser));

    e.target.reset();
    renderCategoryManagement();
    renderUserDashboard();
    showAlert('Categoría agregada');
});

window.removeCategory = (cat) => {
    if (confirm(`¿Eliminar la categoría "${cat}"? No se eliminarán los registros previos.`)) {
        currentUser.categories = currentUser.categories.filter(c => c !== cat);
        
        // Persist
        const users = getLS(DB_KEY_USERS);
        const idx = users.findIndex(u => u.id === currentUser.id);
        users[idx].categories = currentUser.categories;
        setLS(DB_KEY_USERS, users);
        sessionStorage.setItem(DB_KEY_SESSION, JSON.stringify(currentUser));
        
        renderCategoryManagement();
        renderUserDashboard();
    }
};

// --- 10. REPORTES ADMIN ---
window.exportAdminReport = () => {
    const users = getLS(DB_KEY_USERS).filter(u => u.role !== 'admin');
    const allMoves = getLS(DB_KEY_MOVES);
    
    let csv = 'Usuario,Presupuesto,Gastado,Balance,Estado\\n';
    
    users.forEach(u => {
        const uMoves = allMoves.filter(m => m.userId === u.id);
        const uInc = uMoves.filter(m => m.type === 'income').reduce((s, m) => s + m.amount, 0);
        const uExp = uMoves.filter(m => m.type === 'expense').reduce((s, m) => s + m.amount, 0);
        const uBalance = uInc - uExp;
        const status = uExp > u.budget ? 'EXCESO' : 'OK';
        
        csv += `${u.name},${u.budget},${uExp},${uBalance},${status}\\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.setAttribute('hidden', '');
    a.setAttribute('href', url);
    a.setAttribute('download', `reporte_financiero_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    showAlert('Reporte CSV generado correctamente');
};

// --- 11. INICIO AL CARGAR ---
document.addEventListener('DOMContentLoaded', () => {
    initDB();
    
    // Inicializar Modales
    moveModal = new bootstrap.Modal(document.getElementById('moveModal'));
    budgetModal = new bootstrap.Modal(document.getElementById('budgetModal'));
    categoryModal = new bootstrap.Modal(document.getElementById('categoryModal'));
    
    const session = JSON.parse(sessionStorage.getItem(DB_KEY_SESSION));
    if (session) {
        // Recargar datos actualizados del usuario desde LocalStorage (por si cambió budget o categories)
        const users = getLS(DB_KEY_USERS);
        currentUser = users.find(u => u.id === session.id) || session;
    }
    
    updateUI();
});