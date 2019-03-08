<template functional>
    <svg
        role="img"
        class="icon icon--bin"
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 459 459"
        width="14"
        :aria-describedby="'aria-bin-desc-' + props.id"
    >
        <desc :id="'aria-bin-desc-' + props.id">{{ props.description }}</desc>
        <path
            d="M76.5 408c0 28.05 22.95 51 51 51h204c28.05 0 51-22.95 51-51V102h-306v306zM408 25.5h-89.25L293.25 0h-127.5l-25.5 25.5H51v51h357v-51z"
        />
    </svg>
</template>
