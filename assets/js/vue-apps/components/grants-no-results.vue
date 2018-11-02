<script>
export default {
    props: ['totalResults', 'copy', 'status', 'searchSuggestions'],
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

        <div v-if="searchSuggestions && searchSuggestions.suggestions.length > 0">
            <p>Did you mean...</p>
            <ul>
                <li v-for="suggestion in searchSuggestions.suggestions"
                    :key="suggestion">
                    <button class="btn-link"
                            @click="$emit('update-query', suggestion)">
                        {{ suggestion }}
                    </button>
                </li>
            </ul>
        </div>

        <p>Try these tips to improve your results:</p>
        <ul>
            <li v-for="suggestion in copy.errors.noResults.suggestions"
                v-html="suggestion"
                :key="suggestion"></li>
        </ul>

        <p>
            <button type="button"
                    class="btn btn--medium"
                    @click="$emit('clear-all')">
                {{ copy.filters.clear }}
            </button>
            <span v-if="canGoBack">
                or
                <button type="button"
                        class="btn btn--medium"
                        @click="goBack">
                    {{ copy.goBackAStep }}
                </button>
            </span>
        </p>

        <p v-html="copy.errors.noResults.otherOptions"></p>
    </div>
</template>
