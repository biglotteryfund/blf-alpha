<script>
    export default {
        props: ['totalResults', 'clearFilters']
    };
</script>
<template>
    <div class="grants-no-results s-prose" v-if="totalResults === 0">
        <h3>We're sorry, we couldn't find any results matching your criteria</h3>

        <ul>
            <li>Try a different query or clear your filters</li>
            <li>Try searching something less specific — sometimes using a more general search term may help</li>
            <li>Double check the spelling of any keywords you are searching for</li>
            <li>Our database might not have the details for grants awarded under 1 month ago. Please check our <a href="/news-and-events">news section</a> if you are looking for a recently awarded grant</li>
        </ul>

        <p><button type="button" class="btn btn--medium"
            @click="$emit('clear-filters')">
            Clear all filters
        </button></p>

        <p>If you're looking for something specific and would like some help <a href="/contact">please contact us</a>.</p>
    </div>
</template>
