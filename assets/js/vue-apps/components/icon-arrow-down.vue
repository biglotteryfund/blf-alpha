<template functional>
    <svg
        role="img"
        class="icon icon--arrow-down"
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 512 512" width="32" height="32"
        :aria-describedby="'aria-arrow-down-desc-' + props.id">
        <desc :id="'aria-arrow-down-desc-' + props.id">{{ props.description }}</desc>
        <path d="M396.6 160l19.4 20.7L256 352 96 180.7l19.3-20.7L256 310.5"></path>
    </svg>
</template>
