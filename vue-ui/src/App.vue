<script setup lang="ts">
import { RouterView, useRouter } from 'vue-router';
import { useDarkMode } from '@/composables/useDarkMode';
import { SunIcon, MoonIcon, PlusIcon } from '@heroicons/vue/24/outline';

const { isDark, toggle } = useDarkMode();
const router = useRouter();
</script>

<template>
  <div class="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
    <!-- Header -->
    <header class="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex justify-between items-center h-16">
          <router-link
            to="/"
            class="flex items-center gap-3 min-w-0"
          >
            <svg
              class="w-8 h-8 flex-shrink-0"
              viewBox="0 0 32 32"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M2 4l14 24L30 4h-6l-8 13.6L8 4z"
                fill="#41b883"
              />
              <path
                d="M8 4l8 13.6L24 4h-5l-3 5.1L13 4z"
                fill="#35495e"
              />
            </svg>
            <h1 class="text-xl font-bold text-gray-900 dark:text-white truncate">
              Job Application Tracker
              <span class="hidden sm:inline text-sm font-normal text-gray-500 dark:text-gray-400">
                (Vue - Nuxt)
              </span>
            </h1>
          </router-link>

          <div class="flex items-center space-x-4">
            <button
              class="p-2 rounded-md text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-primary-500"
              :aria-label="isDark ? 'Switch to light mode' : 'Switch to dark mode'"
              @click="toggle"
            >
              <MoonIcon
                v-if="!isDark"
                class="h-5 w-5"
              />
              <SunIcon
                v-else
                class="h-5 w-5"
              />
            </button>

            <button
              class="btn btn-primary flex items-center"
              @click="router.push('/applications/new')"
            >
              <PlusIcon class="h-5 w-5 mr-1" />
              Add Application
            </button>
          </div>
        </div>
      </div>
    </header>

    <!-- Main Content -->
    <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <RouterView />
    </main>
  </div>
</template>
