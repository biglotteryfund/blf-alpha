<template functional>
    <svg
        role="img"
        class="icon icon--small icon--arrow-left"
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 512 512"
        width="32"
        height="32"
        :aria-describedby="'aria-arrow-left-desc-' + props.id"
    >
        <desc :id="'aria-arrow-left-desc-' + props.id">{{ props.description }}</desc>
        <path
            d="M327.3 98.9l-2.1 1.8-156.5 136c-5.3 4.6-8.6 11.5-8.6 19.2 0 7.7 3.4 14.6 8.6 19.2L324.9 411l2.6 2.3c2.5 1.7 5.5 2.7 8.7 2.7 8.7 0 15.8-7.4 15.8-16.6V112.6c0-9.2-7.1-16.6-15.8-16.6-3.3 0-6.4 1.1-8.9 2.9z"
        ></path>
    </svg>
</template>
