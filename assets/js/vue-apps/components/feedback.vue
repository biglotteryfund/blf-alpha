<script>
import $ from 'jquery';

export default {
    props: ['description', 'fieldLabel', 'helpText', 'submitLabel'],
    data: function() {
        return {
            statusMessage: null,
            feedback: null
        };
    },
    methods: {
        handleSubmit() {
            $.ajax({
                url: '/api/feedback',
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
            <p class="ff-help" v-if="helpText">{{ helpText }}</p>
            <textarea
                class="ff-textarea u-margin-bottom"
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
