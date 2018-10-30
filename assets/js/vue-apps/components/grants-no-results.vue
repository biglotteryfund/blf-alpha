<script>
export default {
    props: ['totalResults', 'copy'],
    computed: {
        canGoBack() {
            return window.history.length > 1;
        }
    },
    methods: {
        goBack() {
            return window.history.back();
        }
    }
};
</script>
<template>
    <div class="grants-no-results s-prose" v-if="totalResults === 0">
        <h3>{{ copy.errors.noResults.heading }}</h3>

        <ul>
            <li v-for="suggestion in copy.errors.noResults.suggestions" v-html="suggestion" :key="suggestion"></li>
        </ul>

        <p>
            <button type="button"
                    class="btn btn--medium"
                    @click="$emit('clear-filters')">
                {{ copy.filters.clear }}
            </button>
            <span v-if="canGoBack">
                or
                <!-- @TODO i18n -->
                <button type="button"
                        class="btn btn--medium"
                        @click="goBack">
                    Go back a step
                </button>
            </span>
        </p>

        <p v-html="copy.errors.noResults.otherOptions"></p>
    </div>
</template>
