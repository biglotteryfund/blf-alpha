<template functional>
    <div>
        <template v-if="props.status.state === 'Loading'">
            <i class="icon--loading-spinner"></i>
            Searching, please wait...
        </template>

        <div class="error-message" v-if="props.status.state === 'Failure' && props.status.error">
            <span v-if="props.error && props.error.code === 'ERR-POSTCODE'">
                The postcode you entered was invalid – please try another one.
            </span>
            <span v-else>There was an error with your search.</span>
        </div>
    </div>
</template>
