<script>
import $ from 'jquery';
export default {
    props: ['description', 'fieldLabel', 'submitLabel'],
    data: function() {
        return {
            statusMessage: null,
            feedback: null
        };
    },
    methods: {
        handleSubmit() {
            $.ajax({
                url: '/feedback',
                type: 'POST',
                data: {
                    description: this.description,
                    message: this.feedback
                },
                dataType: 'json',
                success: response => {
                    this.statusMessage = response.message;
                }
            });
        }
    }
};
</script>

<template>
    <div class="content-box content-box--tinted">
        <template v-if="statusMessage"><p>{{ statusMessage }}</p></template>
        <form v-if="!statusMessage" v-on:submit.prevent="handleSubmit">
            <label class="ff-label" for="field-message">{{ fieldLabel }}</label>
            <textarea
                class="ff-textarea spaced"
                id="field-message"
                name="message"
                v-model="feedback"
                required
                aria-required="true"
            ></textarea>
            <input class="btn btn--small" type="submit" :value=submitLabel />
        </form>
    </div>
</template>
