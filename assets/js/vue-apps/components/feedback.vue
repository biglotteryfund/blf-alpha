<script>
import $ from 'jquery';

export default {
    props: ['description', 'fieldLabel', 'helpText', 'submitLabel', 'metadata'],
    data: function() {
        return {
            statusMessage: null,
            feedback: null
        };
    },
    computed: {
        message() {
            let message = this.feedback;
            // Append any metadata below the user's message
            if (this.metadata) {
                message += `\n\n--\n${this.metadata}`;
            }
            return message;
        }
    },
    methods: {
        handleSubmit() {
            $.ajax({
                url: '/api/feedback',
                type: 'POST',
                data: {
                    description: this.description,
                    message: this.message
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
        <template v-if="statusMessage">
            <p>{{ statusMessage }}</p>
        </template>
        <form v-if="!statusMessage" @submit.prevent="handleSubmit">
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
            <input class="btn btn--small" type="submit" :value="submitLabel" />
        </form>
    </div>
</template>
