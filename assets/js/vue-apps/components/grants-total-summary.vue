<template functional>
    <span>
        {{ props.totalResults.toLocaleString() }} projects found
        <span v-if="props.totalAwarded">totalling £{{ props.totalAwarded.toLocaleString()}}</span>
    </span>
</template>
