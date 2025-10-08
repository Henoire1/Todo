<template>
  <header style="display:flex; align-items:center; justify-content:space-between; padding:16px; background:#fff; border-bottom:1px solid #e5e7eb;">
    <div style="display:flex; align-items:center; gap:12px;">
      <input
        :value="modelValue"
        @input="$emit('update:modelValue', $event.target.value)"
        placeholder="Rechercher un élève (nom/prénom)"
        style="padding:10px 12px; border:1px solid #e5e7eb; border-radius:10px; min-width:320px;"
      />
      <button @click="$emit('refresh')" style="padding:10px 12px; border-radius:10px; background:#eef2ff; color:#3730a3;">Actualiser</button>
      <button @click="$emit('add')" style="padding:10px 12px; border-radius:10px; background:#4f46e5; color:#fff;">Ajouter un élève</button>
    </div>
    <div v-if="total !== undefined" style="font-size:14px; color:#6b7280;">
      Total: {{ total }}
    </div>
  </header>
</template>

<script setup>
defineProps({
  modelValue: { type: String, default: '' },
  total: { type: Number, default: undefined }
})
defineEmits(['update:modelValue', 'refresh', 'add'])
</script>
