<template>
  <div>
  <div v-if="open" class="fixed inset-0 z-50 flex items-center justify-center">
    <div class="absolute inset-0 bg-[rgba(0,0,0,.45)]" @click="onClose"></div>
    <div class="relative w-full max-w-md mx-auto">
      <div class="mx-auto block max-w-md rounded-lg bg-white p-6 shadow-4 dark:bg-surface-dark">
        <div class="flex items-center justify-between mb-4">
          <h2 class="m-0 text-lg font-semibold">{{ editing ? 'Modifier un élève' : 'Ajouter un élève' }}</h2>
          <button @click="onClose" aria-label="Fermer" class="rounded-md px-3 py-2 bg-[#eef2ff]">✕</button>
        </div>
        <form @submit.prevent="emitSubmit">
          <!-- Nom -->
          <div class="relative mb-6" data-twe-input-wrapper-init>
            <input
              type="text"
              class="peer block min-h-[auto] w-full rounded border-0 bg-transparent px-3 py-[0.32rem] leading-[1.6] outline-none transition-all duration-200 ease-linear focus:placeholder:opacity-100 peer-focus:text-primary data-[twe-input-state-active]:placeholder:opacity-100 motion-reduce:transition-none dark:text-white dark:placeholder:text-neutral-300 dark:autofill:shadow-autofill dark:peer-focus:text-primary [&:not([data-twe-input-placeholder-active])]:placeholder:opacity-0"
              id="eleveNom"
              placeholder="Nom"
              v-model="formNom"
            />
            <label
              for="eleveNom"
              class="pointer-events-none absolute left-3 top-0 mb-0 max-w-[90%] origin-[0_0] truncate pt-[0.37rem] leading-[1.6] text-neutral-500 transition-all duration-200 ease-out peer-focus:-translate-y-[0.9rem] peer-focus:scale-[0.8] peer-focus:text-primary peer-data-[twe-input-state-active]:-translate-y-[0.9rem] peer-data-[twe-input-state-active]:scale-[0.8] motion-reduce:transition-none dark:text-neutral-300 dark:peer-focus:text-primary"
              >Nom
            </label>
          </div>

          <!-- Prénom -->
          <div class="relative mb-6" data-twe-input-wrapper-init>
            <input
              type="text"
              maxlength="30"
              class="peer block min-h-[auto] w-full rounded border-0 bg-transparent px-3 py-[0.32rem] leading-[1.6] outline-none transition-all duration-200 ease-linear focus:placeholder:opacity-100 peer-focus:text-primary data-[twe-input-state-active]:placeholder:opacity-100 motion-reduce:transition-none dark:text-white dark:placeholder:text-neutral-300 dark:autofill:shadow-autofill dark:peer-focus:text-primary [&:not([data-twe-input-placeholder-active])]:placeholder:opacity-0"
              id="elevePrenom"
              placeholder="Prénom"
              v-model="formPrenom"
            />
            <label
              for="elevePrenom"
              class="pointer-events-none absolute left-3 top-0 mb-0 max-w-[90%] origin-[0_0] truncate pt-[0.37rem] leading-[1.6] text-neutral-500 transition-all duration-200 ease-out peer-focus:-translate-y-[0.9rem] peer-focus:scale-[0.8] peer-focus:text-primary peer-data-[twe-input-state-active]:-translate-y-[0.9rem] peer-data-[twe-input-state-active]:scale-[0.8] motion-reduce:transition-none dark:text-neutral-300 dark:peer-focus:text-primary"
              >Prénom
            </label>
          </div>

          <!-- Date de naissance -->
          <div class="relative mb-6" data-twe-input-wrapper-init>
            <input
              type="date"
              class="peer block min-h-[auto] w-full rounded border-0 bg-transparent px-3 py-[0.32rem] leading-[1.6] outline-none transition-all duration-200 ease-linear focus:placeholder:opacity-100 peer-focus:text-primary data-[twe-input-state-active]:placeholder:opacity-100 motion-reduce:transition-none dark:text-white dark:placeholder:text-neutral-300 dark:autofill:shadow-autofill dark:peer-focus:text-primary [&:not([data-twe-input-placeholder-active])]:placeholder:opacity-0"
              id="eleveDate"
              placeholder="Date de naissance"
              v-model="formDate"
            />
            <label
              for="eleveDate"
              class="pointer-events-none absolute left-3 top-0 mb-0 max-w-[90%] origin-[0_0] truncate pt-[0.37rem] leading-[1.6] text-neutral-500 transition-all duration-200 ease-out peer-focus:-translate-y-[0.9rem] peer-focus:scale-[0.8] peer-focus:text-primary peer-data-[twe-input-state-active]:-translate-y-[0.9rem] peer-data-[twe-input-state-active]:scale-[0.8] motion-reduce:transition-none dark:text-neutral-300 dark:peer-focus:text-primary"
              >Date de naissance
            </label>
          </div>

          <!-- Note 1 -->
          <div class="relative mb-6" data-twe-input-wrapper-init>
            <input
              type="number"
              step="0.01"
              class="peer block min-h-[auto] w-full rounded border-0 bg-transparent px-3 py-[0.32rem] leading-[1.6] outline-none transition-all duration-200 ease-linear focus:placeholder:opacity-100 peer-focus:text-primary data-[twe-input-state-active]:placeholder:opacity-100 motion-reduce:transition-none dark:text-white dark:placeholder:text-neutral-300 dark:autofill:shadow-autofill dark:peer-focus:text-primary [&:not([data-twe-input-placeholder-active])]:placeholder:opacity-0"
              id="eleveNote1"
              placeholder="Note 1"
              v-model="formNote1"
            />
            <label
              for="eleveNote1"
              class="pointer-events-none absolute left-3 top-0 mb-0 max-w-[90%] origin-[0_0] truncate pt-[0.37rem] leading-[1.6] text-neutral-500 transition-all duration-200 ease-out peer-focus:-translate-y-[0.9rem] peer-focus:scale-[0.8] peer-focus:text-primary peer-data-[twe-input-state-active]:-translate-y-[0.9rem] peer-data-[twe-input-state-active]:scale-[0.8] motion-reduce:transition-none dark:text-neutral-300 dark:peer-focus:text-primary"
              >Note 1
            </label>
          </div>

          <!-- Note 2 -->
          <div class="relative mb-6" data-twe-input-wrapper-init>
            <input
              type="number"
              step="0.01"
              class="peer block min-h-[auto] w-full rounded border-0 bg-transparent px-3 py-[0.32rem] leading-[1.6] outline-none transition-all duration-200 ease-linear focus:placeholder:opacity-100 peer-focus:text-primary data-[twe-input-state-active]:placeholder:opacity-100 motion-reduce:transition-none dark:text-white dark:placeholder:text-neutral-300 dark:autofill:shadow-autofill dark:peer-focus:text-primary [&:not([data-twe-input-placeholder-active])]:placeholder:opacity-0"
              id="eleveNote2"
              placeholder="Note 2"
              v-model="formNote2"
            />
            <label
              for="eleveNote2"
              class="pointer-events-none absolute left-3 top-0 mb-0 max-w-[90%] origin-[0_0] truncate pt-[0.37rem] leading-[1.6] text-neutral-500 transition-all duration-200 ease-out peer-focus:-translate-y-[0.9rem] peer-focus:scale-[0.8] peer-focus:text-primary peer-data-[twe-input-state-active]:-translate-y-[0.9rem] peer-data-[twe-input-state-active]:scale-[0.8] motion-reduce:transition-none dark:text-neutral-300 dark:peer-focus:text-primary"
              >Note 2 
            </label>
          </div>

          <div class="flex items-center justify-between gap-2">
            <div>
              <button v-if="editing" type="button" @click="openConfirmDelete" class="inline-block rounded bg-[#fee2e2] px-4 py-2 text-sm font-medium text-[#991b1b]">
                Supprimer
              </button>
            </div>
            <div class="flex gap-2">
              <button type="submit" class="inline-block rounded bg-primary px-6 pb-2 pt-2.5 text-xs font-medium uppercase leading-normal text-white shadow-primary-3 transition duration-150 ease-in-out hover:bg-primary-accent-300 focus:bg-primary-accent-300 focus:outline-none">
                {{ editing ? 'Mettre à jour' : 'Ajouter' }}
              </button>
              <button type="button" @click="resetForm" class="inline-block rounded bg-gray-100 px-6 pb-2 pt-2.5 text-xs font-medium uppercase leading-normal text-gray-700">
                Réinitialiser
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  </div>

  <!-- Sous-modale de confirmation suppression -->
  <div v-if="confirmOpen" class="fixed inset-0 z-60 flex items-center justify-center">
    <div class="absolute inset-0 bg-[rgba(0,0,0,.45)]" @click="confirmOpen=false"></div>
    <div class="relative w-full max-w-xl mx-auto rounded-lg bg-white p-6 border border-gray-200">
      <h3 class="m-0 text-lg font-semibold mb-2">Confirmation</h3>
      <p class="mb-4">Êtes-vous sûr de supprimer l'élève {{ formNom || initial?.nom || '' }} ?</p>
      <div class="flex justify-end gap-2">
        <button @click="confirmOpen=false" class="inline-block rounded bg-gray-100 px-4 py-2 text-sm text-gray-700">Annuler</button>
        <button @click="confirmDelete" class="inline-block rounded bg-[#dc2626] px-4 py-2 text-sm text-white">Supprimer</button>
      </div>
    </div>
  </div>
  </div>
</template>

<script setup>
import { ref, watch, toRefs } from 'vue'

const props = defineProps({
  open: { type: Boolean, default: false },
  editing: { type: Boolean, default: false },
  initial: { type: Object, default: null }
})
const emit = defineEmits(['update:open', 'submit', 'delete'])

const { open } = toRefs(props)

const formNom = ref('')
const formPrenom = ref('')
const formDate = ref('')
const formNote1 = ref('')
const formNote2 = ref('')

function fillFromInitial() {
  const e = props.initial || {}
  formNom.value = e.nom || ''
  formPrenom.value = e.prenom || ''
  formDate.value = (e.date_naissance || '').slice?.(0,10) || ''
  formNote1.value = e.note1 ?? ''
  formNote2.value = e.note2 ?? ''
}

watch(() => props.initial, fillFromInitial, { immediate: true })
watch(open, (v) => { if (v) fillFromInitial() })

function onClose() { emit('update:open', false) }

function resetForm() {
  formNom.value = ''
  formPrenom.value = ''
  formDate.value = ''
  formNote1.value = ''
  formNote2.value = ''
}

function emitSubmit() {
  const payload = {
    nom: String(formNom.value || '').trim(),
    prenom: String(formPrenom.value || '').trim(),
    date_naissance: formDate.value,
    note1: Number(formNote1.value),
    note2: Number(formNote2.value)
  }
  emit('submit', payload)
}

// Gestion suppression
const confirmOpen = ref(false)
function openConfirmDelete() { confirmOpen.value = true }
function confirmDelete() {
  const nom = String(formNom.value || '').trim() || (props.initial && props.initial.nom) || ''
  confirmOpen.value = false
  emit('delete', nom)
}
</script>

