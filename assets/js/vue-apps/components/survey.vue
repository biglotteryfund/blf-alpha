<script>
import $ from 'jquery';

const statuses = {
    NOT_ASKED: 'NOT_ASKED',
    MESSAGE_BOX_SHOWN: 'MESSAGE_BOX_SHOWN',
    SUBMISSION_SUCCESS: 'SUBMISSION_SUCCESS',
    SUBMISSION_ERROR: 'SUBMISSION_ERROR'
};

export default {
    props: ['question', 'prompt', 'yes', 'no', 'submit', 'cancel', 'success', 'error'],
    data() {
        return {
            statuses: statuses,
            status: statuses.NOT_ASKED,
            response: {
                choice: null,
                message: null,
                path: window.location.pathname
            }
        };
    },
    methods: {
        storeResponse(choice) {
            this.response.choice = choice;

            $.ajax({
                url: `/api/survey`,
                type: 'POST',
                dataType: 'json',
                data: this.response
            }).then(
                response => {
                    if (response.status === 'success') {
                        this.status = this.statuses.SUBMISSION_SUCCESS;
                    } else {
                        this.status = this.statuses.SUBMISSION_ERROR;
                    }
                },
                () => (this.status = this.statuses.SUBMISSION_ERROR)
            );
        },
        selectChoice(choice) {
            if (choice === 'yes') {
                this.storeResponse(choice);
            } else if (choice === 'no') {
                this.status = statuses.MESSAGE_BOX_SHOWN;
            }
        },
        resetChoice() {
            this.status = statuses.NOT_ASKED;
        }
    }
};
</script>

<template>
    <aside role="complementary" class="survey u-dont-print">
        <div class="u-inner">
            <div class="survey__choices" v-if="status === statuses.NOT_ASKED">
                <p class="survey__choices-question">{{ question }}</p>
                <div class="survey__choices-actions">
                    <button class="btn btn--small survey__choice" type="button"
                        v-on:click="selectChoice('yes')"
                    >{{ yes }}</button>
                    <button class="btn btn--small survey__choice" type="button"
                        v-on:click="selectChoice('no')"
                    >{{ no }}</button>
                </div>
            </div>

            <p class="survey__response" v-if="status === statuses.SUBMISSION_SUCCESS">
                {{ success }}
            </p>

            <p class="survey__response" v-if="status === statuses.SUBMISSION_ERROR">
                {{ error }}
            </p>

            <div class="survey__extra" v-if="status === statuses.MESSAGE_BOX_SHOWN">
                <form class="survey__form" v-on:submit.prevent="storeResponse('no')">
                    <div class="survey__form-fields">
                        <label class="ff-label" for="survey-extra-msg">{{ prompt }}</label>
                        <textarea class="ff-textarea" id="survey-extra-msg" v-model="response.message"></textarea>
                    </div>
                    <div class="survey__form-actions">
                        <input type="submit" class="btn btn--small" :value="submit" />
                        <button type="reset" class="btn-link" v-on:click="resetChoice">{{ cancel }}</button>
                    </div>
                </form>
            </div>
        </div>
    </aside>
</template>
