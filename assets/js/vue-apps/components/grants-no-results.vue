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
    <div class="grants-no-results s-prose u-padded"
         v-if="totalResults === 0 && status.state !== 'Loading'">
        <h3>{{ copy.errors.noResults.heading }}</h3>

        <div v-if="searchSuggestions && searchSuggestions.suggestions.length > 0">
            <p v-html="copy.errors.noResults.didYouMean"></p>
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

        <p v-html="copy.errors.noResults.tryTheseTips"></p>
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
                {{ copy.or }}
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
