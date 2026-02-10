<script lang="ts">
  import { page } from '$app/stores';
  import ApplicationEdit from '$lib/components/ApplicationEdit.svelte';

  const id = $derived($page.params.id);
</script>

<svelte:head>
  <title>Edit Application - Job Application Tracker</title>
</svelte:head>

<ApplicationEdit {id} />
