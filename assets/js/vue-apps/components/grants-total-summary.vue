<template functional>
    <span>
        {{ props.totalResults.toLocaleString() }} {{ props.copy.resultsCount }}
        <span v-if="props.totalAwarded">{{ props.copy.totalCount }} £{{ props.totalAwarded.toLocaleString()}}</span>
    </span>
</template>
