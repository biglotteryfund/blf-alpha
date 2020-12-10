<template functional>
    <span role="alert">
        {{ props.totalResults.toLocaleString() }} {{ props.copy.resultsCount }}
        <template v-if="props.totalAwarded">
            {{ props.copy.totalCount }} £{{
                props.totalAwarded.toLocaleString()
            }}
        </template>
    </span>
</template>
