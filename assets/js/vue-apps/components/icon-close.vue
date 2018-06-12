<template functional>
    <svg
        role="img"
        class="icon icon--close"
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 512 512" width="46"
        :aria-describedby="'aria-close-desc-' + props.id">
        <desc :id="'aria-close-desc-' + props.id">{{ props.description }}</desc>
        <path d="M340.2 160l-84.4 84.3-84-83.9-11.8 11.8 84 83.8-84 83.9 11.8 11.7 84-83.8 84.4 84.2 11.8-11.7-84.4-84.3 84.4-84.2z"></path>
    </svg>
</template>
