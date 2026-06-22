/* ===========================================================
   OUR FAMILY TREE
   ===========================================================
   1. Create a Firebase project at https://console.firebase.google.com
   2. Enable Google Authentication
   3. Create a Firestore database
   4. Replace the config below with your project's values
   5. Deploy to GitHub Pages
   =========================================================== */

// ===== CONFIG — REPLACE WITH YOUR FIREBASE PROJECT VALUES =====
const FAMILY_NAME = "Hartoyo"; // Change to your family name
const firebaseConfig = {
  apiKey: "AIzaSyBhJiuN07UHBR6beHyYgwj2_BFnKEZnF88",
  authDomain: "hartoyo-family-tree.firebaseapp.com",
  projectId: "hartoyo-family-tree",
  storageBucket: "hartoyo-family-tree.firebasestorage.app",
  messagingSenderId: "108305598651",
  appId: "1:108305598651:web:a7149ccf3de633e8bd019e"
};

const DEFAULT_CONFIG = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT.appspot.com",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID"
};

function isFirebaseConfigured() {
  return firebaseConfig.apiKey !== DEFAULT_CONFIG.apiKey &&
         firebaseConfig.projectId !== DEFAULT_CONFIG.projectId;
}

// ===== DOM REFS =====
const $ = id => document.getElementById(id);
const treeContainer = $('tree-container');
const listContainer = $('list-container');
const modal = $('modal');
const personForm = $('person-form');
const welcomeHero = $('welcome-hero');
const setupGuide = $('setup-guide');
const welcomeEmpty = $('welcome-empty');
const toolbar = $('toolbar');
const treeWrapper = $('tree-wrapper');
const listWrapper = $('list-wrapper');

const fieldId = $('field-id');
const fieldName = $('field-name');
const fieldGender = $('field-gender');
const fieldBirth = $('field-birth');
const fieldDeath = $('field-death');
const fieldFather = $('field-father');
const fieldMother = $('field-mother');
const fieldSpouse = $('field-spouse');
const fieldNotes = $('field-notes');
const fieldOrder = $('field-order');

const familyTitle = $('family-title');
const btnLogin = $('btn-login');
const btnLogout = $('btn-logout');
const btnAddPerson = $('btn-add-person');
const btnSavePerson = $('btn-save-person');
const btnDeletePerson = $('btn-delete-person');
const btnCancelModal = $('btn-cancel-modal');
const btnCloseModal = $('btn-close-modal');
const modalTitle = $('modal-title');
const modalSubtitle = $('modal-subtitle');
const modalAvatar = $('modal-avatar');
const userInfo = $('user-info');
const userName = $('user-name');
const userAvatar = $('user-avatar');
const searchInput = $('search-input');
const btnViewTree = $('btn-view-tree');
const btnViewList = $('btn-view-list');
const btnZoomIn = $('btn-zoom-in');
const btnZoomOut = $('btn-zoom-out');
const zoomLevelSpan = $('zoom-level');
const welcomeAddLink = $('welcome-add-link');
const heroSubtitle = $('hero-subtitle');

// ===== STATE =====
let currentUser = null;
let allPeople = [];
let editingPersonId = null;
let zoomLevel = 1;
let currentView = 'tree';
let searchTerm = '';

// ===== HELPERS =====
function escapeHtml(str) {
  if (!str) return '';
  const d = document.createElement('div');
  d.textContent = str;
  return d.innerHTML;
}

function getInitials(name) {
  if (!name) return '?';
  return name.split(' ').map(w => w[0]).filter(Boolean).slice(0, 2).join('').toUpperCase();
}

function showToast(message, type = 'info') {
  let container = document.querySelector('.toast-container');
  if (!container) {
    container = document.createElement('div');
    container.className = 'toast-container';
    document.body.appendChild(container);
  }
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.textContent = message;
  container.appendChild(toast);
  setTimeout(() => toast.remove(), 3000);
}

function getYears(person) {
  if (person.birthYear && person.deathYear) return `${person.birthYear} - ${person.deathYear}`;
  if (person.birthYear) return `b. ${person.birthYear}`;
  if (person.deathYear) return `d. ${person.deathYear}`;
  return '';
}

function getAge(person) {
  if (!person.birthYear) return '';
  const end = person.deathYear || new Date().getFullYear();
  const age = end - person.birthYear;
  return age >= 0 ? `${age} years` : '';
}

// ===== FIREBASE INIT =====
if (!isFirebaseConfigured()) {
  showSetupGuide();
} else {
  initFirebase();
}

function showSetupGuide() {
  welcomeHero.style.display = 'flex';
  setupGuide.style.display = 'block';
  welcomeEmpty.style.display = 'none';
  toolbar.style.display = 'none';
  treeWrapper.style.display = 'none';
  listWrapper.style.display = 'none';
  familyTitle.textContent = `${FAMILY_NAME} Family Tree`;
  heroSubtitle.textContent = 'Set up to start building your family story.';
}

function initFirebase() {
  firebase.initializeApp(firebaseConfig);
  window.auth = firebase.auth();
  window.db = firebase.firestore();
  familyTitle.textContent = `${FAMILY_NAME} Family Tree`;
  setupAuth();
  subscribePeople();
}

// ===== AUTH =====
function setupAuth() {
  auth.onAuthStateChanged(user => {
    currentUser = user;
    if (user) {
      userInfo.style.display = 'flex';
      btnLogin.style.display = 'none';
      userName.textContent = user.displayName || user.email;
      userAvatar.src = user.photoURL || '';
      btnAddPerson.disabled = false;
    } else {
      userInfo.style.display = 'none';
      btnLogin.style.display = 'inline-flex';
      btnAddPerson.disabled = true;
    }
  });

  btnLogin.addEventListener('click', () => {
    const provider = new firebase.auth.GoogleAuthProvider();
    auth.signInWithPopup(provider).catch(err => {
      showToast('Sign in failed: ' + err.message, 'error');
    });
  });

  btnLogout.addEventListener('click', () => auth.signOut());
}

// ===== FIRESTORE =====
function subscribePeople() {
  db.collection('people').orderBy('name').onSnapshot(snapshot => {
    allPeople = [];
    snapshot.forEach(doc => {
      allPeople.push({ id: doc.id, ...doc.data() });
    });

    welcomeHero.style.display = 'none';
    toolbar.style.display = 'flex';
    treeWrapper.style.display = currentView === 'tree' ? 'block' : 'none';
    listWrapper.style.display = currentView === 'list' ? 'block' : 'none';

    if (allPeople.length === 0) {
      if (currentUser) {
        welcomeHero.style.display = 'none';
        toolbar.style.display = 'flex';
        treeWrapper.style.display = 'block';
        listWrapper.style.display = 'none';
        treeContainer.innerHTML = `<div class="loading-state">
          <p style="font-size:1.1rem;color:#666;margin-bottom:8px;">Your tree is empty</p>
          <p style="font-size:0.9rem;color:#999;">Click <strong>"Add Member"</strong> above to add the first family member!</p>
        </div>`;
      } else {
        welcomeHero.style.display = 'flex';
        setupGuide.style.display = 'none';
        welcomeEmpty.style.display = 'block';
        toolbar.style.display = 'none';
        treeWrapper.style.display = 'none';
        listWrapper.style.display = 'none';
        heroSubtitle.textContent = 'Sign in to start building your family tree.';
      }
      return;
    }

    renderCurrentView();
    populateSelects();
  }, error => {
    showToast('Could not load family data: ' + error.message, 'error');
  });
}

function savePerson(data) {
  if (data.id) {
    return db.collection('people').doc(data.id).update({
      ...data,
      updatedAt: firebase.firestore.FieldValue.serverTimestamp()
    });
  }
  return db.collection('people').add({
    ...data,
    createdAt: firebase.firestore.FieldValue.serverTimestamp(),
    updatedAt: firebase.firestore.FieldValue.serverTimestamp()
  });
}

function deletePerson(id) {
  return db.collection('people').doc(id).delete();
}

// ===== VIEW TOGGLE =====
btnViewTree.addEventListener('click', () => {
  currentView = 'tree';
  btnViewTree.classList.add('active');
  btnViewList.classList.remove('active');
  treeWrapper.style.display = 'block';
  listWrapper.style.display = 'none';
  renderCurrentView();
});

btnViewList.addEventListener('click', () => {
  currentView = 'list';
  btnViewList.classList.add('active');
  btnViewTree.classList.remove('active');
  listWrapper.style.display = 'block';
  treeWrapper.style.display = 'none';
  renderCurrentView();
});

function renderCurrentView() {
  if (currentView === 'tree') renderTree();
  else renderList();
}

// ===== SEARCH =====
searchInput.addEventListener('input', () => {
  searchTerm = searchInput.value.trim().toLowerCase();
  renderCurrentView();
});

function matchesSearch(person) {
  if (!searchTerm) return true;
  const name = (person.name || '').toLowerCase();
  const notes = (person.notes || '').toLowerCase();
  return name.includes(searchTerm) || notes.includes(searchTerm);
}

// ===== TREE RENDERING (Pyramid generation layout) =====
function calcGenerations() {
  const peopleById = {};
  allPeople.forEach(p => peopleById[p.id] = p);

  const gen = {};
  const memo = new Set();

  function getGen(personId) {
    if (memo.has(personId)) return gen[personId] || 0;
    memo.add(personId);
    const person = peopleById[personId];
    if (!person) return 0;
    let g = 0;
    if (person.fatherId && peopleById[person.fatherId]) {
      g = Math.max(g, getGen(person.fatherId) + 1);
    }
    if (person.motherId && peopleById[person.motherId]) {
      g = Math.max(g, getGen(person.motherId) + 1);
    }
    gen[personId] = g;
    return g;
  }

  allPeople.forEach(p => { if (!memo.has(p.id)) getGen(p.id); });

  // Sync couples to same generation
  allPeople.forEach(p => {
    if (p.spouseId && gen[p.spouseId] !== undefined) {
      const max = Math.max(gen[p.id], gen[p.spouseId]);
      gen[p.id] = max;
      gen[p.spouseId] = max;
    }
  });

  // For people with no parents and no spouse in tree — they stay at gen 0
  return gen;
}

function renderPersonCard(person, showActions = true) {
  const gender = person.gender === 'male' ? 'male' : person.gender === 'female' ? 'female' : '';
  const years = getYears(person);

  return `
    <div class="person-card ${gender}" data-id="${person.id}">
      <div class="pc-top"></div>
      <div class="pc-name">${escapeHtml(person.name)}</div>
      ${years ? `<div class="pc-years">${escapeHtml(years)}</div>` : ''}
      ${currentUser && showActions ? `
      <div class="pc-actions">
        <button class="pc-btn pc-edit" data-id="${person.id}">Edit</button>
        <button class="pc-btn pc-child" data-id="${person.id}">+ Child</button>
        <button class="pc-btn pc-spouse" data-id="${person.id}">+ Spouse</button>
      </div>` : ''}
    </div>`;
}

function renderTree() {
  const gen = calcGenerations();

  // Build a lookup for who has family parents in the tree
  const hasParents = {};
  allPeople.forEach(p => {
    hasParents[p.id] = (p.fatherId && allPeople.some(pp => pp.id === p.fatherId)) ||
                       (p.motherId && allPeople.some(pp => pp.id === p.motherId));
  });

  // For each couple, determine the primary (blood-relative) member
  const primaryMap = {};
  allPeople.forEach(p => {
    if (!p.spouseId) { primaryMap[p.id] = p; return; }
    if (primaryMap[p.id]) return;
    const spouse = allPeople.find(s => s.id === p.spouseId);
    if (!spouse) { primaryMap[p.id] = p; return; }
    if (primaryMap[spouse.id]) return;
    // Determine who is primary
    let primary, secondary;
    if (hasParents[p.id] && !hasParents[spouse.id]) { primary = p; secondary = spouse; }
    else if (!hasParents[p.id] && hasParents[spouse.id]) { primary = spouse; secondary = p; }
    else {
      // Both or neither have parents — use lower order, then name
      const pKey = (p.order || 0) + '_' + p.name;
      const sKey = (spouse.order || 0) + '_' + spouse.name;
      if (pKey <= sKey) { primary = p; secondary = spouse; }
      else { primary = spouse; secondary = p; }
    }
    primaryMap[primary.id] = primary;
    primaryMap[secondary.id] = primary;
  });

  const genGroups = {};
  allPeople.forEach(p => {
    const g = gen[p.id] !== undefined ? gen[p.id] : 0;
    if (!genGroups[g]) genGroups[g] = [];
    genGroups[g].push(p);
  });

  const gens = Object.keys(genGroups).map(Number).sort((a, b) => a - b);
  if (gens.length === 0) {
    treeContainer.innerHTML = `<div class="loading-state"><p>Unable to build tree view</p></div>`;
    return;
  }

  let html = '<div class="pyramid">';
  const processed = new Set();

  gens.forEach(g => {
    let people = genGroups[g];

    // Sort by the primary member's order, then primary's name
    people.sort((a, b) => {
      const pa = primaryMap[a.id] || a;
      const pb = primaryMap[b.id] || b;
      const oa = pa.order || 0;
      const ob = pb.order || 0;
      if (oa !== ob) return oa - ob;
      if (pa.id !== pb.id) return pa.name.localeCompare(pb.name);
      // Same primary (i.e. a couple) — sort secondary by order then name
      return (a.order || 0) - (b.order || 0) || a.name.localeCompare(b.name);
    });

    html += `<div class="gen-row"><div class="gen-row-inner">`;

    people.forEach(p => {
      if (processed.has(p.id) || !matchesSearch(p)) return;
      processed.add(p.id);

      const spouse = p.spouseId ? allPeople.find(s => s.id === p.spouseId) : null;
      if (spouse && !processed.has(spouse.id) && matchesSearch(spouse)) {
        processed.add(spouse.id);
        // Render primary on left, secondary on right
        const primary = primaryMap[p.id] || p;
        const secondary = primary.id === p.id ? spouse : p;
        html += `<div class="fam-unit">
          <div class="spouse-group">
            ${renderPersonCard(primary, false)}
            <span class="spouse-connector">&#9829;</span>
            ${renderPersonCard(secondary, false)}
          </div>
          <div class="pc-actions-center">
            <button class="pc-btn pc-edit" data-id="${primary.id}">Edit</button>
            <button class="pc-btn pc-child" data-id="${primary.id}">+ Child</button>
          </div>
        </div>`;
      } else {
        html += `<div class="fam-unit">${renderPersonCard(p)}</div>`;
      }
    });

    html += `</div></div>`;

    if (g < gens[gens.length - 1]) {
      html += `<div class="gen-bar">
        <svg width="100%" height="32" viewBox="0 0 100 32" preserveAspectRatio="none">
          <line x1="0" y1="0" x2="100" y2="0" stroke="#c9b8a8" stroke-width="1.5" stroke-dasharray="4 3"/>
          <line x1="50" y1="0" x2="50" y2="32" stroke="#c9b8a8" stroke-width="1.5" stroke-dasharray="4 3"/>
        </svg>
      </div>`;
    }
  });

  html += '</div>';
  treeContainer.innerHTML = html;
}

// ===== LIST RENDERING =====
function renderList() {
  const filtered = allPeople.filter(matchesSearch);

  if (filtered.length === 0) {
    listContainer.innerHTML = `<div class="list-empty">
      <p>${searchTerm ? `No one found matching "${escapeHtml(searchTerm)}"` : 'No family members yet'}</p>
    </div>`;
    return;
  }

  const byName = {};
  filtered.forEach(p => {
    const first = (p.name || '?')[0].toUpperCase();
    if (!byName[first]) byName[first] = [];
    byName[first].push(p);
  });

  let html = '';
  Object.keys(byName).sort().forEach(letter => {
    html += `<div style="margin-bottom:20px">
      <h3 style="font-family:'Inter',sans-serif;font-size:0.85rem;color:#999;margin-bottom:8px;padding-left:4px;">${letter}</h3>`;
    byName[letter].sort((a, b) => a.name.localeCompare(b.name)).forEach(p => {
      const gender = p.gender === 'male' ? 'male' : p.gender === 'female' ? 'female' : '';
      const years = getYears(p);
      const age = getAge(p);
      const parents = [p.fatherId, p.motherId].map(id => {
        const parent = allPeople.find(pp => pp.id === id);
        return parent ? parent.name : null;
      }).filter(Boolean);

      html += `<div class="list-card" data-id="${p.id}">
        <div class="list-avatar ${gender}">${getInitials(p.name)}</div>
        <div class="list-info">
          <div class="list-name">${escapeHtml(p.name)}</div>
          <div class="list-detail">${[years, age].filter(Boolean).join(' · ')}</div>
          ${parents.length > 0 ? `<div class="list-parents">Child of ${parents.join(' & ')}</div>` : ''}
        </div>
      </div>`;
    });
    html += '</div>';
  });

  listContainer.innerHTML = html;
}

// Listen for clicks on list items to open edit
listContainer.addEventListener('click', e => {
  const card = e.target.closest('.list-card');
  if (!card) return;
  const id = card.dataset.id;
  const person = allPeople.find(p => p.id === id);
  if (person && currentUser) openModal(person);
});

// ===== MODAL =====
function openModal(person = null) {
  editingPersonId = person ? person.id : null;
  modal.style.display = 'flex';
  document.body.style.overflow = 'hidden';
  populateSelects();

  if (person) {
    modalTitle.textContent = person.name;
    modalSubtitle.textContent = 'Edit their details';
    modalAvatar.textContent = getInitials(person.name);
    fieldId.value = person.id || '';
    fieldName.value = person.name || '';
    fieldGender.value = person.gender || '';
    fieldBirth.value = person.birthYear || '';
    fieldDeath.value = person.deathYear || '';
    fieldFather.value = person.fatherId || '';
    fieldMother.value = person.motherId || '';
    fieldSpouse.value = person.spouseId || '';
    fieldNotes.value = person.notes || '';
    fieldOrder.value = person.order !== undefined ? person.order : 0;
    btnDeletePerson.style.display = 'inline-flex';
    updateGenderPicker(person.gender);
  } else {
    modalTitle.textContent = 'Add a Family Member';
    modalSubtitle.textContent = 'Add their story to the tree';
    modalAvatar.textContent = '?';
    personForm.reset();
    fieldId.value = '';
    fieldOrder.value = 0;
    btnDeletePerson.style.display = 'none';
    updateGenderPicker('');
  }
}

function closeModal() {
  modal.style.display = 'none';
  document.body.style.overflow = '';
  editingPersonId = null;
}

btnCancelModal.addEventListener('click', closeModal);
btnCloseModal.addEventListener('click', closeModal);
modal.addEventListener('click', e => {
  if (e.target.classList.contains('modal-backdrop')) closeModal();
});

// ===== GENDER PICKER =====
function updateGenderPicker(value) {
  document.querySelectorAll('.gender-option').forEach(el => {
    el.classList.toggle('selected', el.dataset.value === value);
  });
}

document.getElementById('gender-picker').addEventListener('click', e => {
  const opt = e.target.closest('.gender-option');
  if (!opt) return;
  const value = opt.dataset.value;
  updateGenderPicker(value);
  fieldGender.value = value;
});

// ===== SAVE =====
btnSavePerson.addEventListener('click', () => {
  if (!fieldName.value.trim()) {
    showToast('Please enter a name', 'error');
    fieldName.focus();
    return;
  }

  const data = {
    name: fieldName.value.trim(),
    gender: fieldGender.value || '',
    birthYear: fieldBirth.value ? parseInt(fieldBirth.value) : null,
    deathYear: fieldDeath.value ? parseInt(fieldDeath.value) : null,
    fatherId: fieldFather.value || null,
    motherId: fieldMother.value || null,
    spouseId: fieldSpouse.value || null,
    notes: fieldNotes.value.trim() || '',
    order: fieldOrder.value ? parseInt(fieldOrder.value) : 0
  };

  if (data.birthYear && data.deathYear && data.deathYear < data.birthYear) {
    showToast('Death year can\'t be before birth year', 'error');
    return;
  }

  // Prevent self-referencing as parent/spouse
  if (fieldId.value) {
    if (data.fatherId === fieldId.value || data.motherId === fieldId.value || data.spouseId === fieldId.value) {
      showToast('A person cannot be their own relative', 'error');
      return;
    }
  }

  if (fieldId.value) data.id = fieldId.value;

  savePerson(data).then(() => {
    showToast('Saved!', 'success');
    closeModal();
    renderCurrentView();
  }).catch(err => {
    showToast('Error saving: ' + err.message, 'error');
  });
});

// ===== DELETE =====
btnDeletePerson.addEventListener('click', () => {
  const id = fieldId.value;
  if (!id) return;

  const hasChildren = allPeople.some(p => p.fatherId === id || p.motherId === id);
  let msg = 'Remove this person from the tree?';
  if (hasChildren) msg = 'This person has children in the tree. Remove them anyway?';

  if (!confirm(msg)) return;

  deletePerson(id).then(() => {
    showToast('Removed from tree', 'info');
    closeModal();
  }).catch(err => {
    showToast('Error: ' + err.message, 'error');
  });
});

// ===== ADD PERSON BUTTON =====
btnAddPerson.addEventListener('click', () => openModal());
welcomeAddLink.addEventListener('click', e => {
  e.preventDefault();
  if (currentUser) openModal();
  else btnLogin.click();
});

// ===== POPULATE SELECTS =====
function populateSelects() {
  const exclude = new Set();
  if (editingPersonId) exclude.add(editingPersonId);

  [fieldFather, fieldMother, fieldSpouse].forEach(sel => {
    const current = sel.value;
    sel.innerHTML = '<option value="">-- Select --</option>';
    allPeople
      .filter(p => !exclude.has(p.id) || p.id === current)
      .sort((a, b) => a.name.localeCompare(b.name))
      .forEach(p => {
        const opt = document.createElement('option');
        opt.value = p.id;
        opt.textContent = p.name;
        if (p.id === current) opt.selected = true;
        sel.appendChild(opt);
      });
  });
}

// ===== TREE EVENTS =====
treeContainer.addEventListener('click', e => {
  if (!currentUser) return;
  const target = e.target.closest('button');
  if (!target) return;
  const id = target.dataset.id;
  if (!id) return;
  const person = allPeople.find(p => p.id === id);
  if (!person) return;

  if (target.classList.contains('pc-edit')) {
    openModal(person);
  } else if (target.classList.contains('pc-child')) {
    openModal();
    modalTitle.textContent = `Add a child of ${person.name}`;
    modalSubtitle.textContent = 'Enter their details';
    if (person.gender === 'male') fieldFather.value = person.id;
    else if (person.gender === 'female') fieldMother.value = person.id;
    else fieldMother.value = person.id;
  } else if (target.classList.contains('pc-spouse')) {
    openModal();
    modalTitle.textContent = `Add a spouse of ${person.name}`;
    modalSubtitle.textContent = 'Enter their details';
    fieldSpouse.value = person.id;
  }
});

// Double-click to edit in tree view
treeContainer.addEventListener('dblclick', e => {
  if (!currentUser) return;
  const card = e.target.closest('.person-card');
  if (!card) return;
  const id = card.dataset.id;
  const person = allPeople.find(p => p.id === id);
  if (person) openModal(person);
});

// ===== ZOOM =====
btnZoomIn.addEventListener('click', () => {
  zoomLevel = Math.min(zoomLevel + 0.15, 2);
  applyZoom();
});

btnZoomOut.addEventListener('click', () => {
  zoomLevel = Math.max(zoomLevel - 0.15, 0.3);
  applyZoom();
});

document.addEventListener('keydown', e => {
  if ((e.ctrlKey || e.metaKey) && (e.key === '=' || e.key === '+')) {
    e.preventDefault();
    btnZoomIn.click();
  }
  if ((e.ctrlKey || e.metaKey) && e.key === '-') {
    e.preventDefault();
    btnZoomOut.click();
  }
});

function applyZoom() {
  treeContainer.style.transform = `scale(${zoomLevel})`;
  treeContainer.style.transformOrigin = 'top center';
  zoomLevelSpan.textContent = Math.round(zoomLevel * 100) + '%';
}

// ===== KEYBOARD =====
document.addEventListener('keydown', e => {
  if (e.key === 'Escape' && modal.style.display === 'flex') closeModal();
  if ((e.ctrlKey || e.metaKey) && e.key === 'Enter' && modal.style.display === 'flex') {
    e.preventDefault();
    btnSavePerson.click();
  }
});
