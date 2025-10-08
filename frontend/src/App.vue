<template>
  <div class="max-w-[1200px] mx-[auto] my-[0] p-[20px]">
    <header>
      <h1>Gestion des Élèves</h1>
      <button class="btn-primary" @click="openAddModal" :disabled="loading">
        <span class="btn-icon">+</span>
        Ajouter un élève
      </button>
    </header>

    <!-- Barre de recherche -->
    <div class="search-bar">
      <div class="search-input-container">
        <span class="search-icon">🔍</span>
        <input
          v-model="searchQuery"
          type="text"
          placeholder="Rechercher un élève par nom, prénom..."
          class="search-input"
          @input="filterEleves"
        >
        <button v-if="searchQuery" class="clear-search" @click="clearSearch">
          ×
        </button>
      </div>
      <div class="search-stats">
        {{ filteredEleves.length }} élève(s) trouvé(s)
      </div>
    </div>

    <!-- Message d'erreur -->
    <div v-if="errorMessage" class="error-message">
      {{ errorMessage }}
    </div>

    <!-- Loading state -->
    <div v-if="loading" class="loading">
      <div class="spinner"></div>
      Chargement des élèves...
    </div>

    <!-- Tableau des élèves -->
    <div v-else class="table-container">
      <table>
        <thead>
          <tr>
            <th @click="sortEleves('nom')" class="sortable">
              Nom
              <span class="sort-icon">{{ getSortIcon('nom') }}</span>
            </th>
            <th @click="sortEleves('prenom')" class="sortable">
              Prénom
              <span class="sort-icon">{{ getSortIcon('prenom') }}</span>
            </th>
            <th @click="sortEleves('date_naissance')" class="sortable">
              Date de naissance
              <span class="sort-icon">{{ getSortIcon('date_naissance') }}</span>
            </th>
            <th @click="sortEleves('note1')" class="sortable">
              Note 1
              <span class="sort-icon">{{ getSortIcon('note1') }}</span>
            </th>
            <th @click="sortEleves('note2')" class="sortable">
              Note 2
              <span class="sort-icon">{{ getSortIcon('note2') }}</span>
            </th>
            <th @click="sortEleves('moyenne')" class="sortable">
              Moyenne
              <span class="sort-icon">{{ getSortIcon('moyenne') }}</span>
            </th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="eleve in paginatedEleves" :key="eleve.nom">
            <td>{{ eleve.nom }}</td>
            <td>{{ eleve.prenom }}</td>
            <td>{{ formatDateForDisplay(eleve.date_naissance) }}</td>
            <td :class="getNoteClass(eleve.note1)">{{ eleve.note1 }}/20</td>
            <td :class="getNoteClass(eleve.note2)">{{ eleve.note2 }}/20</td>
            <td :class="getNoteClass(eleve.moyenne)">
              <strong>{{ eleve.moyenne }}/20</strong>
            </td>
            <td class="actions">
              <button class="btn-edit" @click="handleEdit(eleve)" title="Modifier">
                ✏️
              </button>
              <button class="btn-delete " @click="confirmDelete(eleve)" title="Supprimer">
                🗑️
              </button>
            </td>
          </tr>
          <tr v-if="filteredEleves.length === 0 && !loading">
            <td colspan="7" class="no-data">
              {{ searchQuery ? 'Aucun élève trouvé pour votre recherche' : 'Aucun élève trouvé' }}
            </td>
          </tr>
        </tbody>
      </table>

      <!-- Pagination -->
      <div v-if="filteredEleves.length > itemsPerPage" class="pagination">
        <button 
          @click="previousPage" 
          :disabled="currentPage === 1"
          class="pagination-btn"
        >
          ‹ Précédent
        </button>
        <span class="pagination-separator">|</span>
        <span class="pagination-info">
          Page {{ currentPage }} sur {{ totalPages }}
        </span>
        
        <button 
          @click="nextPage" 
          :disabled="currentPage === totalPages"
          class="pagination-btn"
        >
          Suivant ›
        </button>
      </div>
    </div>

    <!-- Modal Ajout/Modification -->
    <div v-if="showModal" class="modal" @click="closeModalOnOutsideClick">
      <div class="modal-content" @click.stop>
        <h2>{{ selectedEleve ? 'Modifier' : 'Ajouter' }} un élève</h2>
        
        <form @submit.prevent="handleSubmit">
          <div class="form-grid">
            <div class="form-field">
              <label for="nom">Nom *</label>
              <input
                id="nom"
                v-model="formData.nom"
                placeholder="Entrez le nom"
                required
                :disabled="!!selectedEleve"
                class="form-input"
              >
            </div>
            
            <div class="form-field">
              <label for="prenom">Prénom *</label>
              <input
                id="prenom"
                v-model="formData.prenom"
                placeholder="Entrez le prénom"
                required
                class="form-input"
              >
            </div>
            
            <div class="form-field">
              <label for="date_naissance">Date de naissance *</label>
              <input
                id="date_naissance"
                v-model="formData.date_naissance"
                type="date"
                required
                class="form-input"
              >
              <small v-if="formData.date_naissance" class="date-preview">
                {{ formatDateForDisplay(formData.date_naissance) }}
              </small>
            </div>
            
            <div class="form-field">
              <label for="note1">Note 1 *</label>
              <input
                id="note1"
                v-model="formData.note1"
                type="number"
                min="0"
                max="20"
                step="0.1"
                placeholder="0-20"
                required
                class="form-input"
              >
            </div>
            
            <div class="form-field">
              <label for="note2">Note 2 *</label>
              <input
                id="note2"
                v-model="formData.note2"
                type="number"
                min="0"
                max="20"
                step="0.1"
                placeholder="0-20"
                required
                class="form-input"
              >
            </div>
            
            <div class="form-field" v-if="formData.note1 && formData.note2">
              <label>Moyenne calculée</label>
              <div class="moyenne-display" :class="getNoteClass(calculatedMoyenne)">
                {{ calculatedMoyenne }}/20
              </div>
            </div>
          </div>
          
          <div class="modal-actions">
            <button 
              type="button" 
              class="btn-secondary" 
              @click="showModal = false" 
              :disabled="submitting"
            >
              Annuler
            </button>
            <button 
              type="submit" 
              class="btn-primary" 
              :disabled="submitting"
            >
              <span v-if="submitting" class="spinner-small"></span>
              {{ submitting ? 'Enregistrement...' : (selectedEleve ? 'Modifier' : 'Ajouter') }}
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- Modal Confirmation Suppression -->
    <div v-if="showDeleteModal" class="modal" @click="closeModalOnOutsideClick">
      <div class="modal-content" @click.stop>
        <h2>Confirmer la suppression</h2>
        <div class="delete-warning">
          ⚠️
        </div>
        <div class=" flex justify-center">
          <div class="flex ">
             <p>Êtes-vous sûr de vouloir supprimer l'élève : <strong>{{ selectedEleve?.prenom }} {{ selectedEleve?.nom }}</strong> ?</p>
          </div>
        </div>

        <div class="modal-actions flex  gap-4 justify-between  ">
          <button class="btn-secondary" @click="showDeleteModal = false">
            Annuler
          </button>
          <button class="btn-delete" @click="handleDelete">
            Supprimer définitivement
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'

const eleves = ref([])
const showModal = ref(false)
const showDeleteModal = ref(false)
const selectedEleve = ref(null)
const loading = ref(false)
const submitting = ref(false)
const errorMessage = ref('')
const searchQuery = ref('')
const currentPage = ref(1)
const itemsPerPage = 10
const sortField = ref('nom')
const sortDirection = ref('asc')

const formData = ref({
  nom: '',
  prenom: '',
  date_naissance: '',
  note1: '',
  note2: ''
})

const API_URL = 'http://localhost:4000'

// Computed properties
const calculatedMoyenne = computed(() => {
  const note1 = parseFloat(formData.value.note1) || 0
  const note2 = parseFloat(formData.value.note2) || 0
  return ((note1 + note2) / 2).toFixed(2)
})

const elevesAvecMoyenne = computed(() => {
  return eleves.value.map(eleve => ({
    ...eleve,
    moyenne: ((parseFloat(eleve.note1) + parseFloat(eleve.note2)) / 2).toFixed(2)
  }))
})

const filteredEleves = computed(() => {
  let result = elevesAvecMoyenne.value

  // Filtrage par recherche
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    result = result.filter(eleve => 
      eleve.nom.toLowerCase().includes(query) ||
      eleve.prenom.toLowerCase().includes(query)
    )
  }

  // Tri
  result.sort((a, b) => {
    let aValue = a[sortField.value]
    let bValue = b[sortField.value]

    if (sortField.value === 'date_naissance') {
      aValue = new Date(aValue)
      bValue = new Date(bValue)
    } else if (sortField.value === 'moyenne' || sortField.value.includes('note')) {
      aValue = parseFloat(aValue)
      bValue = parseFloat(bValue)
    }

    if (aValue < bValue) return sortDirection.value === 'asc' ? -1 : 1
    if (aValue > bValue) return sortDirection.value === 'asc' ? 1 : -1
    return 0
  })

  return result
})

const totalPages = computed(() => {
  return Math.ceil(filteredEleves.value.length / itemsPerPage)
})

const paginatedEleves = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage
  const end = start + itemsPerPage
  return filteredEleves.value.slice(start, end)
})

// Methods
const getNoteClass = (note) => {
  const num = parseFloat(note)
  if (num >= 16) return 'note-excellente'
  if (num >= 14) return 'note-bonne'
  if (num >= 10) return 'note-moyenne'
  return 'note-faible'
}

const getSortIcon = (field) => {
  if (sortField.value !== field) return '↕️'
  return sortDirection.value === 'asc' ? '↑' : '↓'
}

const sortEleves = (field) => {
  if (sortField.value === field) {
    sortDirection.value = sortDirection.value === 'asc' ? 'desc' : 'asc'
  } else {
    sortField.value = field
    sortDirection.value = 'asc'
  }
}

const filterEleves = () => {
  currentPage.value = 1
}

const clearSearch = () => {
  searchQuery.value = ''
  currentPage.value = 1
}

const previousPage = () => {
  if (currentPage.value > 1) currentPage.value--
}

const nextPage = () => {
  if (currentPage.value < totalPages.value) currentPage.value++
}

const fetchEleves = async () => {
  loading.value = true
  errorMessage.value = ''
  try {
    const response = await fetch(`${API_URL}/eleve`)
    if (!response.ok) throw new Error('Erreur serveur')
    eleves.value = await response.json()
  } catch (error) {
    errorMessage.value = 'Erreur lors du chargement des élèves'
    console.error('Erreur fetchEleves:', error)
  } finally {
    loading.value = false
  }
}

const validateForm = () => {
  const { nom, prenom, date_naissance, note1, note2 } = formData.value
  
  if (!nom.trim() || !prenom.trim()) {
    throw new Error('Le nom et prénom sont obligatoires')
  }
  
  if (!date_naissance) {
    throw new Error('La date de naissance est obligatoire')
  }
  
  const birthDate = new Date(date_naissance)
  const today = new Date()
  
  if (birthDate > today) {
    throw new Error('La date de naissance ne peut pas être dans le futur')
  }
  
  const minDate = new Date()
  minDate.setFullYear(today.getFullYear() - 100)
  if (birthDate < minDate) {
    throw new Error('La date de naissance semble invalide')
  }
  
  const note1Num = parseFloat(note1)
  const note2Num = parseFloat(note2)
  
  if (isNaN(note1Num) || isNaN(note2Num)) {
    throw new Error('Les notes doivent être des nombres valides')
  }
  
  if (note1Num < 0 || note1Num > 20 || note2Num < 0 || note2Num > 20) {
    throw new Error('Les notes doivent être entre 0 et 20')
  }
  
  return true
}

const handleSubmit = async (e) => {
  e.preventDefault()
  submitting.value = true
  
  try {
    validateForm()
    
    const dataToSend = {
      nom: formData.value.nom.trim(),
      prenom: formData.value.prenom.trim(),
     date_naissance: formData.value.date_naissance,
      note1: parseFloat(formData.value.note1),
      note2: parseFloat(formData.value.note2)
    }
    
    if (selectedEleve.value) {
      const response = await fetch(`${API_URL}/eleve/${selectedEleve.value.nom}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dataToSend)
      })
      
      if (response.ok) {
        await fetchEleves()
        alert('✅ Élève modifié avec succès')
        showModal.value = false
        resetForm()
      } else {
        const error = await response.json()
        throw new Error(error.message || "Erreur lors de la modification")
      }
    } else {
      const response = await fetch(`${API_URL}/eleve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dataToSend)
      })
      
      if (response.ok) {
        await fetchEleves()
        alert('✅ Élève ajouté avec succès')
        showModal.value = false
        resetForm()
      } else {
        const error = await response.json()
        throw new Error(error.message || "Erreur lors de l'ajout")
      }
    }
  } catch (error) {
    alert(error.message || "Une erreur est survenue lors de l'enregistrement")
    console.error('Erreur handleSubmit:', error)
  } finally {
    submitting.value = false
  }
}

const confirmDelete = (eleve) => {
  selectedEleve.value = eleve
  showDeleteModal.value = true
}

const handleDelete = async () => {
  try {
    const response = await fetch(`${API_URL}/eleve/${selectedEleve.value.nom}`, {
      method: 'DELETE'
    })
    if (response.ok) {
      await fetchEleves()
      alert('✅ Élève supprimé avec succès')
      showDeleteModal.value = false
      selectedEleve.value = null
    } else {
      const error = await response.json()
      alert(error.message || "Erreur lors de la suppression")
    }
  } catch (error) {
    alert("Erreur lors de la suppression de l'élève")
  }
}

const handleEdit = (eleve) => {
  selectedEleve.value = eleve
  formData.value = {
    nom: eleve.nom,
    prenom: eleve.prenom,
    date_naissance: formatDateForInput(eleve.date_naissance),
    note1: eleve.note1.toString(),
    note2: eleve.note2.toString()
  }
  showModal.value = true
}

const resetForm = () => {
  formData.value = {
    nom: '',
    prenom: '',
    date_naissance: '',
    note1: '',
    note2: ''
  }
  selectedEleve.value = null
}

const openAddModal = () => {
  resetForm()
  showModal.value = true
}

const formatDateForInput = (dateString) => {
  if (!dateString) return ''
  if (typeof dateString === 'string' && dateString.match(/^\d{4}-\d{2}-\d{2}$/)) {
    return dateString
  }
  try {
    const date = new Date(dateString)
    if (isNaN(date.getTime())) return ''
    return date.toISOString().split('T')[0]
  } catch (error) {
    return ''
  }
}

const formatDateForDisplay = (dateString) => {
  if (!dateString) return '-'
  try {
    const date = new Date(dateString)
    if (isNaN(date.getTime())) return '-'
    return date.toLocaleDateString('fr-FR')
  } catch (error) {
    return '-'
  }
}

const closeModalOnOutsideClick = (e) => {
  if (e.target.classList.contains('modal')) {
    showModal.value = false
    showDeleteModal.value = false
  }
}

const closeModalOnEscape = (e) => {
  if (e.key === 'Escape') {
    showModal.value = false
    showDeleteModal.value = false
  }
}

onMounted(() => {
  fetchEleves()
  document.addEventListener('keydown', closeModalOnEscape)
})
</script>

<style scoped>
.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}

header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30px;
  padding-bottom: 20px;
  border-bottom: 2px solid #e0e0e0;
}

h1 {
  color: #2c3e50;
  font-size: 2rem;
  margin: 0;
}

/* Search Bar */
.search-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  gap: 15px;
}

.search-input-container {
  position: relative;
  flex: 1;
  max-width: 400px;
}

.search-icon {
  position: absolute;
  left: 12px;
  top: 50%;
  transform: translateY(-50%);
  color: #666;
}

.search-input {
  width: 100%;
  padding: 10px 40px 10px 35px;
  border: 1px solid #ddd;
  border-radius: 8px;
  font-size: 14px;
}

.search-input:focus {
  border-color: #4CAF50;
  outline: none;
  box-shadow: 0 0 0 2px rgba(76, 175, 80, 0.2);
}

.clear-search {
  position: absolute;
  right: 8px;
  top: 50%;
  transform: translateY(-50%);
  background: #ccc;
  border: none;
  border-radius: 50%;
  width: 20px;
  height: 20px;
  cursor: pointer;
  font-size: 14px;
  line-height: 1;
}

.search-stats {
  color: #666;
  font-size: 14px;
  white-space: nowrap;
}

/* Table */
.table-container {
  background: white;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
}

table {
  width: 100%;
  border-collapse: collapse;
}

th, td {
  padding: 12px 15px;
  text-align: left;
  border-bottom: 1px solid #e0e0e0;
}

th {
  background-color: #f8f9fa;
  font-weight: 600;
  color: #2c3e50;
  cursor: pointer;
  user-select: none;
}

.sortable:hover {
  background-color: #e9ecef;
}

.sort-icon {
  margin-left: 5px;
  font-size: 12px;
}

tr:hover {
  background-color: #f8f9fa;
}

.actions {
  display: flex;
  gap: 8px;
}

/* Buttons */
button {
  padding: 8px 16px;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  gap: 5px;
}

.btn-primary {
  background-color: #4CAF50;
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background-color: #45a049;
  transform: translateY(-1px);
}

.btn-primary:disabled {
  background-color: #cccccc;
  cursor: not-allowed;
  transform: none;
}

.btn-secondary {
  background-color: #6c757d;
  color: white;
}

.btn-secondary:hover:not(:disabled) {
  background-color: #545b62;
}

.btn-edit {
  background-color: #ffc107;
  color: #212529;
  padding: 6px 10px;
}

.btn-edit:hover {
  background-color: #e0a800;
}

.btn-delete {
  background-color: #dc3545;
  color: white;
  padding: 6px 10px;
}

.btn-delete:hover {
  background-color: #c82333;
}

.btn-icon {
  font-weight: bold;
  font-size: 16px;
}

/* Modals */
.modal {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.modal-content {
  background: white;
  padding: 30px;
  border-radius: 12px;
  width: 90%;
  max-width: 600px;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
}

.modal-content h2 {
  margin-bottom: 20px;
  color: #2c3e50;
  text-align: center;
}

.modal-actions {
  display: flex;
  gap: 10px;
  justify-content: flex-end;
  margin-top: 25px;
}

/* Form Styles */
.form-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 15px;
}

.form-field {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.form-field:last-child:nth-child(odd) {
  grid-column: 1 / -1;
}

.form-field label {
  font-size: 14px;
  color: #555;
  font-weight: 500;
}

.form-input {
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 14px;
  transition: border-color 0.3s ease;
}

.form-input:focus {
  border-color: #4CAF50;
  outline: none;
  box-shadow: 0 0 0 2px rgba(76, 175, 80, 0.2);
}

.form-input:disabled {
  background-color: #f8f9fa;
  color: #6c757d;
  cursor: not-allowed;
}

.date-preview {
  font-size: 12px;
  color: #666;
  font-style: italic;
}

.moyenne-display {
  padding: 8px;
  border-radius: 4px;
  text-align: center;
  font-weight: bold;
  background-color: #f8f9fa;
}

/* Delete Modal */
.delete-warning {
  text-align: center;
  font-size: 48px;
  margin: 10px 0;
}

.delete-student-name {
  text-align: center;
  font-size: 18px;
  color: #2c3e50;
  margin: 10px 0;
}

.delete-warning-text {
  text-align: center;
  color: #dc3545;
  font-weight: 500;
}

/* États des notes */
.note-excellente {
  color: #2e7d32;
  font-weight: bold;
}

.note-bonne {
  color: #689f38;
  font-weight: 500;
}

.note-moyenne {
  color: #f57c00;
}

.note-faible {
  color: #d32f2f;
  font-weight: 500;
}

/* Messages d'état */
.error-message {
  background: #fee;
  color: #c33;
  padding: 12px 16px;
  border-radius: 6px;
  margin-bottom: 20px;
  border: 1px solid #fcc;
  font-weight: 500;
}

.loading {
  text-align: center;
  padding: 40px;
  color: #666;
  font-size: 16px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
}

.spinner {
  width: 30px;
  height: 30px;
  border: 3px solid #f3f3f3;
  border-top: 3px solid #4CAF50;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

.spinner-small {
  width: 16px;
  height: 16px;
  border: 2px solid #f3f3f3;
  border-top: 2px solid white;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.no-data {
  text-align: center;
  color: #666;
  padding: 40px;
  font-style: italic;
}

/* Pagination */
.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 20px;
  padding: 20px;
  border-top: 1px solid #e0e0e0;
}

.pagination-btn {
  background-color: #6c757d;
  color: white;
  padding: 8px 16px;
}

.pagination-btn:hover:not(:disabled) {
  background-color: #545b62;
}

.pagination-btn:disabled {
  background-color: #ccc;
  cursor: not-allowed;
}

.pagination-info {
  color: #666;
  font-size: 14px;
}

/* Responsive */
@media (max-width: 768px) {
  .container {
    padding: 10px;
  }
  
  header {
    flex-direction: column;
    gap: 15px;
    align-items: stretch;
  }
  
  h1 {
    text-align: center;
    font-size: 1.5rem;
  }
  
  .search-bar {
    flex-direction: column;
    align-items: stretch;
  }
  
  .search-input-container {
    max-width: none;
  }
  
  .form-grid {
    grid-template-columns: 1fr;
  }
  
  table {
    font-size: 14px;
  }
  
  th, td {
    padding: 8px 10px;
  }
  
  .actions {
    flex-direction: column;
    gap: 5px;
  }
  
  .modal-content {
    margin: 20px;
    padding: 20px;
    width: auto;
  }
  
  .modal-actions {
    flex-direction: column;
  }
  
  .pagination {
    flex-direction: column;
    gap: 10px;
  }
}
</style>
