<script>
    export default {
        props: ['totalResults', 'copy']
    };
</script>
<template>
    <div class="grants-no-results s-prose" v-if="totalResults === 0">
        <h3>{{ copy.errors.noResults.heading }}</h3>

        <ul>
            <li v-for="suggestion in copy.errors.noResults.suggestions" v-html="suggestion" :key="suggestion"></li>
        </ul>

        <p><button type="button" class="btn btn--medium"
            @click="$emit('clear-filters')">
            {{ copy.filters.clear }}
        </button></p>

        <p v-html="copy.errors.noResults.otherOptions"></p>
    </div>
</template>
