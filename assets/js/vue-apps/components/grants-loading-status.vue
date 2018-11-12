<template functional>
    <div>
        <template v-if="props.status.state === 'Loading'">
            <i class="icon--loading-spinner"></i> {{ props.copy.pleaseWait }}
        </template>

        <div class="error-message" v-if="props.status.state === 'Failure' && props.status.error">
            <span v-if="props.error && props.error.code === 'ERR-POSTCODE'"> {{ props.copy.errors.postcode }} </span>
            <span v-else> {{ props.copy.errors.generic }} </span>
        </div>
    </div>
</template>
