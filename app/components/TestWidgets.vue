<template>
  <div class="slide-open">
    <a
      class="slide-open__open link"
      @click="slideOpen = !slideOpen">
      {{$t('Test Widgets') }}
    </a>
    <transition name="slide-fade">
      <div
        v-if="slideOpen"
        class="slide-open__menu">
        <button
          class="button button--trans"
          v-for="tester in widgetTesters"
          :key="tester.name"
          @click="test(tester.name)">
          {{ $t(tester.name) }}
        </button>
      </div>
    </transition>
  </div>
</template>

<script lang="ts" src="./TestWidgets.vue.ts"></script>
