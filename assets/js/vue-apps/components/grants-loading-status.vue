<template functional>
    <div>
        <template v-if="props.status.state === 'Loading'">
            <i class="icon--loading-spinner"></i> {{ props.copy.pleaseWait }}
        </template>

        <div
            class="message message--error"
            v-if="props.status.state === 'Failure'"
        >
            <span
                v-if="
                    props.status.error &&
                        props.status.error.code === 'ERR-POSTCODE'
                "
            >
                {{ props.copy.errors.postcode }}
            </span>
            <span v-else>{{ props.copy.errors.generic }}</span>
        </div>
    </div>
</template>
