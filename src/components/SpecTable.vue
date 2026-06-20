<script setup lang="ts">
defineProps<{
  specs: { key: string; value: string }[]
}>()
</script>

<template>
  <div class="rounded-wood-lg overflow-hidden border border-wood-300" v-if="specs.length">
    <table class="w-full">
      <tbody>
        <tr
          v-for="(spec, index) in specs"
          :key="index"
          :class="index % 2 === 0 ? 'bg-wood-100' : 'bg-wood-50'"
        >
          <td class="px-4 py-2.5 text-sm font-medium text-wood-600 w-1/3 border-r border-wood-300">
            {{ spec.key }}
          </td>
          <td class="px-4 py-2.5 text-sm text-wood-700">
            {{ spec.value }}
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>
