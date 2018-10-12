<template functional>
    <div v-if="props.isCalculating || props.searchError">
        <p v-show="props.isCalculating">
            <i class="icon--loading-spinner"></i>
            Searching, please wait...
        </p>

        <p v-show="props.searchError">
            <span v-if="props.searchError === 'ERR-POSTCODE'">The postcode you entered was invalid – please try another one.</span>
            <span v-else>There was an error with your search.</span>
        </p>
    </div>
</template>
